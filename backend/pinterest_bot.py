import os
import requests
import psycopg2
import random
from datetime import datetime
import time
from logic.slug import get_job_slug

def run_pinterest_bot():
    print("===============================================")
    print("🤖 INICIANDO BOT DE PINTEREST")

    # 1. Configurar credenciales de Pinterest
    access_token = os.getenv("PINTEREST_ACCESS_TOKEN")
    board_id = os.getenv("PINTEREST_BOARD_ID")
    db_url = os.getenv("DATABASE_URL")
    frontend_url = os.getenv("FRONTEND_URL", "https://portalempleoit.com")

    if not access_token or not board_id:
        print("⚠️  Faltan credenciales de Pinterest (PINTEREST_ACCESS_TOKEN o PINTEREST_BOARD_ID) en las variables de entorno.")
        print("   Omitiendo la publicación automática en Pinterest de forma controlada.")
        print("===============================================")
        return

    if not db_url:
        print("❌ Error: No se encontró la variable DATABASE_URL.")
        print("===============================================")
        return

    # 2. Conectar a Base de Datos y obtener ofertas no publicadas en Pinterest
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        query = """
            SELECT id, title, company, location, salary, category, description_snippet 
            FROM jobs 
            WHERE is_active = TRUE AND last_pinterest_posted_at IS NULL
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
        print("💡 No hay ofertas nuevas sin publicar en Pinterest. Saliendo.")
        cur.close()
        conn.close()
        print("===============================================")
        return

    # Publicar hasta 2 pines por ejecución para evitar spam
    jobs_to_post = jobs[:2]
    print(f"📣 Seleccionadas {len(jobs_to_post)} ofertas nuevas para publicar en Pinterest.")

    for idx, job in enumerate(jobs_to_post):
        job_id, title, company, location, salary, category, description_snippet = job
        job_slug = get_job_slug(job_id, title, location, company)
        job_link = f"{frontend_url}/job/{job_slug}?utm_source=pinterest&utm_medium=social&utm_campaign=pin_oferta"
        
        # El Open Graph image se genera dinámicamente en el frontend
        image_url = f"{frontend_url}/job/{job_id}/opengraph-image"
        
        # Construir título y descripción del Pin
        pin_title = f"{title} - {company}"[:100]  # Pinterest limita el título a 100 caracteres
        
        salary_text = f" con salario {salary}" if (salary and salary != "Consultar" and salary.strip() != "") else ""
        desc_text = f"Oferta de empleo de {title} en {company} ({location}){salary_text}. "
        if description_snippet:
            desc_text += f"{description_snippet} "
        desc_text += f"Aplica en Portal Trabajo IT."
        pin_description = desc_text[:500]  # Pinterest limita la descripción a 500 caracteres

        print(f"\n📌 [Pin {idx+1}/{len(jobs_to_post)}] Creando Pin: {pin_title}")

        # Enviar petición a la API de Pinterest v5
        api_url = "https://api.pinterest.com/v5/pins"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "link": job_link,
            "title": pin_title,
            "description": pin_description,
            "board_id": board_id,
            "media_source": {
                "source_type": "image_url",
                "url": image_url
            }
        }

        published = False
        try:
            res = requests.post(api_url, json=payload, headers=headers, timeout=15)
            if res.status_code in (200, 201):
                res_data = res.json()
                print(f"✅ ¡Pin publicado con éxito! ID del Pin: {res_data.get('id')}")
                published = True
            else:
                print(f"⚠️ Error al crear el Pin (Código {res.status_code}): {res.text}")
        except Exception as e:
            print(f"❌ Error de red al conectar con la API de Pinterest: {e}")

        # Si se publicó correctamente, actualizar la BD
        if published:
            try:
                cur.execute("UPDATE jobs SET last_pinterest_posted_at = %s WHERE id = %s", (datetime.now(), job_id))
                conn.commit()
                print(f"💾 BD actualizada para oferta {job_id} (Pinterest).")
            except Exception as db_err:
                print(f"⚠️ Error al actualizar last_pinterest_posted_at en BD: {db_err}")

        # Esperar 15 segundos entre publicaciones
        if idx < len(jobs_to_post) - 1:
            print("💤 Esperando 15 segundos antes de publicar el siguiente Pin...")
            time.sleep(15)

    try:
        cur.close()
        conn.close()
    except:
        pass
        
    print("===============================================")

if __name__ == "__main__":
    run_pinterest_bot()
