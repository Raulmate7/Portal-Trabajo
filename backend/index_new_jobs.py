import os
import requests
from dotenv import load_dotenv
from datetime import datetime, timedelta
from db_helper import get_db_connection

load_dotenv()

def index_new_jobs():
    print("📣 Iniciando INDEXACIÓN INSTANTÁNEA en Google...")

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
        print(f"❌ Error conectando a BD: {e}")
        return

    # 3. Buscar ofertas NUEVAS (Últimas 7 horas)
    time_window = datetime.now() - timedelta(hours=7)

    try:
        cur.execute("""
            SELECT id, title
            FROM jobs
            WHERE created_at > %s
            ORDER BY created_at DESC
        """, (time_window,))
        jobs = cur.fetchall()
    except Exception as e:
        print(f"❌ Error ejecutando consulta SQL en base de datos: {e}")
        conn.close()
        return
    finally:
        conn.close()

    if not jobs:
        print("💤 No hay ofertas nuevas en las últimas 7 horas para indexar.")
        return

    print(f"🚀 Encontradas {len(jobs)} ofertas nuevas para indexar.")

    headers = {
        "Authorization": f"Bearer {cron_secret}",
        "Content-Type": "application/json"
    }

    success_count = 0
    error_count = 0
    url_list = []

    for job in jobs:
        job_id, title = job
        job_url = f"{frontend_url}/job/{job_id}"
        url_list.append(job_url)
        payload = {
            "url": job_url,
            "type": "URL_UPDATED"
        }

        try:
            response = requests.post(f"{frontend_url}/api/index-job", json=payload, headers=headers, timeout=10)
            if response.status_code == 200:
                success_count += 1
                print(f"✅ Google Indexada con éxito: {title} ({job_url})")
            else:
                error_count += 1
                print(f"⚠️ Google Indexing falló para {job_url}: {response.status_code} - {response.text}")
        except Exception as e:
            error_count += 1
            print(f"❌ Error de red indexando {job_url}: {e}")

    print(f"\n🎉 Google Indexing completado: {success_count} indexados, {error_count} fallidos.")

    # 4. Enviar a IndexNow (Bing/Yandex) en lote
    if url_list:
        print(f"\n🚀 Enviando {len(url_list)} URLs a IndexNow (Bing/Yandex)...")
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
                print("✅ URLs enviadas con éxito a IndexNow!")
            else:
                print(f"⚠️ IndexNow falló: {indexnow_resp.status_code} - {indexnow_resp.text}")
        except Exception as e:
            print(f"❌ Error de red enviando a IndexNow: {e}")

if __name__ == "__main__":
    index_new_jobs()
