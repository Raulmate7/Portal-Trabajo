import os
import time
import requests
import psycopg2
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

# URL base de tu web — todos los enlaces apuntan aquí para generar tráfico
BASE_URL = os.getenv("FRONTEND_URL", "https://portalempleoit.com")


def send_to_telegram():
    print("📢 Iniciando difusión GENERAL (Sin filtros de usuario)...")

    # 1. Verificar credenciales
    TOKEN = os.getenv("TELEGRAM_TOKEN")
    CHANNEL_ID = os.getenv("TELEGRAM_CHANNEL")

    if not TOKEN or not CHANNEL_ID:
        print("❌ Error: Faltan las variables TELEGRAM_TOKEN o TELEGRAM_CHANNEL en .env")
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
        WHERE created_at > %s
        ORDER BY created_at DESC
        LIMIT 15
    """, (time_window,))

    jobs = cur.fetchall()
    conn.close()

    if not jobs:
        print("💤 No hay ofertas nuevas en las últimas 7 horas.")
        return

    print(f"🚀 Encontradas {len(jobs)} ofertas. Enviando al canal público...")

    # 4. Agrupar ofertas por categoría
    from collections import defaultdict
    jobs_by_category = defaultdict(list)
    
    for job in jobs:
        job_id, title, company, location, salary, category = job
        cat_name = category if category else "Otras Ofertas"
        jobs_by_category[cat_name].append(job)

    # 5. Construir el mensaje unificado
    message = f"🔥 <b>NUEVAS OFERTAS DE EMPLEO IT</b> ({len(jobs)} vacantes)\n\n"
    
    for cat, cat_jobs in jobs_by_category.items():
        message += f"📁 <b>{cat}</b>\n"
        for job in cat_jobs:
            job_id, title, company, location, salary, _ = job
            job_url = f"{BASE_URL}/job/{job_id}"
            title_clean = title.replace('<', '').replace('>', '')
            company_clean = company.replace('<', '').replace('>', '') if company else "Desconocida"
            message += f"▪️ <a href='{job_url}'>{title_clean}</a> en {company_clean}\n"
        message += "\n"

    message += (
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"⭐ <b>¿Eres Senior (+3 años)?</b>\n"
        f"Accede a ofertas exclusivas con salarios +45K.\n"
        f"👉 <a href=\"{BASE_URL}/talento-premium\">Registrarse gratis</a>\n"
        f"━━━━━━━━━━━━━━━━━━━━"
    )

    # 6. Enviar a Telegram
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    headers = {"Content-Type": "application/json"}
    
    payload = {
        "chat_id": CHANNEL_ID,
        "text": message,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
        "reply_markup": {
            "inline_keyboard": [
                [
                    {"text": "🔍 Ver todas las ofertas en la web", "url": BASE_URL}
                ]
            ]
        }
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        result = response.json()
        if result.get("ok"):
            print("✅ Mensaje agrupado enviado con éxito a Telegram.")
        else:
            print(f"⚠️ Telegram rechazó el mensaje: {result.get('description', 'error desconocido')}")
    except Exception as e:
        print(f"❌ Error de red enviando mensaje a Telegram: {e}")


if __name__ == "__main__":
    send_to_telegram()

