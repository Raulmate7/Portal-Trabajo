import os
import requests
import psycopg2
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()


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
        SELECT id, title, company, location, salary
        FROM jobs
        WHERE created_at > %s
        ORDER BY created_at DESC
    """, (time_window,))

    jobs = cur.fetchall()
    conn.close()

    if not jobs:
        print("💤 No hay ofertas nuevas en las últimas 7 horas.")
        return

    print(f"🚀 Encontradas {len(jobs)} ofertas. Enviando todas al canal público...")

    # 4. Enviar a Telegram
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    base_url = "https://portal-trabajo.vercel.app"
    headers = {"Content-Type": "application/json"}

    success_count = 0
    error_count = 0

    for job in jobs:
        job_id, title, company, location, salary = job
        job_url = f"{base_url}/job/{job_id}"

        message = (
            f"🔥 <b>NUEVA OPORTUNIDAD</b>\n\n"
            f"💻 <b>{title}</b>\n"
            f"🏢 {company}\n"
            f"📍 {location}\n"
            f"💰 {salary or 'Consultar'}\n\n"
            f"👇 <b>Ver y aplicar:</b>\n"
            f"{job_url}"
        )

        payload = {
            "chat_id": CHANNEL_ID,
            "text": message,
            "parse_mode": "HTML",
            "disable_web_page_preview": False,
        }

        try:
            # Fix #5: verificar la respuesta de la API de Telegram
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            result = response.json()
            if result.get("ok"):
                success_count += 1
            else:
                error_count += 1
                print(f"⚠️ Telegram rechazó el mensaje (job_id={job_id}): {result.get('description', 'error desconocido')}")
        except Exception as e:
            error_count += 1
            print(f"❌ Error de red enviando mensaje: {e}")

    print(f"\n🎉 Telegram: {success_count} enviados, {error_count} fallidos.")


if __name__ == "__main__":
    send_to_telegram()
