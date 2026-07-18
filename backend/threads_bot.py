import os
import requests
import psycopg2
import random
from datetime import datetime
import time
from logic.slug import get_job_slug

def publish_thread(access_token, text, image_url=None):
    """
    Publica un post en Threads (Meta) usando la API de Threads Graph.
    Flujo: 
    1. Crear un contenedor multimedia (POST /me/threads)
    2. Publicar el contenedor (POST /me/threads_publish)
    """
    base_url = "https://graph.threads.net/v1.0"
    
    # Paso 1: Crear contenedor de hilos
    create_url = f"{base_url}/me/threads"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "text": text
    }
    
    if image_url:
        payload["media_type"] = "IMAGE"
        payload["image_url"] = image_url
    else:
        payload["media_type"] = "TEXT"
        
    try:
        print("📦 Creando contenedor multimedia en Threads...")
        res = requests.post(create_url, json=payload, headers=headers, timeout=15)
        if res.status_code not in (200, 201):
            print(f"⚠️ Error al crear contenedor de Threads (Código {res.status_code}): {res.text}")
            return None
            
        container_id = res.json().get("id")
        if not container_id:
            print("⚠️ No se recibió creation_id del contenedor.")
            return None
            
        # Paso 2: Publicar el hilos
        print(f"🚀 Publicando contenedor {container_id} en Threads...")
        publish_url = f"{base_url}/me/threads_publish"
        publish_payload = {
            "creation_id": container_id
        }
        
        pub_res = requests.post(publish_url, json=publish_payload, headers=headers, timeout=15)
        if pub_res.status_code in (200, 201):
            pub_data = pub_res.json()
            print(f"✅ Hilo publicado con éxito! ID: {pub_data.get('id')}")
            return pub_data.get("id")
        else:
            print(f"⚠️ Error al publicar el contenedor de Threads (Código {pub_res.status_code}): {pub_res.text}")
            return None
            
    except Exception as e:
        print(f"❌ Excepción durante la publicación en Threads: {e}")
        return None

def run_threads_bot():
    print("===============================================")
    print("🤖 INICIANDO BOT DE THREADS (META)")

    # 1. Configurar credenciales
    access_token = os.getenv("THREADS_ACCESS_TOKEN")
    db_url = os.getenv("DATABASE_URL")
    frontend_url = os.getenv("FRONTEND_URL", "https://portalempleoit.com")

    if not access_token:
        print("⚠️  Falta credencial de Threads (THREADS_ACCESS_TOKEN) en las variables de entorno.")
        print("   Omitiendo la publicación automática en Threads de forma controlada.")
        print("===============================================")
        return

    if not db_url:
        print("❌ Error: No se encontró la variable DATABASE_URL.")
        print("===============================================")
        return

    # 2. Conectar a Base de Datos y obtener ofertas no publicadas en Threads
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        query = """
            SELECT id, title, company, location, salary, category 
            FROM jobs 
            WHERE is_active = TRUE AND last_threads_posted_at IS NULL
            ORDER BY created_at DESC 
            LIMIT 5
        """
        cur.execute(query)
        jobs = cur.fetchall()
        
    except Exception as e:
        print(f"❌ Error consultando PostgreSQL/MySQL: {e}")
        print("===============================================")
        return

    if not jobs:
        print("💡 No hay ofertas nuevas sin publicar en Threads. Saliendo.")
        cur.close()
        conn.close()
        print("===============================================")
        return

    # Publicar hasta 2 hilos por ejecución para evitar spam
    jobs_to_post = jobs[:2]
    print(f"📣 Seleccionadas {len(jobs_to_post)} ofertas nuevas para publicar en Threads.")

    for idx, job in enumerate(jobs_to_post):
        job_id, title, company, location, salary, category = job
        job_slug = get_job_slug(job_id, title, location, company)
        job_link = f"{frontend_url}/job/{job_slug}"
        
        # Open Graph image para previsualización en el post
        image_url = f"{frontend_url}/job/{job_id}/opengraph-image"
        
        # Formatear el contenido del post
        post_text = (
            f"💼 ¡NUEVA OFERTA IT DESTACADA! 🚀\n\n"
            f"📌 Puesto: {title}\n"
            f"🏢 Empresa: {company}\n"
            f"📍 Ubicación: {location}\n"
        )
        if salary and salary != "Consultar" and salary.strip() != "":
            post_text += f"💰 Salario: {salary}\n"
            
        post_text += (
            f"\n👉 Inscríbete y mira los detalles aquí:\n"
            f"🔗 {job_link}?utm_source=threads&utm_medium=social&utm_campaign=threads_oferta\n\n"
            f"#EmpleoTech #TrabajoIT #DesarrolloSoftware #Programacion #Remoto #TalentoIT"
        )

        print(f"\n🧵 [Thread {idx+1}/{len(jobs_to_post)}] Publicando: {title} en {company}")

        # Intentar publicar con imagen, fallback a solo texto si falla
        thread_id = publish_thread(access_token, post_text, image_url)
        if not thread_id:
            print("⚠️ Reintentando publicación en Threads en formato solo texto...")
            thread_id = publish_thread(access_token, post_text)

        # Si se publicó correctamente, actualizar la BD
        if thread_id:
            try:
                cur.execute("UPDATE jobs SET last_threads_posted_at = %s WHERE id = %s", (datetime.now(), job_id))
                conn.commit()
                print(f"💾 BD actualizada para oferta {job_id} (Threads).")
            except Exception as db_err:
                print(f"⚠️ Error al actualizar last_threads_posted_at en BD: {db_err}")

        # Esperar 20 segundos entre publicaciones
        if idx < len(jobs_to_post) - 1:
            print("💤 Esperando 20 segundos antes de publicar el siguiente hilo...")
            time.sleep(20)

    try:
        cur.close()
        conn.close()
    except:
        pass
        
    print("===============================================")

if __name__ == "__main__":
    run_threads_bot()
