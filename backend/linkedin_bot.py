import os
import requests
import psycopg2
import random
from datetime import datetime
import time
from logic.image_generator import generate_job_card
from logic.slug import get_job_slug

def upload_image_to_linkedin(access_token, urn, image_path, job_title):
    """
    Sube una imagen a LinkedIn y devuelve el Asset URN.
    Sigue el flujo de registro de asset, subida binaria y confirmación.
    """
    print(f"📸 Registrando imagen en LinkedIn: {image_path}...")
    
    # Paso 1: Registrar la subida
    register_url = "https://api.linkedin.com/v2/assets?action=registerUpload"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0"
    }
    
    payload = {
        "registerUploadRequest": {
            "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
            "owner": urn,
            "serviceRelationships": [
                {
                    "relationshipType": "OWNER",
                    "identifier": "urn:li:userGeneratedContent"
                }
            ]
        }
    }
    
    try:
        res = requests.post(register_url, json=payload, headers=headers, timeout=15)
        if res.status_code not in (200, 201):
            print(f"⚠️ Error al registrar subida de imagen (Código {res.status_code}): {res.text}")
            return None
            
        res_data = res.json()
        upload_mech = res_data["value"]["uploadMechanism"]["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]
        upload_url = upload_mech["uploadUrl"]
        asset_urn = res_data["value"]["asset"]
        
        # Paso 2: Subir el archivo binario
        print("📤 Subiendo bytes binarios de la imagen a LinkedIn...")
        with open(image_path, "rb") as f:
            image_data = f.read()
            
        put_headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "image/png"
        }
        
        put_res = requests.put(upload_url, data=image_data, headers=put_headers, timeout=20)
        if put_res.status_code not in (200, 201, 204):
            print(f"⚠️ Error en la subida binaria de la imagen (Código {put_res.status_code}): {put_res.text}")
            return None
            
        print(f"✅ Imagen subida con éxito. Asset URN: {asset_urn}")
        return asset_urn
        
    except Exception as e:
        print(f"❌ Excepción durante el proceso de subida de imagen a LinkedIn: {e}")
        return None

