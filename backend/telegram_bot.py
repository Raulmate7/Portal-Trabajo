import os
import requests
import psycopg2
from dotenv import load_dotenv
from datetime import datetime, timedelta

# Cargar claves
load_dotenv()

def send_to_telegram():
    print("📢 Iniciando difusión en Telegram...")

    # 1. Verificar credenciales
    TOKEN = os.getenv("TELEGRAM_TOKEN")
    CHANNEL_ID = os.getenv("TELEGRAM_CHANNEL")
    
    if not TOKEN or not CHANNEL_ID:
        print("❌ Error: Faltan las variables TELEGRAM en el archivo .env")
        return

    # 2. Conectar a Base de Datos
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
    except Exception as e:
        print(f"❌ Error conectando a BD: {e}")
        return

    # 3. Buscar ofertas NUEVAS (últimas 24h)

    yesterday = datetime.now() - timedelta(hours=7)
    # NOTA: Si quieres probar con ofertas viejas, cambia 24 por 720 (un mes) temporalmente
    
    cur.execute("""
        SELECT id, title, company, location, salary 
        FROM jobs 
        WHERE created_at > %s 
        ORDER BY created_at DESC 
        LIMIT 5
    """, (yesterday,))
    
    jobs = cur.fetchall()
    
    if not jobs:
        print("💤 No hay ofertas nuevas hoy para Telegram.")
        return

    print(f"🚀 Encontradas {len(jobs)} ofertas. Enviando al canal...")

    # 4. Enviar una a una
    headers = {"Content-Type": "application/json"}
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"

    for job in jobs:
        job_id, title, company, location, salary = job
        
        # Enlace a TU web (para ganar tráfico)
        job_url = f"https://portal-trabajo.vercel.app/job/{job_id}"
        
        # Mensaje con formato HTML
        message = (
            f"🔥 <b>NUEVA OPORTUNIDAD</b>\n\n"
            f"💻 <b>{title}</b>\n"
            f"🏢 {company}\n"
            f"📍 {location}\n"
            f"💰 {salary or 'Salario a convenir'}\n\n"
            f"👇 <b>Aplicar aquí:</b>\n"
            f"{job_url}"
        )

        payload = {
            "chat_id": CHANNEL_ID,
            "text": message,
            "parse_mode": "HTML",
            "disable_web_page_preview": False
        }

        try:
            r = requests.post(url, json=payload, headers=headers)
            if r.status_code == 200:
                print(f"✅ Publicado: {title}")
            else:
                print(f"⚠️ Error Telegram ({r.status_code}): {r.text}")
        except Exception as e:
            print(f"❌ Error de red: {e}")

    conn.close()

if __name__ == "__main__":
    send_to_telegram()
