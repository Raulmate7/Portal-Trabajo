import os
import random
import psycopg2
import tweepy
from datetime import datetime, timedelta
import time
from logic.image_generator import generate_job_card
from logic.slug import get_job_slug

def get_sector_slug(title, category):
    title_lower = (title or "").lower()
    # Coincidencia con tecnologías específicas
    if "react" in title_lower: return "react"
    elif "node" in title_lower: return "node"
    elif "python" in title_lower: return "python"
    elif "java" in title_lower and "javascript" not in title_lower: return "java"
    elif "devops" in title_lower: return "devops"
    elif "aws" in title_lower: return "aws"
    elif "angular" in title_lower: return "angular"
    elif "vue" in title_lower: return "vue"
    elif "flutter" in title_lower: return "flutter"
    elif "kotlin" in title_lower: return "kotlin"
    elif "swift" in title_lower: return "swift"
    
    # Mapeo de categorías generales
    cat_map = {
        'Backend': 'backend',
        'Frontend': 'frontend',
        'Data & AI': 'data',
        'Cloud & DevOps': 'cloud',
        'Mobile': 'mobile',
    }
    return cat_map.get(category, 'informatica-tecnologia')


# Plantillas de Tweet expuestas a nivel de módulo
TEMPLATES = [
    "🚀 ¡Nueva oferta de empleo en tecnología!\n\n💼 {title}\n🏢 {company}\n📍 {location}\n\n👉 Detalles: {url}\n🔍 Más ofertas: {cat_url}\n\n{hashtags}",
    "🔥 ¿Buscas un nuevo reto IT? Te traemos esta vacante recién publicada:\n\n💼 {title}\n🏢 {company}\n📍 {location}\n\n👉 Info: {url}\n🔍 Más: {cat_url}\n\n{hashtags}",
    "💻 ¡Oportunidad laboral tech disponible!\n\n💼 {title}\n🏢 {company}\n📍 {location}\n\n👉 Aplica: {url}\n🔍 Más: {cat_url}\n\n{hashtags}",
    "🌟 Únete al equipo. Se busca talento especializado:\n\n💼 {title}\n🏢 {company}\n📍 {location}\n\n👉 Info y aplicar: {url}\n🔍 Más: {cat_url}\n\n{hashtags}"
]

