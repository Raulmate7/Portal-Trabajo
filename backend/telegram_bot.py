import os
import time
import requests
import psycopg2
from logic.slug import get_job_slug
from dotenv import load_dotenv
from datetime import datetime, timedelta
from collections import defaultdict

load_dotenv()

# URL base de tu web
BASE_URL = os.getenv("FRONTEND_URL", "https://portalempleoit.com")

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


def send_telegram_message(token, channel_id, text_content, reply_markup=None):
    """Envía un mensaje de texto con formato HTML a un canal de Telegram."""
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    headers = {"Content-Type": "application/json"}
    
    payload = {
        "chat_id": channel_id,
        "text": text_content,
        "parse_mode": "HTML",
        "disable_web_page_preview": True
    }
    
    if reply_markup:
        payload["reply_markup"] = reply_markup
        
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        result = response.json()
        if result.get("ok"):
            print(f"✅ Mensaje enviado con éxito al canal {channel_id}.")
            return True
        else:
            print(f"⚠️ Telegram rechazó el mensaje al canal {channel_id}: {result.get('description', 'error desconocido')}")
            return False
    except Exception as e:
        print(f"❌ Error de red al enviar mensaje a Telegram ({channel_id}): {e}")
        return False

def send_to_telegram():
    print("===============================================")
    print("🤖 INICIANDO BOT DE TELEGRAM")

    # 1. Verificar credenciales generales
    TOKEN = os.getenv("TELEGRAM_TOKEN")
    GENERAL_CHANNEL = os.getenv("TELEGRAM_CHANNEL")

    if not TOKEN:
        print("❌ Error: Falta la variable TELEGRAM_TOKEN en .env")
        return

    # 2. Conectar a Base de Datos
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
    except Exception as e:
        print(f"❌ Error conectando a BD: {e}")
        return

    # 3. Buscar ofertas NUEVAS (Últimas 7 horas)
    time_window = datetime.now() - timedelta(hours=7)

    cur.execute("""
        SELECT id, title, company, location, salary, category
        FROM jobs
        WHERE is_active = TRUE AND created_at > %s
        ORDER BY created_at DESC
        LIMIT 25
    """, (time_window,))

    jobs = cur.fetchall()
    cur.close()
    conn.close()

    if not jobs:
        print("💤 No hay ofertas nuevas en las últimas 7 horas.")
        print("===============================================")
        return

    print(f"🚀 Encontradas {len(jobs)} ofertas nuevas. Iniciando difusión...")

    # 4. Agrupar ofertas por categoría y por modalidad remota
    jobs_by_category = defaultdict(list)
    remote_jobs = []
    
    for job in jobs:
        job_id, title, company, location, salary, category = job
        cat_name = category if category else "Otros"
        jobs_by_category[cat_name].append(job)
        
        # Verificar si es remoto
        loc_lower = (location or "").lower()
        if any(term in loc_lower for term in ["remoto", "remote", "teletrabajo", "worldwide"]):
            remote_jobs.append(job)

    # 5. Enviar mensaje unificado al canal GENERAL (comportamiento clásico)
    if GENERAL_CHANNEL:
        print("📢 Generando mensaje para el canal General...")
        message = f"🔥 <b>NUEVAS OFERTAS DE EMPLEO IT</b> ({len(jobs)} vacantes)\n\n"
        
        for cat, cat_jobs in jobs_by_category.items():
            message += f"📁 <b>{cat}</b>\n"
            for job in cat_jobs:
                job_id, title, company, location, salary, _ = job
                job_url = f"{BASE_URL}/job/{get_job_slug(job_id, title, location, company)}?utm_source=telegram&utm_medium=social&utm_campaign=tg_general_job"
                title_clean = title.replace('<', '').replace('>', '')
                company_clean = company.replace('<', '').replace('>', '') if company else "Desconocida"
                message += f"▪️ <a href='{job_url}'>{title_clean}</a> en {company_clean}\n"
            cat_slug = get_sector_slug("", cat)
            message += f"🔗 <a href='{BASE_URL}/trabajos/{cat_slug}?utm_source=telegram&utm_medium=social&utm_campaign=tg_general_cat_more'>Ver más ofertas de {cat}</a>\n\n"

        message += (
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"⭐ <b>¿Eres Senior (+3 años)?</b>\n"
            f"Accede a ofertas exclusivas con salarios +45K.\n"
            f"👉 <a href=\"{BASE_URL}/talento-premium?utm_source=telegram&utm_medium=social&utm_campaign=tg_general_premium_cta\">Registrarse gratis</a>\n"
            f"━━━━━━━━━━━━━━━━━━━━"
        )
        
        reply_markup = {
            "inline_keyboard": [
                [
                    {"text": "🔍 Ver todas las ofertas en la web", "url": f"{BASE_URL}?utm_source=telegram&utm_medium=social&utm_campaign=tg_general_web_btn"}
                ],
                [
                    {"text": "👍 Me interesa", "callback_data": "like_general"},
                    {"text": "👎 No me interesa", "callback_data": "dislike_general"}
                ]
            ]
        }
        send_telegram_message(TOKEN, GENERAL_CHANNEL, message, reply_markup)

    # 6. Enviar a canales segmentados por categoría/tecnología si están configurados
    channels_map = {
        "Frontend": os.getenv("TELEGRAM_CHANNEL_FRONTEND"),
        "Backend": os.getenv("TELEGRAM_CHANNEL_BACKEND"),
        "Data & AI": os.getenv("TELEGRAM_CHANNEL_DATA_AI"),
        "Cloud & DevOps": os.getenv("TELEGRAM_CHANNEL_CLOUD_DEVOPS"),
        "Mobile": os.getenv("TELEGRAM_CHANNEL_MOBILE")
    }

    for cat_name, channel_id in channels_map.items():
        if not channel_id:
            continue
            
        cat_jobs = jobs_by_category.get(cat_name)
        if not cat_jobs:
            print(f"ℹ️ No hay ofertas nuevas de {cat_name} para su canal segmentado.")
            continue
            
        print(f"📢 Enviando {len(cat_jobs)} ofertas al canal segmentado de {cat_name} ({channel_id})...")
        cat_message = f"💻 <b>NUEVAS OFERTAS DE {cat_name.upper()}</b> ({len(cat_jobs)} vacantes)\n\n"
        
        for job in cat_jobs:
            job_id, title, company, location, salary, _ = job
            cat_slug_utm = cat_name.lower().replace(' & ', '_').replace(' ', '_')
            job_url = f"{BASE_URL}/job/{get_job_slug(job_id, title, location, company)}?utm_source=telegram&utm_medium=social&utm_campaign=tg_{cat_slug_utm}_job"
            title_clean = title.replace('<', '').replace('>', '')
            company_clean = company.replace('<', '').replace('>', '') if company else "Desconocida"
            salary_text = f" | 💰 {salary}" if salary and salary != "Consultar" else ""
            cat_message += f"▪️ <a href='{job_url}'>{title_clean}</a> en {company_clean} (📍 {location}{salary_text})\n"
            
        cat_slug = get_sector_slug("", cat_name)
        cat_slug_utm = cat_name.lower().replace(' & ', '_').replace(' ', '_')
        cat_message += f"\n👉 <a href='{BASE_URL}/trabajos/{cat_slug}?utm_source=telegram&utm_medium=social&utm_campaign=tg_{cat_slug_utm}_cat_more'>Ver más ofertas de {cat_name}</a>"
        
        # Inyectar botones de reacciones
        cat_slug = cat_name.lower().replace(' & ', '_').replace(' ', '_')
        reply_markup_cat = {
            "inline_keyboard": [
                [
                    {"text": "👍 Me interesa", "callback_data": f"like_{cat_slug}"},
                    {"text": "👎 No me interesa", "callback_data": f"dislike_{cat_slug}"}
                ]
            ]
        }
        send_telegram_message(TOKEN, channel_id, cat_message, reply_markup_cat)

    # 7. Enviar al canal segmentado de Remoto
    channel_remoto = os.getenv("TELEGRAM_CHANNEL_REMOTO")
    if channel_remoto and remote_jobs:
        print(f"📢 Enviando {len(remote_jobs)} ofertas al canal segmentado de Remoto ({channel_remoto})...")
        remoto_message = f"🌎 <b>NUEVAS OFERTAS EN REMOTO / TELETRABAJO</b> ({len(remote_jobs)} vacantes)\n\n"
        
        for job in remote_jobs:
            job_id, title, company, location, salary, _ = job
            job_url = f"{BASE_URL}/job/{get_job_slug(job_id, title, location, company)}?utm_source=telegram&utm_medium=social&utm_campaign=tg_remoto_job"
            title_clean = title.replace('<', '').replace('>', '')
            company_clean = company.replace('<', '').replace('>', '') if company else "Desconocida"
            salary_text = f" | 💰 {salary}" if salary and salary != "Consultar" else ""
            remoto_message += f"▪️ <a href='{job_url}'>{title_clean}</a> en {company_clean}{salary_text}\n"
            
        remoto_message += f"\n👉 <a href='{BASE_URL}/trabajo-remoto?utm_source=telegram&utm_medium=social&utm_campaign=tg_remoto_more'>Ver todas las ofertas en remoto</a>"
        
        # Inyectar botones de reacciones
        reply_markup_remoto = {
            "inline_keyboard": [
                [
                    {"text": "👍 Me interesa", "callback_data": "like_remoto"},
                    {"text": "👎 No me interesa", "callback_data": "dislike_remoto"}
                ]
            ]
        }
        send_telegram_message(TOKEN, channel_remoto, remoto_message, reply_markup_remoto)

    print("===============================================")

if __name__ == "__main__":
    send_to_telegram()
