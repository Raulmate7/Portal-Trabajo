import os
import requests
from dotenv import load_dotenv
from datetime import datetime, timedelta
from db_helper import get_db_connection
from logic.slug import get_job_slug

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

    # 3. Buscar ofertas NUEVAS (Últimas 9 horas) o sin indexar (últimas 48 horas)
    nine_hours_ago = datetime.now() - timedelta(hours=9)
    forty_eight_hours_ago = datetime.now() - timedelta(hours=48)

    try:
        cur.execute("""
            SELECT id, title, location, company
            FROM jobs
            WHERE is_active = TRUE
              AND (
                created_at > %s
                OR (google_indexed_at IS NULL AND created_at > %s)
              )
            ORDER BY created_at DESC
        """, (nine_hours_ago, forty_eight_hours_ago))
        jobs = cur.fetchall()
    except Exception as e:
        print(f"❌ Error ejecutando consulta SQL en base de datos: {e}")
        conn.close()
        return

    if not jobs:
        print("💤 No hay ofertas nuevas en las últimas 9 horas o pendientes en 48 horas para indexar.")
        conn.close()
        return

    print(f"🚀 Encontradas {len(jobs)} ofertas para indexar.")

    headers = {
        "Authorization": f"Bearer {cron_secret}",
        "Content-Type": "application/json"
    }

    success_count = 0
    error_count = 0
    url_list = []

    for job in jobs:
        job_id, title, location, company = job
        job_url = f"{frontend_url}/job/{get_job_slug(job_id, title, location, company)}"
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
                
                # Actualizar google_indexed_at en base de datos
                try:
                    cur.execute("""
                        UPDATE jobs
                        SET google_indexed_at = NOW()
                        WHERE id = %s
                    """, (job_id,))
                    conn.commit()
                except Exception as db_err:
                    print(f"⚠️ Error actualizando google_indexed_at para {job_id}: {db_err}")
            else:
                error_count += 1
                print(f"⚠️ Google Indexing falló para {job_url}: {response.status_code} - {response.text}")
        except Exception as e:
            error_count += 1
            print(f"❌ Error de red indexando {job_url}: {e}")

    conn.close()
    print(f"\n🎉 Google Indexing completado: {success_count} indexados, {error_count} fallidos.")

    # 4. Enviar a IndexNow (Bing/Yandex) en lote usando INDEXNOW_KEY de entorno (SEC-047)
    if url_list:
        print(f"\n🚀 Enviando {len(url_list)} URLs a IndexNow (Bing/Yandex)...")
        from logic.indexnow import submit_urls_to_indexnow
        submit_urls_to_indexnow(url_list, frontend_url, timeout=10)

if __name__ == "__main__":
    index_new_jobs()
