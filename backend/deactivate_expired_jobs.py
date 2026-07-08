import os
import requests
import re
import unicodedata
from dotenv import load_dotenv
from datetime import datetime, timedelta
from db_helper import get_db_connection

load_dotenv()

def slugify(text):
    if not text:
        return ""
    # Normalizar para eliminar acentos y caracteres especiales
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
    text = text.lower().strip()
    text = re.sub(r'\s+', '-', text)           # Espacios por -
    text = re.sub(r'[^\w\-]+', '', text)       # Elimina caracteres especiales
    text = re.sub(r'\-\-+', '-', text)         # Evita guiones dobles
    text = re.sub(r'^-+', '', text)             # Quita guión inicial
    text = re.sub(r'-+$', '', text)             # Quita guión final
    return text

def get_job_slug(job_id, title, title_es, company, location):
    title_part = slugify(title_es or title or '')
    location_part = slugify(location) if location else ''
    company_part = slugify(company) if company and company != 'Desconocida' else ''
    
    parts = [p for p in [title_part, location_part, company_part] if p]
    slug_parts = "-".join(parts)
    return f"{slug_parts}-{job_id}"

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
            job_id, title, title_es, company, location = job
            job_slug = get_job_slug(job_id, title, title_es, company, location)
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

        # 6. Enviar a IndexNow (Bing/Yandex) para desindexar en lote
        if url_list:
            print(f"\n🚀 Enviando {len(url_list)} URLs inactivas a IndexNow para de-indexación...")
            from urllib.parse import urlparse
            host = urlparse(frontend_url).netloc
            key = "85ae2b8a7c644d6a9a7a974b789128f6"
            
            indexnow_payload = {
                "host": host,
                "key": key,
                "keyLocation": f"{frontend_url}/{key}.txt",
                "urlList": url_list
            }
            
            try:
                indexnow_resp = requests.post("https://api.indexnow.org/IndexNow", json=indexnow_payload, headers={"Content-Type": "application/json; charset=utf-8"}, timeout=10)
                if indexnow_resp.status_code == 200:
                    print("✅ URLs enviadas con éxito a IndexNow para de-indexación!")
                else:
                    print(f"⚠️ IndexNow de-indexing falló: {indexnow_resp.status_code} - {indexnow_resp.text}")
            except Exception as e:
                print(f"❌ Error de red enviando a IndexNow: {e}")

    # 7. PURGA: Eliminar ofertas inactivas con más de 90 días de antigüedad
    # Esto asegura que el almacenamiento total de la BD nunca se sature y se mantenga óptimo.
    try:
        purge_limit = datetime.now() - timedelta(days=90)
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