def run_linkedin_bot():
    print("===============================================")
    print("🤖 INICIANDO BOT DE LINKEDIN")

    # 1. Verificar credenciales
    access_token = os.getenv("LINKEDIN_ACCESS_TOKEN")
    urn = os.getenv("LINKEDIN_URN") # ej: urn:li:organization:123456 o urn:li:person:abcdef
    db_url = os.getenv("DATABASE_URL")
    frontend_url = os.getenv("FRONTEND_URL", "https://portalempleoit.com")

    if not access_token or not urn:
        print("⚠️  Faltan credenciales de LinkedIn (LINKEDIN_ACCESS_TOKEN o LINKEDIN_URN) en las variables de entorno.")
        print("   Omitiendo la publicación automática en LinkedIn de forma controlada.")
        print("===============================================")
        return

    if not db_url:
        print("❌ Error: No se encontró la variable DATABASE_URL.")
        print("===============================================")
        return

    # Lista de artículos para fallback
    BLOG_ARTICLES = [
        {"title": "Portal Trabajo IT vs InfoJobs y LinkedIn: ¿Cuál elegir en 2026?", "slug": "portal-trabajo-it-vs-infojobs-linkedin"},
        {"title": "Cómo conseguir tu primer empleo de programador sin experiencia (2026)", "slug": "como-conseguir-primer-empleo-programador-junior-2026"},
        {"title": "Cómo crear un perfil de GitHub que atraiga a reclutadores IT", "slug": "github-portfolio-guia-definitiva-desarrolladores"},
        {"title": "Guía de salarios para programadores en España (2026)", "slug": "guia-salarios-programadores-espana-2026"},
        {"title": "Cómo optimizar tu CV para superar filtros ATS", "slug": "como-optimizar-cv-programador-filtros-ats"},
        {"title": "Cómo superar una entrevista técnica de React", "slug": "como-superar-entrevista-tecnica-react"}
    ]

    # 2. Conectar a Base de Datos y obtener ofertas no publicadas en LinkedIn
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        query = """
            SELECT id, title, company, location, salary 
            FROM jobs 
            WHERE is_active = TRUE AND last_linkedin_posted_at IS NULL
            ORDER BY created_at DESC 
            LIMIT 5
        """
        cur.execute(query)
        jobs = cur.fetchall()
        
    except Exception as e:
        print(f"❌ Error consultando PostgreSQL: {e}")
        print("===============================================")
        return

    # Fallback si no hay ofertas nuevas pendientes
    if not jobs:
        print("💡 No hay ofertas nuevas sin publicar en LinkedIn. Publicando artículo recomendado del blog...")
        article = random.choice(BLOG_ARTICLES)
        post_text = (
            f"📚 ¡LECTURA RECOMENDADA PARA DESARROLLADORES! 🚀\n\n"
            f"Compartimos este artículo de nuestro blog que te ayudará a impulsar tu carrera tecnológica:\n\n"
            f"💡 {article['title']}\n\n"
            f"👉 Lee el artículo completo aquí:\n"
            f"🔗 {frontend_url}/blog/{article['slug']}\n\n"
            f"#DesarrolloSoftware #Programacion #CarreraIT #EmpleoTech #ConsejosBlog"
        )
        
        # Enviar post de solo texto a LinkedIn
        api_url = "https://api.linkedin.com/v2/ugcPosts"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0"
        }
        payload = {
            "author": urn,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {
                        "text": post_text
                    },
                    "shareMediaCategory": "NONE"
                }
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
        }
        
        try:
            res = requests.post(api_url, json=payload, headers=headers, timeout=15)
            if res.status_code in (200, 201):
                print(f"✅ Post del blog en LinkedIn publicado con éxito! URN: {res.json().get('id')}")
            else:
                print(f"⚠️ Error al publicar post del blog (Código {res.status_code}): {res.text}")
        except Exception as e:
            print(f"❌ Error de red al publicar en LinkedIn: {e}")
            
        cur.close()
        conn.close()
        print("===============================================")
        return

    # Publicar hasta 2 ofertas por ejecución para evitar spam
    jobs_to_post = jobs[:2]
    print(f"📣 Seleccionadas {len(jobs_to_post)} ofertas nuevas para publicar de forma individual en LinkedIn.")

    for idx, job in enumerate(jobs_to_post):
        job_id, title, company, location, salary = job
        job_link = f"{frontend_url}/job/{get_job_slug(job_id, title, location, company)}"
        
        # Formatear el contenido del post individual
        post_text = f"💼 ¡NUEVA OFERTA DE EMPLEO IT DESTACADA! 🚀\n\n"
        post_text += f"Buscamos profesionales para el siguiente puesto en España:\n\n"
        post_text += f"📌 Puesto: {title}\n"
        post_text += f"🏢 Empresa: {company}\n"
        post_text += f"📍 Ubicación: {location}\n"
        if salary and salary != "Consultar" and salary.strip() != "":
            post_text += f"💰 Salario: {salary}\n"
        post_text += "\n"
        post_text += f"👉 Inscríbete y mira todos los detalles de la oferta aquí:\n"
        post_text += f"🔗 {job_link}\n\n"
        post_text += "#EmpleoTech #TrabajoIT #DesarrolloSoftware #Programacion #Remoto #TalentoIT"

        print(f"\n📝 [Post {idx+1}/{len(jobs_to_post)}] Preparando post:\n{title} en {company}\n")

        # Generar imagen de la tarjeta de oferta
        image_path = f"linkedin_card_{job_id}.png"
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
            print(f"⚠️ Error al generar imagen para la oferta {job_id}: {img_err}")

        # Subir imagen a LinkedIn si se generó
        asset_urn = None
        if has_image:
            asset_urn = upload_image_to_linkedin(access_token, urn, image_path, title)

        # Enviar Post a LinkedIn API
        api_url = "https://api.linkedin.com/v2/ugcPosts"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0"
        }

        # Construir payload (con imagen si se subió con éxito, si no, fallback a solo texto)
        if asset_urn:
            payload = {
                "author": urn,
                "lifecycleState": "PUBLISHED",
                "specificContent": {
                    "com.linkedin.ugc.ShareContent": {
                        "shareCommentary": {
                            "text": post_text
                        },
                        "shareMediaCategory": "IMAGE",
                        "media": [
                            {
                                "status": "READY",
                                "description": {
                                    "text": f"{title} - {company}"
                                },
                                "originalUrl": job_link,
                                "media": asset_urn
                            }
                        ]
                    }
                },
                "visibility": {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                }
            }
        else:
            payload = {
                "author": urn,
                "lifecycleState": "PUBLISHED",
                "specificContent": {
                    "com.linkedin.ugc.ShareContent": {
                        "shareCommentary": {
                            "text": post_text
                        },
                        "shareMediaCategory": "NONE"
                    }
                },
                "visibility": {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                }
            }

        published = False
        try:
            response = requests.post(api_url, json=payload, headers=headers, timeout=15)
            if response.status_code in (200, 201):
                result = response.json()
                print(f"✅ ¡Post {idx+1} publicado con éxito! URN: {result.get('id')}")
                published = True
            else:
                print(f"⚠️ Error al publicar post {idx+1} en LinkedIn (Código {response.status_code}): {response.text}")
        except Exception as e:
            print(f"❌ Error de red al conectar con la API de LinkedIn: {e}")

        # Limpiar archivo temporal de imagen
        if has_image and os.path.exists(image_path):
            try:
                os.remove(image_path)
            except:
                pass

        # Si se publicó correctamente, actualizar la BD para evitar duplicados
        if published:
            try:
                cur.execute("UPDATE jobs SET last_linkedin_posted_at = %s WHERE id = %s", (datetime.now(), job_id))
                conn.commit()
                print(f"💾 BD actualizada para oferta {job_id} (LinkedIn).")
            except Exception as db_err:
                print(f"⚠️ Error al actualizar last_linkedin_posted_at en BD: {db_err}")

        # Esperar 45 segundos entre publicaciones para no activar filtros de spam
        if idx < len(jobs_to_post) - 1:
            print("💤 Esperando 45 segundos antes de publicar la siguiente oferta...")
            time.sleep(45)

    try:
        cur.close()
        conn.close()
    except:
        pass
        
    print("===============================================")

if __name__ == "__main__":
    run_linkedin_bot()
