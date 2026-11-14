import os
import psycopg2
from logic.slug import get_job_slug
from logic.indexnow import submit_urls_to_indexnow

def submit_index_now():
    print("===============================================")
    print("🚀 INICIANDO INDEXNOW (INDEXACIÓN INSTANTÁNEA BING & SEZNAM)")

    db_url = os.getenv("DATABASE_URL")
    frontend_url = os.getenv("FRONTEND_URL", "https://portalempleoit.com").rstrip('/')
    host = frontend_url.replace("https://", "").replace("http://", "")

    if not db_url:
        print("❌ Error: No se encontró DATABASE_URL.")
        print("===============================================")
        return

    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Obtener vacantes creadas en las últimas 12 horas
        cur.execute("""
            SELECT id, title, company, location 
            FROM jobs 
            WHERE is_active = TRUE AND created_at >= NOW() - INTERVAL 12 HOUR
            ORDER BY created_at DESC 
            LIMIT 50
        """)
        jobs = cur.fetchall()
        
        if not jobs:
            print("💤 No hay ofertas nuevas creadas en las últimas 12 horas para IndexNow.")
            print("===============================================")
            cur.close()
            conn.close()
            return

        urls = [f"{frontend_url}/job/{get_job_slug(j[0], j[1], j[3], j[2])}" for j in jobs]
        urls.append(f"{frontend_url}/sitemap-news.xml")

        submit_urls_to_indexnow(urls, frontend_url, timeout=15)

        cur.close()
        conn.close()

    except Exception as e:
        print(f"❌ Error durante la ejecución de IndexNow: {e}")

    print("===============================================")

if __name__ == "__main__":
    submit_index_now()
