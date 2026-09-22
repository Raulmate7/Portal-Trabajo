import os
import requests
import psycopg2
import random
from datetime import datetime
import time
from logic.slug import get_job_slug

def post_to_bluesky(handle, password, text_content):
    """Autentica y publica una entrada en la red social Bluesky (AT Protocol)."""
    auth_url = "https://bsky.social/xrpc/com.atproto.server.createSession"
    try:
        auth_res = requests.post(auth_url, json={"identifier": handle, "password": password}, timeout=15)
        if auth_res.status_code != 200:
            print(f"⚠️ Error autenticando en Bluesky (Código {auth_res.status_code}): {auth_res.text}")
            return False
            
        session = auth_res.json()
        access_token = session.get("accessJwt")
        did = session.get("did")
        
        post_url = "https://bsky.social/xrpc/com.atproto.repo.createRecord"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        now_iso = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
        payload = {
            "repo": did,
            "collection": "app.bsky.feed.post",
            "record": {
                "$type": "app.bsky.feed.post",
                "text": text_content,
                "createdAt": now_iso
            }
        }
        
        post_res = requests.post(post_url, json=payload, headers=headers, timeout=15)
        if post_res.status_code in (200, 201):
            result = post_res.json()
            print(f"✅ Publicado en Bluesky con éxito! URI: {result.get('uri')}")
            return True
        else:
            print(f"⚠️ Error al publicar en Bluesky (Código {post_res.status_code}): {post_res.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error de red al conectar con la API de Bluesky: {e}")
        return False

def run_bluesky_bot():
    print("===============================================")
    print("🦋 INICIANDO BOT DE BLUESKY (AT PROTOCOL)")

    handle = os.getenv("BLUESKY_HANDLE")
    password = os.getenv("BLUESKY_APP_PASSWORD")
    db_url = os.getenv("DATABASE_URL")
    frontend_url = os.getenv("FRONTEND_URL", "https://portalempleoit.com")

    if not handle or not password:
        print("⚠️  Faltan las credenciales BLUESKY_HANDLE o BLUESKY_APP_PASSWORD en las variables de entorno.")
        print("   Omitiendo publicación en Bluesky.")
        print("===============================================")
        return

    if not db_url:
        print("❌ Error: No se encontró la variable DATABASE_URL.")
        print("===============================================")
        return

    BLOG_ARTICLES = [
        {"title": "Portal Trabajo IT vs InfoJobs y LinkedIn: ¿Cuál elegir en 2026?", "slug": "portal-trabajo-it-vs-infojobs-linkedin"},
        {"title": "Cómo conseguir tu primer empleo de programador sin experiencia (2026)", "slug": "como-conseguir-primer-empleo-programador-junior-2026"},
        {"title": "Cómo crear un perfil de GitHub que atraiga a reclutadores IT", "slug": "github-portfolio-guia-definitiva-desarrolladores"},
        {"title": "Guía de salarios para programadores en España (2026)", "slug": "guia-salarios-programadores-espana-2026"},
        {"title": "Cómo optimizar tu CV para superar filtros ATS", "slug": "como-optimizar-cv-programador-filtros-ats"}
    ]

    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        query = """
            SELECT id, title, company, location, salary, category 
            FROM jobs 
            WHERE is_active = TRUE AND last_bluesky_posted_at IS NULL
            ORDER BY created_at DESC 
            LIMIT 3
        """
        cur.execute(query)
        jobs = cur.fetchall()
        
    except Exception as e:
        print(f"❌ Error consultando base de datos: {e}")
        print("===============================================")
        return

    if not jobs:
        print("💡 No hay ofertas nuevas sin publicar en Bluesky. Compartiendo artículo del blog...")
        article = random.choice(BLOG_ARTICLES)
        post_text = (
            f"📚 Guía recomendada para desarrolladores:\n\n"
            f"💡 {article['title']}\n\n"
            f"🔗 {frontend_url}/blog/{article['slug']}?utm_source=bluesky&utm_medium=social\n\n"
            f"#TechJobs #WebDev #Programacion #CareerTech"
        )
        post_to_bluesky(handle, password, post_text)
        cur.close()
        conn.close()
        print("===============================================")
        return

    jobs_to_post = jobs[:2]
    print(f"📣 Seleccionadas {len(jobs_to_post)} ofertas para publicar en Bluesky.")

    for idx, job in enumerate(jobs_to_post):
        job_id, title, company, location, salary, category = job
        job_url = f"{frontend_url}/job/{get_job_slug(job_id, title, location, company)}?utm_source=bluesky&utm_medium=social"
        
        post_text = f"🚀 Nueva vacante IT en España:\n\n"
        post_text += f"💼 {title}\n"
        post_text += f"🏢 {company}\n"
        post_text += f"📍 {location}\n"
        if salary and salary != "Consultar" and salary.strip() != "":
            post_text += f"💰 {salary}\n"
        post_text += f"\n🔗 Aplicar aquí: {job_url}\n\n"
        post_text += "#EmpleoIT #TechJobs #Programacion #Remoto"

        print(f"📝 [Bluesky {idx+1}/{len(jobs_to_post)}] Publicando: {title} en {company}")
        published = post_to_bluesky(handle, password, post_text)

        if published:
            try:
                cur.execute("UPDATE jobs SET last_bluesky_posted_at = %s WHERE id = %s", (datetime.now(), job_id))
                conn.commit()
            except Exception as db_err:
                print(f"⚠️ Error actualizando last_bluesky_posted_at: {db_err}")

        if idx < len(jobs_to_post) - 1:
            time.sleep(15)

    try:
        cur.close()
        conn.close()
    except:
        pass
    print("===============================================")

if __name__ == "__main__":
    run_bluesky_bot()
