import os
import requests
import psycopg2
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

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

    # 2. Conectar a Base de Datos
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Buscar ofertas creadas en las últimas 24 horas (máximo 3)
        time_threshold = datetime.now() - timedelta(hours=24)
        query = """
            SELECT id, title, company, location 
            FROM jobs 
            WHERE is_active = TRUE AND created_at >= %s
            ORDER BY created_at DESC 
            LIMIT 3
        """
        cur.execute(query, (time_threshold,))
        jobs = cur.fetchall()
        
        # Si no hay ofertas nuevas en las últimas 24h, tomamos las 3 últimas ofertas activas de la base de datos
        if not jobs:
            print("💡 No hay ofertas en las últimas 24h. Seleccionando las 3 últimas ofertas activas de la BD...")
            query_backup = """
                SELECT id, title, company, location 
                FROM jobs 
                WHERE is_active = TRUE
                ORDER BY created_at DESC 
                LIMIT 3
            """
            cur.execute(query_backup)
            jobs = cur.fetchall()
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error consultando PostgreSQL: {e}")
        print("===============================================")
        return

    if not jobs:
        print("🤷‍♂️ No se encontraron ofertas de empleo activas para publicar.")
        print("===============================================")
        return

    # 3. Formatear contenido del post
    post_text = "💼 ¡OFERTAS DE EMPLEO DESTACADAS EN TECNOLOGÍA! 🚀\n\n"
    post_text += "Aquí tienes las últimas oportunidades del sector IT en España:\n\n"
    
    for idx, job in enumerate(jobs):
        job_id, title, company, location = job
        job_link = f"{frontend_url}/job/{job_id}"
        post_text += f"{idx+1}️⃣ {title}\n"
        post_text += f"🏢 {company} | 📍 {location}\n"
        post_text += f"👉 Inscribirse: {job_link}\n\n"
        
    post_text += "🔍 Explora cientos de ofertas actualizadas y filtra por tecnología/ciudad en:\n"
    post_text += f"🔗 {frontend_url}\n\n"
    post_text += "#EmpleoTech #TrabajoIT #DesarrolloSoftware #Programacion #Remoto"

    print(f"📝 Post preparado para publicar:\n{post_text}\n")

    # 4. Enviar Post a LinkedIn API
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
        response = requests.post(api_url, json=payload, headers=headers, timeout=15)
        if response.status_code in (200, 201):
            result = response.json()
            print(f"✅ ¡Post de LinkedIn publicado con éxito! URN: {result.get('id')}")
        else:
            print(f"⚠️ Error al publicar en LinkedIn (Código {response.status_code}): {response.text}")
    except Exception as e:
        print(f"❌ Error de red al conectar con la API de LinkedIn: {e}")

    print("===============================================")

if __name__ == "__main__":
    run_linkedin_bot()
