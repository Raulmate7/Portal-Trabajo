import os
import requests
import psycopg2
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

def index_new_jobs():
    print("📣 Iniciando INDEXACIÓN INSTANTÁNEA en Google...")

    # 1. Verificar variables de entorno
    cron_secret = os.getenv("CRON_SECRET")
    frontend_url = os.getenv("FRONTEND_URL", "https://portal-trabajo.vercel.app")
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

    # 3. Buscar ofertas NUEVAS (Últimas 7 horas)
    time_window = datetime.now() - timedelta(hours=7)

    cur.execute("""
        SELECT id, title
        FROM jobs
        WHERE created_at > %s
        ORDER BY created_at DESC
    """, (time_window,))

    jobs = cur.fetchall()
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

    for job in jobs:
        job_id, title = job
        job_url = f"{frontend_url}/job/{job_id}"
        payload = {
            "url": job_url,
            "type": "URL_UPDATED"
        }

        try:
            response = requests.post(f"{frontend_url}/api/index-job", json=payload, headers=headers, timeout=10)
            if response.status_code == 200:
                success_count += 1
                print(f"✅ Indexada con éxito: {title} ({job_url})")
            else:
                error_count += 1
                print(f"⚠️ Google Indexing falló para {job_url}: {response.status_code} - {response.text}")
        except Exception as e:
            error_count += 1
            print(f"❌ Error de red indexando {job_url}: {e}")

    print(f"\n🎉 Google Indexing completado: {success_count} indexados, {error_count} fallidos.")

if __name__ == "__main__":
    index_new_jobs()
