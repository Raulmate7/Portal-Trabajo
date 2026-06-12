import os
import time
import requests
import psycopg2
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

# URL base de tu web — todos los enlaces apuntan aquí para generar tráfico
BASE_URL = "https://portal-trabajo.vercel.app"


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

    # 4. Enviar a Telegram
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    headers = {"Content-Type": "application/json"}

    success_count = 0
    error_count = 0

    for i, job in enumerate(jobs):
        job_id, title, company, location, salary, category = job
        job_url = f"{BASE_URL}/job/{job_id}"

        # Generar hashtags basados en categoría e inferencia de tecnología
        hashtags = []
        
        # Categorías generales
        if category:
            cat_clean = category.lower()
            if 'frontend' in cat_clean:
                hashtags.append("#Frontend")
            elif 'backend' in cat_clean:
                hashtags.append("#Backend")
            elif 'data' in cat_clean or 'ai' in cat_clean:
                hashtags.append("#Data #IA")
            elif 'cloud' in cat_clean or 'devops' in cat_clean:
                hashtags.append("#Cloud #DevOps")
            elif 'mobile' in cat_clean:
                hashtags.append("#Mobile")
                
        # Tecnologías comunes
        title_lower = title.lower()
        if 'react' in title_lower:
            hashtags.append("#React")
        if 'node' in title_lower:
            hashtags.append("#NodeJS")
        if 'python' in title_lower:
            hashtags.append("#Python")
        if 'java' in title_lower and 'javascript' not in title_lower:
            hashtags.append("#Java")
        if 'javascript' in title_lower or ' js ' in title_lower:
            hashtags.append("#JavaScript")
        if 'typescript' in title_lower or ' ts ' in title_lower:
            hashtags.append("#TypeScript")
        if 'aws' in title_lower:
            hashtags.append("#AWS")
        if 'docker' in title_lower or 'kubernetes' in title_lower:
            hashtags.append("#DevOps")
            
        # Ubicación
        loc_clean = (location or '').lower()
        if 'remoto' in loc_clean or 'remote' in loc_clean or 'teletrabajo' in loc_clean:
            hashtags.append("#Remoto")
        else:
            for ciudad in ['madrid', 'barcelona', 'valencia', 'malaga', 'sevilla', 'bilbao']:
                if ciudad in loc_clean:
                    hashtags.append(f"#{ciudad.capitalize()}")
                    break

        hash_str = " ".join(sorted(list(set(hashtags))))

        # Mensaje principal de la oferta
        message = (
            f"🔥 <b>NUEVA OPORTUNIDAD IT</b>\n\n"
            f"💻 <b>{title}</b>\n"
            f"🏢 {company}\n"
            f"📍 {location}\n"
            f"💰 {salary or 'Consultar'}\n\n"
            f"🏷️ {hash_str}\n"
        )

        # Cada 5 ofertas, añadimos un CTA de Talento Premium para monetizar
        if (i + 1) % 5 == 0:
            message += (
                f"\n━━━━━━━━━━━━━━━━━━━━\n"
                f"⭐ <b>¿Eres Senior (+3 años)?</b>\n"
                f"Accede a ofertas exclusivas con salarios +45K.\n"
                f"👉 <a href=\"{BASE_URL}/talento-premium\">Registrarse gratis</a>"
            )

        payload = {
            "chat_id": CHANNEL_ID,
            "text": message,
            "parse_mode": "HTML",
            "disable_web_page_preview": False,
            "reply_markup": {
                "inline_keyboard": [
                    [
                        {"text": "🚀 Ver Oferta y Aplicar", "url": job_url}
                    ]
                ]
            }
        }

        try:
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

        # Añadimos un pequeño delay para evitar el limitador de envíos (Rate Limiting) de Telegram
        time.sleep(1.5)

    # 5. Mensaje final con CTA a la web
    summary_msg = (
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"📊 <b>Resumen:</b> {len(jobs)} nuevas ofertas publicadas\n\n"
        f"🔍 <a href=\"{BASE_URL}\">Ver todas las ofertas en la web</a>\n"
        f"⭐ <a href=\"{BASE_URL}/talento-premium\">Programa Talento Premium</a>\n"
        f"━━━━━━━━━━━━━━━━━━━━"
    )
    try:
        requests.post(url, json={
            "chat_id": CHANNEL_ID,
            "text": summary_msg,
            "parse_mode": "HTML",
            "disable_web_page_preview": True,
        }, headers=headers, timeout=10)
    except Exception:
        pass

    print(f"\n🎉 Telegram: {success_count} enviados, {error_count} fallidos.")


if __name__ == "__main__":
    send_to_telegram()

