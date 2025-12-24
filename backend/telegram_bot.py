import os
import requests
import psycopg2
from dotenv import load_dotenv

# Cargar claves
load_dotenv()

def send_to_telegram():
    print("📢 Iniciando difusión en Telegram (MODO TEST: SIN FECHA)...")

    # 1. Verificar credenciales
    TOKEN = os.getenv("TELEGRAM_TOKEN")
    CHANNEL_ID = os.getenv("TELEGRAM_CHANNEL")
    
    if not TOKEN or not CHANNEL_ID:
        print("❌ Error: Faltan las variables TELEGRAM en el archivo .env o Secrets")
        return

    # 2. Conectar a Base de Datos
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
    except Exception as e:
        print(f"❌ Error conectando a BD: {e}")
        return

    # 3. Buscar la ÚLTIMA oferta registrada (Ignorando fecha)
    # Esto garantiza que si hay ALGO en la base de datos, lo envíe.
    cur.execute("""
        SELECT id, title, company, location, salary 
        FROM jobs 
        ORDER BY created_at DESC 
        LIMIT 1
    """)
    
    jobs = cur.fetchall()
    
    if not jobs:
        print("💤 La base de datos está COMPLETAMENTE VACÍA. Ejecuta main.py primero.")
        return

    print(f"🚀 Encontrada 1 oferta de prueba. Enviando al canal...")

    # 4. Configurar envío
    headers = {"Content-Type": "application/json"}
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"

    for job in jobs:
        job_id, title, company, location, salary = job
        
        # --- ¡PON TU URL DE VERCEL AQUÍ! ---
        base_url = "https://portal-trabajo.vercel.app" 
        # Si tienes otra URL, cámbiala arriba ↑
        
        job_url = f"{base_url}/job/{job_id}"
        
        # Mensaje con formato HTML
        message = (
            f"🧪 <b>PRUEBA DE CONEXIÓN</b>\n\n"
            f"💻 <b>{title}</b>\n"
            f"🏢 {company}\n"
            f"📍 {location}\n"
            f"💰 {salary or 'Salario a convenir'}\n\n"
            f"👇 <b>Ver detalles:</b>\n"
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
                print(f"✅ MENSAJE ENVIADO CON ÉXITO: {title}")
            else:
                print(f"⚠️ Error Telegram ({r.status_code}): {r.text}")
        except Exception as e:
            print(f"❌ Error de red: {e}")

    conn.close()

if __name__ == "__main__":
    send_to_telegram()
