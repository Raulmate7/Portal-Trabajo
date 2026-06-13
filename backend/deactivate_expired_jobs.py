import os
import requests
import psycopg2
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

def deactivate_expired_jobs():
    print("🧹 Iniciando LIMPIEZA y DESINDEXACIÓN de ofertas expiradas (>30 días)...")

    # 1. Verificar variables de entorno
    cron_secret = os.getenv("CRON_SECRET")
    frontend_url = os.getenv("FRONTEND_URL", "https://portalempleoit.es")
    db_url = os.getenv("DATABASE_URL")

    if not cron_secret:
        print("❌ Error: Falta la variable CRON_SECRET en .env")
        return

    if not db_url:
        print("❌ Error: Falta la variable DATABASE_URL en .env")
        return

    # 2. Conectar a Base de Datos
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
    except Exception as e:
        print(f"❌ Error conectando a BD: {e}")
        return

    # 3. Buscar ofertas que llevan activas más de 30 días
    expiration_limit = datetime.now() - timedelta(days=30)

    cur.execute("""
        SELECT id, title
        FROM jobs
        WHERE is_active = TRUE AND created_at < %s
    """, (expiration_limit,))

    expired_jobs = cur.fetchall()

    if not expired_jobs:
        print("💤 No hay ofertas expiradas para procesar.")
        conn.close()
        return

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
        job_id, title = job
        job_url = f"{frontend_url}/job/{job_id}"
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
        cur.execute("""
            UPDATE jobs
            SET is_active = FALSE
            WHERE id = ANY(%s)
        """, (expired_ids,))
        conn.commit()
        print(f"💾 Base de Datos: {len(expired_ids)} ofertas marcadas como is_active = FALSE.")
    except Exception as e:
        print(f"❌ Error actualizando base de datos: {e}")
        conn.rollback()
    finally:
        conn.close()

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

    print(f"\n🎉 Limpieza completada: {success_count} desindexadas de Google, {len(expired_ids)} inactivadas en BD.")

if __name__ == "__main__":
    deactivate_expired_jobs()
