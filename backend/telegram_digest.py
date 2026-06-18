import os
import re
import requests
import psycopg2
from logic.slug import get_job_slug
from dotenv import load_dotenv

load_dotenv()

BASE_URL = os.getenv("FRONTEND_URL", "https://portalempleoit.com")

def parse_max_salary(salary_str):
    if not salary_str or "consultar" in salary_str.lower():
        return 0
    # Reemplazar puntos de miles para no confundir al regex
    cleaned = salary_str.replace('.', '')
    numbers = [int(n) for n in re.findall(r'\d+', cleaned)]
    if not numbers:
        return 0
    valid_numbers = [n for n in numbers if n >= 1000]
    return max(valid_numbers) if valid_numbers else 0

def send_telegram_message(token, channel_id, text_content):
    """Envía un mensaje de texto con formato HTML a un canal de Telegram."""
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    headers = {"Content-Type": "application/json"}
    
    payload = {
        "chat_id": channel_id,
        "text": text_content,
        "parse_mode": "HTML",
        "disable_web_page_preview": True
    }
    
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

def run_telegram_digest():
    print("===============================================")
    print("📊 INICIANDO DIGEST DIARIO DE TELEGRAM")

    TOKEN = os.getenv("TELEGRAM_TOKEN")
    CHANNEL = os.getenv("TELEGRAM_CHANNEL")
    db_url = os.getenv("DATABASE_URL")

    if not TOKEN or not CHANNEL:
        print("❌ Error: Falta la variable TELEGRAM_TOKEN o TELEGRAM_CHANNEL en .env")
        return

    if not db_url:
        print("❌ Error: DATABASE_URL no configurada.")
        return

    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
    except Exception as e:
        print(f"❌ Error conectando a BD: {e}")
        return

    # 1. Buscar ofertas activas recientes (últimas 24 horas)
    try:
        cur.execute("""
            SELECT id, title, company, location, salary, category, is_featured
            FROM jobs
            WHERE is_active = TRUE AND created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
            ORDER BY is_featured DESC, created_at DESC
        """)
        jobs = cur.fetchall()

        # Si hay menos de 5, ampliamos a las últimas 72 horas
        if len(jobs) < 5:
            print("ℹ️ Pocas ofertas en las últimas 24h. Ampliando búsqueda a 72h...")
            cur.execute("""
                SELECT id, title, company, location, salary, category, is_featured
                FROM jobs
                WHERE is_active = TRUE AND created_at >= DATE_SUB(NOW(), INTERVAL 3 DAY)
                ORDER BY is_featured DESC, created_at DESC
            """)
            jobs = cur.fetchall()

        # Si sigue habiendo menos de 5, ampliamos a los últimos 7 días
        if len(jobs) < 5:
            print("ℹ️ Pocas ofertas en 72h. Ampliando búsqueda a 7 días...")
            cur.execute("""
                SELECT id, title, company, location, salary, category, is_featured
                FROM jobs
                WHERE is_active = TRUE AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                ORDER BY is_featured DESC, created_at DESC
            """)
            jobs = cur.fetchall()

        # Fallback final a todas las activas si es necesario
        if len(jobs) < 5:
            print("ℹ️ Pocas ofertas en 7 días. Tomando las ofertas activas más recientes...")
            cur.execute("""
                SELECT id, title, company, location, salary, category, is_featured
                FROM jobs
                WHERE is_active = TRUE
                ORDER BY is_featured DESC, created_at DESC
                LIMIT 10
            """)
            jobs = cur.fetchall()

    except Exception as e:
        print(f"❌ Error al consultar ofertas en BD: {e}")
        cur.close()
        conn.close()
        return

    cur.close()
    conn.close()

    if not jobs:
        print("💤 No hay ninguna oferta activa en la base de datos para generar el digest.")
        print("===============================================")
        return

    # 2. Ordenar las ofertas: primero destacadas (is_featured), luego por salario máximo (de mayor a menor)
    sorted_jobs = sorted(
        jobs, 
        key=lambda j: (
            1 if j[6] else 0,
            parse_max_salary(j[4]),
            j[0]
        ), 
        reverse=True
    )

    top_jobs = sorted_jobs[:5]
    print(f"📢 Seleccionadas {len(top_jobs)} ofertas destacadas para el digest diario.")

    # 3. Formatear y enviar mensaje
    message = "📊 <b>TOP 5 OFERTAS TECH DEL DÍA</b> 🚀\n"
    message += "Aquí tienes las vacantes de tecnología más destacadas y mejor valoradas hoy en nuestro portal:\n\n"
    
    emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"]
    for idx, job in enumerate(top_jobs):
        job_id, title, company, location, salary, category, is_featured = job
        emoji = emojis[idx] if idx < len(emojis) else "▪"
        
        job_slug = get_job_slug(job_id, title, location, company)
        job_url = f"{BASE_URL}/job/{job_slug}?utm_source=telegram&utm_medium=social&utm_campaign=tg_digest"
        
        title_clean = title.replace('<', '').replace('>', '')
        company_clean = company.replace('<', '').replace('>', '') if company else "Empresa Destacada"
        
        loc_lower = (location or "").lower()
        modality = "📍 Presencial"
        if any(term in loc_lower for term in ["remoto", "remote", "teletrabajo", "worldwide"]):
            modality = "🌍 Remoto"
        elif "hibrido" in loc_lower or "híbrido" in loc_lower or "hybrid" in loc_lower:
            modality = "🏡 Híbrido"
            
        salary_text = f" | 💰 {salary}" if salary and salary != "Consultar" and salary.strip() != "" else ""
        featured_tag = " ⭐" if is_featured else ""
        
        message += f"{emoji} <b><a href='{job_url}'>{title_clean}</a></b>\n"
        message += f"   🏢 {company_clean} | {modality}{salary_text}{featured_tag}\n\n"
        
    message += (
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"📢 ¿Quieres estar al día al instante? Activa nuestras alertas.\n"
        f"👉 <a href='{BASE_URL}?utm_source=telegram&utm_medium=social&utm_campaign=tg_digest_footer'>Buscar más ofertas en Portal Trabajo IT</a>\n"
        f"━━━━━━━━━━━━━━━━━━━━"
    )

    send_telegram_message(TOKEN, CHANNEL, message)
    print("===============================================")

if __name__ == "__main__":
    run_telegram_digest()
