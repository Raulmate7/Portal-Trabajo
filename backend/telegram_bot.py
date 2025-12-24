import os
import requests
import psycopg2
from dotenv import load_dotenv
from datetime import datetime, timedelta

# Cargar claves
load_dotenv()

# --- ⚙️ CONFIGURACIÓN DE TUS FILTROS ---
# El bot solo enviará la oferta si contiene ALGUNA de estas palabras.
# (Escríbelas en minúsculas).
PALABRAS_CLAVE = [
    "junior",
    "python",
    "react",
    "node",
    "remoto",
    "teletrabajo",
    "beca",
    "prácticas",
    "trainee",
    "javascript",
    "full stack",
    "backend",
    "frontend"
]
# ---------------------------------------

def matches_keywords(text):
    """Devuelve True si el texto contiene alguna palabra clave."""
    if not text:
        return False
    text_lower = text.lower()
    return any(word in text_lower for word in PALABRAS_CLAVE)

def send_to_telegram():
    print("📢 Iniciando difusión FILTRADA en Telegram...")

    # 1. Verificar credenciales
    TOKEN = os.getenv("TELEGRAM_TOKEN")
    CHANNEL_ID = os.getenv("TELEGRAM_CHANNEL")
    
    if not TOKEN or not CHANNEL_ID:
        print("❌ Error: Faltan las variables TELEGRAM.")
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
    
    if not jobs:
        print("💤 No hay ofertas nuevas en la BD (últimas 7h).")
        conn.close()
        return

    print(f"🔎 Analizando {len(jobs)} ofertas nuevas contra tus filtros...")

    # 4. Enviar a Telegram SOLO si pasan el filtro
    headers = {"Content-Type": "application/json"}
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    
    # Tu URL real
    base_url = "https://portal-trabajo.vercel.app"

    enviadas = 0

    for job in jobs:
        job_id, title, company, location, salary = job
        
        # Combinamos título y ubicación para buscar ahí las palabras clave
        texto_a_analizar = f"{title} {location}"
        
        # --- EL PORTERO: ¿Pasa el filtro? ---
        if matches_keywords(texto_a_analizar):
            
            job_url = f"{base_url}/job/{job_id}"
            
            message = (
                f"🎯 <b>MATCH ENCONTRADO</b>\n\n"
                f"💻 <b>{title}</b>\n"
                f"🏢 {company}\n"
                f"📍 {location}\n"
                f"💰 {salary or 'Consultar'}\n\n"
                f"👇 <b>Ver detalle:</b>\n"
                f"{job_url}"
            )

            payload = {
                "chat_id": CHANNEL_ID,
                "text": message,
                "parse_mode": "HTML",
                "disable_web_page_preview": False
            }

            try:
                requests.post(url, json=payload, headers=headers)
                enviadas += 1
            except Exception as e:
                print(f"❌ Error enviando mensaje: {e}")
        else:
            print(f"❌ Descartada por filtro: {title}")

    print(f"✅ Proceso terminado. Enviadas {enviadas} de {len(jobs)} ofertas.")
    conn.close()

if __name__ == "__main__":
    send_to_telegram()
