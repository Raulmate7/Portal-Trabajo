import os
import requests
import re
import unicodedata
from dotenv import load_dotenv
from datetime import datetime, timedelta
from db_helper import get_db_connection
from logic.slug import get_job_slug

load_dotenv()

def deactivate_expired_jobs():
    print("🧹 Iniciando LIMPIEZA, DESINDEXACIÓN y PURGA de ofertas antiguas...")

    # 1. Verificar variables de entorno
    cron_secret = os.getenv("CRON_SECRET")
    frontend_url = os.getenv("FRONTEND_URL", "https://portalempleoit.com")

    if not cron_secret:
        print("❌ Error: Falta la variable CRON_SECRET en el entorno.")
        return

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

    # 3. Buscar ofertas que llevan activas más de 30 días
    expiration_limit = datetime.now() - timedelta(days=30)

    try:
        cur.execute("""
            SELECT id, title, title_es, company, location
            FROM jobs
            WHERE is_active = 1 AND created_at < %s
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

        headers = {
            "Authorization": f"Bearer {cron_secret}",
            "Content-Type": "application/json"
        }

        success_count = 0
        error_count = 0
        url_list = []

        # 4. Enviar desindexación a Google
        for job in expired_jobs:
            job_id = job[0]
            title = job[1]
            title_es = job[2] if len(job) > 2 else None
            company = job[3] if len(job) > 3 else None
            location = job[4] if len(job) > 4 else None
            job_slug = get_job_slug(job_id, title, location=location, company=company, title_es=title_es)
            job_url = f"{frontend_url}/job/{job_slug}"
            url_list.append(job_url)
            
            payload = {
                "url": job_url,
                "type": "URL_DELETED"
            }

            try:
                # Enviamos el tipo URL_DELETED para que la API de Google desindexe la oferta
                response = requests.post(f"{frontend_url}/api/index-job", json=payload, headers=headers, timeout=10)
                if response.status_code == 200:
                    success_count += 1
                    print(f"✅ Google De-indexada con éxito: {title} ({job_url})")
                else:
                    error_count += 1
                    print(f"⚠️ Google De-indexing falló para {job_url}: {response.status_code} - {response.text}")
            except Exception as e:
                error_count += 1
                print(f"❌ Error de red desindexando {job_url}: {e}")

        # 5. Marcar como inactivas en la base de datos
        expired_ids = [job[0] for job in expired_jobs]
        try:
            placeholders = ', '.join(['%s'] * len(expired_ids))
            cur.execute(f"""
                UPDATE jobs
                SET is_active = 0
                WHERE id IN ({placeholders})
            """, tuple(expired_ids))
            conn.commit()
            print(f"💾 Base de Datos: {len(expired_ids)} ofertas marcadas como is_active = 0 (inactivas).")
        except Exception as e:
            print(f"❌ Error inactivando ofertas en base de datos: {e}")
            conn.rollback()

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

        # A.5. Detector activo de enlaces muertos (dead-link checker, FUNC-054) sobre muestra rotativa
        try:
            cur.execute("""
                SELECT id, url_source
                FROM jobs
                WHERE is_active = 1
                  AND url_source IS NOT NULL
                  AND url_source LIKE 'http%'
                  AND created_at < NOW() - INTERVAL 7 DAY
                ORDER BY created_at ASC
                LIMIT 25
            """)
            sample_rows = cur.fetchall()
            dead_ids = []
            for job_id, src_url in sample_rows:
                try:
                    resp = requests.head(src_url, allow_redirects=True, timeout=6, headers={"User-Agent": "PortalTrabajoIT-Bot/1.0"})
                    if resp.status_code in (404, 410):
                        dead_ids.append(job_id)
                except requests.RequestException:
                    pass
            if dead_ids:
                placeholders = ",".join(["%s"] * len(dead_ids))
                cur.execute(f"UPDATE jobs SET is_active = 0 WHERE id IN ({placeholders})", tuple(dead_ids))
                conn.commit()
                print(f"🔗 Dead-link checker: desactivadas {len(dead_ids)} ofertas con 404/410 en origen.")
        except Exception as dl_err:
            print(f"⚠️ Dead-link checker omitido: {dl_err}")

        # B. Purga general de ofertas inactivas muy antiguas (>180 días, preservando ventana 410/redirección SEO-011)
        purge_limit = datetime.now() - timedelta(days=180)
        cur.execute("""
            DELETE FROM jobs
            WHERE is_active = 0 AND created_at < %s
        """, (purge_limit,))
        conn.commit()
        deleted_rows = cur.rowcount
        if deleted_rows > 0:
            print(f"🗑️ Purga BD: Se eliminaron {deleted_rows} ofertas inactivas antiguas (>90 días) para liberar espacio.")
        else:
            print("🗑️ Purga BD: No se encontraron ofertas inactivas antiguas (>90 días) para eliminar.")
    except Exception as e:
        print(f"❌ Error purgando ofertas antiguas de la base de datos: {e}")
        conn.rollback()
    finally:
        conn.close()

    print("\n🎉 Limpieza y purga completadas.")

if __name__ == "__main__":
    deactivate_expired_jobs()
