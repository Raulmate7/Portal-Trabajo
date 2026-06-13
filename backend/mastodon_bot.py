import os
import requests
import psycopg2
import random
from datetime import datetime
import time

def post_to_mastodon(instance, access_token, text_content):
    """Realiza una publicación en la instancia de Mastodon configurada."""
    url = f"https://{instance}/api/v1/statuses"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "status": text_content,
        "visibility": "public"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        if response.status_code in (200, 201):
            result = response.json()
            print(f"✅ Publicado en Mastodon con éxito! ID: {result.get('id')} | URL: {result.get('url')}")
            return True
        else:
            print(f"⚠️ Error al publicar en Mastodon (Código {response.status_code}): {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error de red al conectar con Mastodon: {e}")
        return False

def run_mastodon_bot():
    print("===============================================")
    print("🐘 INICIANDO BOT DE MASTODON (FEDIVERSE)")

    # 1. Configurar credenciales
    access_token = os.getenv("MASTODON_ACCESS_TOKEN")
    instance = os.getenv("MASTODON_INSTANCE", "mastodon.social").replace("https://", "").replace("http://", "").strip("/")
    db_url = os.getenv("DATABASE_URL")
    frontend_url = os.getenv("FRONTEND_URL", "https://portalempleoit.com")

    if not access_token:
        print("⚠️  Falta la credencial MASTODON_ACCESS_TOKEN en las variables de entorno.")
        print("   Omitiendo la publicación automática en Mastodon.")
        print("===============================================")
        return

    if not db_url:
        print("❌ Error: No se encontró la variable DATABASE_URL.")
        print("===============================================")
        return

    # Lista de artículos del blog para fallback
    BLOG_ARTICLES = [
        {"title": "Portal Trabajo IT vs InfoJobs y LinkedIn: ¿Cuál elegir en 2026?", "slug": "portal-trabajo-it-vs-infojobs-linkedin"},
        {"title": "Cómo conseguir tu primer empleo de programador sin experiencia (2026)", "slug": "como-conseguir-primer-empleo-programador-junior-2026"},
        {"title": "Cómo crear un perfil de GitHub que atraiga a reclutadores IT", "slug": "github-portfolio-guia-definitiva-desarrolladores"},
        {"title": "Guía de salarios para programadores en España (2026)", "slug": "guia-salarios-programadores-espana-2026"},
        {"title": "Cómo optimizar tu CV para superar filtros ATS", "slug": "como-optimizar-cv-programador-filtros-ats"},
        {"title": "Cómo superar una entrevista técnica de React", "slug": "como-superar-entrevista-tecnica-react"}
    ]

    # 2. Conectar a la BD y obtener ofertas no publicadas en Mastodon
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        query = """
            SELECT id, title, company, location, salary 
            FROM jobs 
            WHERE is_active = TRUE AND last_tooted_at IS NULL
            ORDER BY created_at DESC 
            LIMIT 5
        """
        cur.execute(query)
        jobs = cur.fetchall()
        
    except Exception as e:
        print(f"❌ Error al consultar PostgreSQL: {e}")
        print("===============================================")
        return

    # Fallback si no hay ofertas nuevas
    if not jobs:
        print("💡 No hay ofertas nuevas sin publicar en Mastodon. Compartiendo artículo del blog...")
        article = random.choice(BLOG_ARTICLES)
        status_text = (
            f"📚 ¡Artículo recomendado de nuestro blog para desarrolladores! 🚀\n\n"
            f"💡 {article['title']}\n\n"
            f"👉 Lee el artículo completo aquí:\n"
            f"🔗 {frontend_url}/blog/{article['slug']}\n\n"
            f"#BlogIT #CarreraIT #DesarrolloSoftware #Programacion #FediJobs #WebDev"
        )
        post_to_mastodon(instance, access_token, status_text)
        
        cur.close()
        conn.close()
        print("===============================================")
        return

    # Publicar hasta 2 ofertas por ejecución
    jobs_to_post = jobs[:2]
    print(f"📣 Seleccionadas {len(jobs_to_post)} ofertas nuevas para tootear.")

    for idx, job in enumerate(jobs_to_post):
        job_id, title, company, location, salary = job
        job_url = f"{frontend_url}/job/{job_id}"
        
        # Extraer hashtags según el título
        title_lower = title.lower()
        tags = ["#FediJobs", "#TrabajoIT"]
        if any(term in location.lower() for term in ["remoto", "remote", "teletrabajo"]):
            tags.append("#Remoto")
        if "react" in title_lower: tags.append("#ReactJS")
        if "python" in title_lower: tags.append("#Python")
        if "java" in title_lower and "javascript" not in title_lower: tags.append("#Java")
        if "node" in title_lower: tags.append("#NodeJS")
        if "devops" in title_lower: tags.append("#DevOps")
        
        hashtags_str = " ".join(tags) + " #Programacion"
        
        # Formatear el toot
        status_text = f"🚀 ¡Nueva oferta de empleo IT recién indexada!\n\n"
        status_text += f"💼 Puesto: {title}\n"
        status_text += f"🏢 Empresa: {company}\n"
        status_text += f"📍 Ubicación: {location}\n"
        if salary and salary != "Consultar" and salary.strip() != "":
            status_text += f"💰 Salario: {salary}\n"
        status_text += "\n"
        status_text += f"👉 Más detalles y postulación en:\n"
        status_text += f"🔗 {job_url}\n\n"
        status_text += hashtags_str

        print(f"\n📝 [Toot {idx+1}/{len(jobs_to_post)}] Preparando toot: {title} en {company}")

        # Publicar en Mastodon
        published = post_to_mastodon(instance, access_token, status_text)

        # Si se publicó, actualizar la BD para marcarla
        if published:
            try:
                cur.execute("UPDATE jobs SET last_tooted_at = %s WHERE id = %s", (datetime.now(), job_id))
                conn.commit()
                print(f"💾 BD actualizada para oferta {job_id} (Mastodon).")
            except Exception as db_err:
                print(f"⚠️ Error al actualizar last_tooted_at en BD: {db_err}")

        # Esperar 30 segundos entre publicaciones
        if idx < len(jobs_to_post) - 1:
            print("💤 Esperando 30 segundos antes del siguiente toot...")
            time.sleep(30)

    try:
        cur.close()
        conn.close()
    except:
        pass

    print("===============================================")

if __name__ == "__main__":
    run_mastodon_bot()