def run_twitter_bot():
    print("===============================================")
    print("🤖 INICIANDO BOT DE TWITTER")

    # 1. Configurar credenciales de Twitter
    twitter_api_key = os.getenv("TWITTER_API_KEY")
    twitter_api_secret = os.getenv("TWITTER_API_SECRET")
    twitter_access_token = os.getenv("TWITTER_ACCESS_TOKEN")
    twitter_access_secret = os.getenv("TWITTER_ACCESS_SECRET")
    db_url = os.getenv("DATABASE_URL")
    base_url = os.getenv("FRONTEND_URL", "https://portalempleoit.com")

    if not all([twitter_api_key, twitter_api_secret, twitter_access_token, twitter_access_secret]):
        print("⚠️  Faltan credenciales de Twitter en las variables de entorno. Omitiendo publicación.")
        return

    if not db_url:
        print("❌ No se encontró DATABASE_URL.")
        return

    # 2. Conectar a Twitter
    try:
        client = tweepy.Client(
            consumer_key=twitter_api_key,
            consumer_secret=twitter_api_secret,
            access_token=twitter_access_token,
            access_token_secret=twitter_access_secret
        )
        print("✅ Conectado a la API de Twitter (X) v2.")
    except Exception as e:
        print(f"❌ Error al conectar con Twitter: {e}")
        return

    # Lista de artículos recomendados para publicar cuando no hay ofertas nuevas
    BLOG_ARTICLES = [
        {"title": "Portal Trabajo IT vs InfoJobs y LinkedIn: ¿Cuál elegir en 2026?", "slug": "portal-trabajo-it-vs-infojobs-linkedin"},
        {"title": "Cómo conseguir tu primer empleo de programador sin experiencia (2026)", "slug": "como-conseguir-primer-empleo-programador-junior-2026"},
        {"title": "Cómo crear un perfil de GitHub que atraiga a reclutadores IT", "slug": "github-portfolio-guia-definitiva-desarrolladores"},
        {"title": "Guía de salarios para programadores en España (2026)", "slug": "guia-salarios-programadores-espana-2026"},
        {"title": "Cómo optimizar tu CV para superar filtros ATS", "slug": "como-optimizar-cv-programador-filtros-ats"},
        {"title": "Cómo superar una entrevista técnica de React", "slug": "como-superar-entrevista-tecnica-react"}
    ]

    # 3. Conectar a BD y extraer ofertas no tuiteadas
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Buscamos ofertas activas que no hayan sido tuiteadas
        query = """
            SELECT id, title, company, location, salary, category 
            FROM jobs 
            WHERE is_active = TRUE AND last_tweeted_at IS NULL
            ORDER BY created_at DESC 
            LIMIT 10
        """
        cur.execute(query)
        recent_jobs = cur.fetchall()
        
    except Exception as e:
        print(f"❌ Error al consultar PostgreSQL: {e}")
        return

    # Fallback si no hay ofertas nuevas: publicamos un artículo del blog
    if not recent_jobs:
        print("🤷‍♂️ No hay ofertas nuevas sin tuitear. Publicando contenido educativo del blog...")
        article = random.choice(BLOG_ARTICLES)
        tweet_text = (
            f"📚 ¡Artículo recomendado del blog!\n\n"
            f"💡 {article['title']}\n\n"
            f"👉 Lee el artículo completo aquí: {base_url}/blog/{article['slug']}\n\n"
            f"#BlogIT #DesarrolloSoftware #Programacion #EmpleoIT #Frontend #Backend"
        )
        try:
            response = client.create_tweet(text=tweet_text)
            print(f"✅ Tweet de blog publicado con éxito! ID: {response.data['id']}")
        except Exception as e:
            print(f"❌ Error al publicar tweet de blog: {e}")
        
        cur.close()
        conn.close()
        return

    # Seleccionar hasta 3 ofertas para publicar
    jobs_to_tweet = recent_jobs[:3]
    print(f"📣 Seleccionadas {len(jobs_to_tweet)} ofertas nuevas para publicar en Twitter (X).")

    for idx, job in enumerate(jobs_to_tweet):
        job_id, title, company, location, salary, category = job
        
        # Extraer tecnología para hashtags
        title_lower = title.lower()
        tags = ["#TrabajoRemoto" if "remoto" in location.lower() or "remote" in location.lower() else "#EmpleoIT"]
        if "react" in title_lower: tags.append("#ReactJS")
        if "python" in title_lower: tags.append("#Python")
        if "java" in title_lower and "javascript" not in title_lower: tags.append("#Java")
        if "node" in title_lower: tags.append("#NodeJS")
        if "devops" in title_lower or "aws" in title_lower: tags.append("#DevOps")
        if "angular" in title_lower: tags.append("#Angular")
        if "vue" in title_lower: tags.append("#VueJS")
        if "flutter" in title_lower: tags.append("#Flutter")
        
        hashtags_str = " ".join(tags) + " #Programacion"
        job_url = f"{base_url}/job/{get_job_slug(job_id, title, location, company)}"
        cat_slug = get_sector_slug(title, category)
        cat_url = f"{base_url}/trabajos/{cat_slug}"
        
        # Formatear el Tweet usando una plantilla aleatoria
        template = random.choice(TEMPLATES)
        tweet_text = template.format(
            title=title,
            company=company,
            location=location,
            url=job_url,
            cat_url=cat_url,
            hashtags=hashtags_str
        )
        
        print(f"\n📝 Preparando Tweet {idx+1}/{len(jobs_to_tweet)}:\n{tweet_text}\n")
        
        # Generar la imagen para adjuntar
        image_path = f"temp_card_{job_id}.png"
        has_image = False
        try:
            generate_job_card(
                title=title,
                company=company,
                location=location,
                salary=salary,
                output_path=image_path
            )
            has_image = os.path.exists(image_path)
        except Exception as img_err:
            print(f"⚠️ No se pudo generar la tarjeta de imagen para el tweet: {img_err}")
        
        # Enviar el Tweet (con imagen si es posible, fallback a texto)
        published = False
        try:
            # Intentamos subir la imagen con API v1.1
            if has_image:
                try:
                    auth = tweepy.OAuth1UserHandler(
                        twitter_api_key, twitter_api_secret,
                        twitter_access_token, twitter_access_secret
                    )
                    api = tweepy.API(auth)
                    media = api.media_upload(filename=image_path)
                    response = client.create_tweet(text=tweet_text, media_ids=[media.media_id])
                    print(f"✅ ¡Tweet {idx+1} publicado con imagen! ID: {response.data['id']}")
                    published = True
                except Exception as media_err:
                    print(f"⚠️ Falló la subida de imagen a Twitter ({media_err}). Reintentando solo texto...")
            
            # Fallback a tweet de solo texto
            if not published:
                response = client.create_tweet(text=tweet_text)
                print(f"✅ ¡Tweet {idx+1} publicado (solo texto)! ID: {response.data['id']}")
                published = True
                
        except Exception as e:
            print(f"❌ Error al enviar el Tweet {idx+1}: {e}")
                    
        # Limpiar archivo temporal si existe
        if has_image and os.path.exists(image_path):
            try:
                os.remove(image_path)
            except:
                pass
                
        # Si se publicó con éxito, actualizamos la base de datos
        if published:
            try:
                cur.execute("UPDATE jobs SET last_tweeted_at = %s WHERE id = %s", (datetime.now(), job_id))
                conn.commit()
                print(f"💾 BD actualizada para oferta {job_id}.")
            except Exception as db_err:
                print(f"⚠️ Error al actualizar last_tweeted_at en BD: {db_err}")
                
        # Esperar 60 segundos antes de enviar el siguiente tweet
        if idx < len(jobs_to_tweet) - 1:
            print("💤 Esperando 60 segundos antes de enviar el siguiente tweet...")
            time.sleep(60)

    # Cerrar conexiones
    try:
        cur.close()
        conn.close()
    except:
        pass

    print("===============================================")
    import sys
    sys.stdout.flush()

if __name__ == "__main__":
    run_twitter_bot()
