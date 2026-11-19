import os
import requests
import re
import unicodedata
from dotenv import load_dotenv
from datetime import datetime, timedelta
from db_helper import get_db_connection
from logic.slug import get_job_slug
from logic.ssrf import safe_http_head, safe_http_get

load_dotenv()

def deactivate_expired_jobs():
    print("🧹 Iniciando LIMPIEZA, DESINDEXACIÓN y PURGA de ofertas antiguas...")

    # 1. Verificar variables de entorno (BUG-016: sin CRON_SECRET solo se omite la llamada HTTP, no la limpieza BD)
    cron_secret = os.getenv("CRON_SECRET")
    frontend_url = os.getenv("FRONTEND_URL", "https://portalempleoit.com")
    can_notify_indexing = bool(cron_secret)

    if not can_notify_indexing:
        print("⚠️ Aviso: Falta CRON_SECRET en el entorno; se ejecutará la limpieza en BD omitiendo /api/index-job.")

    # 2. Conectar a Base de Datos
    try:
        conn = get_db_connection()
        cur = conn.cursor()
    except Exception as e:
        print(f"❌ Error conectando a la base de datos: {e}")
        return

    # 2.5. Expirar estado destacado de las ofertas cuyo plazo haya vencido
    try:
        print("⭐ Expirando estado destacado de ofertas vencidas...")
        cur.execute("""
            UPDATE jobs
            SET is_featured = 0
            WHERE is_featured = 1 AND featured_expires_at IS NOT NULL AND featured_expires_at < NOW()
        """)
        conn.commit()
        affected = cur.rowcount
        if affected > 0:
            print(f"💾 Base de Datos: Se ha expirado el estado destacado para {affected} ofertas.")
    except Exception as e:
        print(f"❌ Error al expirar estado destacado en base de datos: {e}")
        conn.rollback()

    # 3. Buscar ofertas que llevan activas más de 45 días (ventana óptima para Google for Jobs + 30d de recirculación)
    expiration_limit = datetime.now() - timedelta(days=45)

    try:
        cur.execute("""
            SELECT id, title, title_es, company, location
            FROM jobs
            WHERE is_active = 1 AND created_at < %s
            ORDER BY created_at ASC
            LIMIT 40
        """, (expiration_limit,))
        expired_jobs = cur.fetchall()
    except Exception as e:
        print(f"❌ Error consultando ofertas expiradas: {e}")
        conn.close()
        return

    if not expired_jobs:
        print("💤 No hay ofertas expiradas para procesar.")
    else:
        print(f"📦 Encontradas {len(expired_jobs)} ofertas expiradas para desactivar y desindexar.")

        # 4. Marcar como inactivas en la base de datos primero (rápido e idempotente)
        expired_ids = [job[0] for job in expired_jobs]
        try:
            placeholders = ', '.join(['%s'] * len(expired_ids))
            cur.execute(f"""
                UPDATE jobs
                SET is_active = 0, expired_at = COALESCE(expired_at, NOW())
                WHERE id IN ({placeholders})
            """, tuple(expired_ids))
            conn.commit()
            print(f"💾 Base de Datos: {len(expired_ids)} ofertas marcadas como is_active = 0 (inactivas).")
        except Exception as e:
            print(f"❌ Error inactivando ofertas en base de datos: {e}")
            conn.rollback()

        headers = {
            "Authorization": f"Bearer {cron_secret}",
            "Content-Type": "application/json"
        }

        success_count = 0
        error_count = 0
        url_list = []

        # 5. Enviar desindexación a Google (máximo 40 por ejecución para respetar cuota y evitar timeouts)
        for job in expired_jobs[:40]:
            job_id = job[0]
            title = job[1]
            title_es = job[2] if len(job) > 2 else None
            company = job[3] if len(job) > 3 else None
            location = job[4] if len(job) > 4 else None
            job_slug = get_job_slug(job_id, title, location=location, company=company, title_es=title_es)
            job_url = f"{frontend_url}/job/{job_slug}"
            url_list.append(job_url)

            if not can_notify_indexing:
                continue
            
            payload = {
                "url": job_url,
                "type": "URL_DELETED"
            }

            try:
                response = requests.post(f"{frontend_url}/api/index-job", json=payload, headers=headers, timeout=6)
                if response.status_code == 200:
                    success_count += 1
                else:
                    error_count += 1
            except Exception:
                error_count += 1

        if success_count or error_count:
            print(f"📉 Google De-indexing: {success_count} OK, {error_count} fallos.")

        # 6. Enviar a IndexNow (Bing/Yandex) para desindexar en lote usando INDEXNOW_KEY de entorno (SEC-047)
        if url_list:
            print(f"\n🚀 Enviando {len(url_list)} URLs inactivas a IndexNow para de-indexación...")
            from logic.indexnow import submit_urls_to_indexnow
            submit_urls_to_indexnow(url_list, frontend_url, timeout=10)

    # 7. PURGA: Eliminar ofertas inactivas con más de 90 días de antigüedad
    # y ofertas de pago huérfanas/abandonadas en checkout con más de 48 horas (Vulnerabilidad 5).
    # Esto asegura que el almacenamiento total de la BD nunca se sature y se mantenga óptimo.
    try:
        # A. Purga de ofertas de pago abandonadas (creadas por /api/checkout que nunca llegaron a pagarse)
        abandoned_limit = datetime.now() - timedelta(hours=48)
        cur.execute("""
            DELETE FROM jobs
            WHERE is_active = 0 
              AND (is_featured = 0 OR is_featured IS NULL)
              AND plan IS NOT NULL 
              AND plan != 'basico'
              AND created_at < %s
        """, (abandoned_limit,))
        conn.commit()
        abandoned_count = cur.rowcount
        if abandoned_count > 0:
            print(f"🗑️ Purga BD: Se eliminaron {abandoned_count} ofertas de pago huérfanas/abandonadas (>48h).")

        # A.2. SEC-060: Purga de borradores comerciales abandonados (>48h) en sponsored_jobs y newsletter_sponsors
        for sponsor_tbl in ("sponsored_jobs", "newsletter_sponsors"):
            try:
                cur.execute(
                    f"DELETE FROM {sponsor_tbl} WHERE status = 'pendiente' AND created_at < %s",
                    (abandoned_limit,),
                )
                conn.commit()
                if cur.rowcount > 0:
                    print(f"🗑️ Purga BD ({sponsor_tbl}): eliminados {cur.rowcount} borradores 'pendiente' (>48h).")
            except Exception:
                conn.rollback()

        # A.5. Detector activo de enlaces muertos (dead-link checker, FUNC-054) sobre muestra rotativa
        try:
            cur.execute("""
                SELECT id, url_source
                FROM jobs
                WHERE is_active = 1
                  AND url_source IS NOT NULL
                  AND url_source LIKE 'http%'
                  AND created_at < NOW() - INTERVAL 7 DAY
                ORDER BY RAND()
                LIMIT 50
            """)
            sample_rows = cur.fetchall()
            dead_ids = []
            for job_id, src_url in sample_rows:
                try:
                    resp = safe_http_head(src_url, headers={"User-Agent": "PortalTrabajoIT-Bot/1.0"}, timeout=(4, 6))
                    if resp.status_code in (403, 405, 501):
                        get_resp = safe_http_get(
                            src_url,
                            headers={"User-Agent": "PortalTrabajoIT-Bot/1.0"},
                            timeout=(4, 6),
                            max_bytes=16384,
                        )
                        if get_resp.status_code in (404, 410):
                            dead_ids.append(job_id)
                    elif resp.status_code in (404, 410):
                        dead_ids.append(job_id)
                except (requests.RequestException, ValueError):
                    pass
            if dead_ids:
                placeholders = ",".join(["%s"] * len(dead_ids))
                cur.execute(f"UPDATE jobs SET is_active = 0 WHERE id IN ({placeholders})", tuple(dead_ids))
                conn.commit()
                print(f"🔗 Dead-link checker: desactivadas {len(dead_ids)} ofertas con 404/410 en origen.")
        except Exception as dl_err:
            print(f"⚠️ Dead-link checker omitido: {dl_err}")

        # B. Purga por ciclo de vida (solo tras 30 días de recirculación inactiva después de expirar)
        recirculation_cutoff = datetime.now() - timedelta(days=30)
        grace_recirculation_cutoff = datetime.now() - timedelta(days=40)

        # Registrar tombstones (301 para ofertas con tracción, 410 para el resto) antes de purgar
        try:
            cur.execute("""
                SELECT id, category, normalized_city, company, impressions_count, clicks_count
                FROM jobs
                WHERE is_active = 0
                  AND COALESCE(expired_at, updated_at) < %s
                  AND (is_featured = 0 OR is_featured IS NULL)
                LIMIT 500
            """, (recirculation_cutoff,))
            tomb_rows = cur.fetchall()
            if tomb_rows:
                tomb_inserts = []
                for j_id, j_cat, j_city, j_comp, imp_cnt, clk_cnt in tomb_rows:
                    has_equity = (imp_cnt or 0) >= 500 or (clk_cnt or 0) >= 50
                    if has_equity:
                        cat_slug = re.sub(r'[^a-z0-9]+', '-', (j_cat or 'informatica-tecnologia').lower()).strip('-') or 'informatica-tecnologia'
                        if j_city == 'remoto':
                            redir = f"/trabajos/{cat_slug}-remoto"
                        elif j_city:
                            redir = f"/trabajos/{cat_slug}-en-{j_city}"
                        else:
                            redir = f"/trabajos/{cat_slug}"
                        tomb_inserts.append((str(j_id), '301', redir))
                    else:
                        tomb_inserts.append((str(j_id), '410', None))
                cur.executemany("""
                    INSERT IGNORE INTO expired_jobs_tombstones (job_id, action, redirect_path)
                    VALUES (%s, %s, %s)
                """, tomb_inserts)
                conn.commit()
        except Exception as tomb_err:
            print(f"⚠️ Registro de tombstones omitido: {tomb_err}")
            conn.rollback()

        cur.execute("SHOW TABLES LIKE 'user_saved_jobs'")
        has_saved_table = cur.fetchone() is not None

        if has_saved_table:
            # 1) Eliminar ofertas inactivas con >= 30 días de recirculación que NINGÚN usuario tenga guardadas
            cur.execute("""
                DELETE FROM jobs
                WHERE is_active = 0
                  AND updated_at < %s
                  AND (is_featured = 0 OR is_featured IS NULL)
                  AND NOT EXISTS (
                      SELECT 1 FROM user_saved_jobs usj
                      WHERE usj.job_id = CAST(jobs.id AS CHAR)
                  )
            """, (recirculation_cutoff,))
            deleted_unsaved = cur.rowcount

            # 2) Eliminar ofertas inactivas con >= 40 días de recirculación aunque estuvieran guardadas
            cur.execute("""
                DELETE FROM jobs
                WHERE is_active = 0
                  AND updated_at < %s
                  AND (is_featured = 0 OR is_featured IS NULL)
            """, (grace_recirculation_cutoff,))
            deleted_grace = cur.rowcount

            # 3) Limpiar referencias huérfanas en user_saved_jobs
            cur.execute("""
                DELETE usj FROM user_saved_jobs usj
                LEFT JOIN jobs j ON CAST(j.id AS CHAR) = usj.job_id
                WHERE j.id IS NULL
            """)
            deleted_refs = cur.rowcount
            conn.commit()
            print(f"🗑️ Purga BD: {deleted_unsaved} sin guardar (>30d inactivas), {deleted_grace} fin de gracia (>40d inactivas), {deleted_refs} refs guardadas limpiadas.")
        else:
            cur.execute("""
                DELETE FROM jobs
                WHERE is_active = 0
                  AND updated_at < %s
                  AND (is_featured = 0 OR is_featured IS NULL)
            """, (recirculation_cutoff,))
            conn.commit()
            deleted_rows = cur.rowcount
            print(f"🗑️ Purga BD: Se eliminaron {deleted_rows} ofertas inactivas con más de 30 días de recirculación.")
    except Exception as e:
        print(f"❌ Error purgando ofertas antiguas de la base de datos: {e}")
        conn.rollback()
    finally:
        conn.close()

    print("\n🎉 Limpieza y purga completadas.")

if __name__ == "__main__":
    deactivate_expired_jobs()
