import os
import random
import psycopg2
import tweepy
from datetime import datetime, timedelta

print("===============================================")
print("🤖 INICIANDO BOT DE TWITTER")

# 1. Configurar credenciales de Twitter
TWITTER_API_KEY = os.getenv("TWITTER_API_KEY")
TWITTER_API_SECRET = os.getenv("TWITTER_API_SECRET")
TWITTER_ACCESS_TOKEN = os.getenv("TWITTER_ACCESS_TOKEN")
TWITTER_ACCESS_SECRET = os.getenv("TWITTER_ACCESS_SECRET")
DB_URL = os.getenv("DATABASE_URL")
BASE_URL = os.getenv("FRONTEND_URL", "https://portalempleoit.com")

if not all([TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET]):
    print("⚠️  Faltan credenciales de Twitter en las variables de entorno. Omitiendo publicación.")
    telegram_token = os.getenv("TELEGRAM_TOKEN")
    admin_id = os.getenv("TELEGRAM_CHANNEL") # Usando el canal para ver el error
    if telegram_token and admin_id:
        import requests
        try:
            requests.post(f"https://api.telegram.org/bot{telegram_token}/sendMessage", json={
                "chat_id": admin_id,
                "text": "❌ *Error en Twitter Bot:*\nFaltan credenciales de Twitter en GitHub Secrets. Revisa que estén añadidas exactamente con los nombres solicitados.",
                "parse_mode": "Markdown"
            })
        except:
            pass
    exit(0)

if not DB_URL:
    print("❌ No se encontró DATABASE_URL.")
    exit(1)

# 2. Conectar a Twitter
try:
    client = tweepy.Client(
        consumer_key=TWITTER_API_KEY,
        consumer_secret=TWITTER_API_SECRET,
        access_token=TWITTER_ACCESS_TOKEN,
        access_token_secret=TWITTER_ACCESS_SECRET
    )
    print("✅ Conectado a la API de Twitter (X).")
except Exception as e:
    print(f"❌ Error al conectar con Twitter: {e}")
    exit(1)

# 3. Conectar a BD y extraer 1 oferta reciente
try:
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    
    # Buscamos ofertas añadidas en las últimas 12 horas
    time_threshold = datetime.now() - timedelta(hours=12)
    query = """
        SELECT id, title, company, location 
        FROM jobs 
        WHERE created_at >= %s
        ORDER BY created_at DESC 
        LIMIT 20
    """
    cur.execute(query, (time_threshold,))
    recent_jobs = cur.fetchall()
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"❌ Error al consultar PostgreSQL: {e}")
    exit(1)

if not recent_jobs:
    print("🤷‍♂️ No hay ofertas nuevas en las últimas 12h. No se publicará nada.")
    exit(0)

import time

# Seleccionar hasta 3 ofertas para publicar (las más recientes)
jobs_to_tweet = recent_jobs[:3]
print(f"📣 Seleccionadas {len(jobs_to_tweet)} ofertas para publicar en Twitter.")

for idx, job in enumerate(jobs_to_tweet):
    job_id, title, company, location = job
    
    # Extraer tecnología para hashtags
    title_lower = title.lower()
    tags = ["#TrabajoRemoto" if "remoto" in location.lower() or "remote" in location.lower() else "#EmpleoIT"]
    if "react" in title_lower: tags.append("#ReactJS")
    if "python" in title_lower: tags.append("#Python")
    if "java" in title_lower and "javascript" not in title_lower: tags.append("#Java")
    if "node" in title_lower: tags.append("#NodeJS")
    if "devops" in title_lower or "aws" in title_lower: tags.append("#DevOps")
    
    hashtags_str = " ".join(tags)
    
    # 4. Formatear el Tweet
    tweet_text = f"🚀 ¡Nueva oferta de empleo! ({idx+1}/{len(jobs_to_tweet)})\n\n"
    tweet_text += f"💼 {title}\n"
    tweet_text += f"🏢 {company}\n"
    tweet_text += f"📍 {location}\n\n"
    tweet_text += f"👉 Aplica o mira los detalles aquí: {BASE_URL}/job/{job_id}\n\n"
    tweet_text += f"{hashtags_str} #Programacion"
    
    print(f"\n📝 Preparando Tweet {idx+1}:\n{tweet_text}\n")
    
    # 5. Enviar el Tweet
    try:
        response = client.create_tweet(text=tweet_text)
        print(f"✅ ¡Tweet {idx+1} publicado con éxito! ID: {response.data['id']}")
    except Exception as e:
        print(f"❌ Error al enviar el Tweet {idx+1}: {e}")
        # Enviar error a Telegram para depuración
        telegram_token = os.getenv("TELEGRAM_TOKEN")
        admin_id = os.getenv("TELEGRAM_CHANNEL")
        if telegram_token and admin_id:
            import requests
            try:
                requests.post(f"https://api.telegram.org/bot{telegram_token}/sendMessage", json={
                    "chat_id": admin_id,
                    "text": f"❌ *Error en Twitter Bot (Tweet {idx+1}):*\n{e}",
                    "parse_mode": "Markdown"
                })
            except:
                pass
                
    # Esperar 60 segundos antes de enviar el siguiente tweet
    if idx < len(jobs_to_tweet) - 1:
        print("💤 Esperando 60 segundos antes de enviar el siguiente tweet...")
        time.sleep(60)

print("===============================================")
import sys
sys.stdout.flush()
