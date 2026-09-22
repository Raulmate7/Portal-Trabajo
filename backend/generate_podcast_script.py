import os
import sys
import json
import requests
from datetime import datetime
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import psycopg2

try:
    load_dotenv()
except ImportError:
    pass

def generate_podcast_episode():
    print("🎙️ Iniciando Generador de Guiones de Podcast ('El Mercado IT')...")
    api_key = os.getenv("GEMINI_API_KEY")
    db_url = os.getenv("DATABASE_URL")
    
    if not db_url or not api_key:
        print("⚠️ GEMINI_API_KEY o DATABASE_URL no configurada. Omitiendo podcast.")
        return

    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        cur.execute("SELECT COUNT(*) FROM jobs WHERE is_active = 1")
        total_jobs = cur.fetchone()[0]
        cur.close()
        conn.close()

        now = datetime.now()
        date_str = now.strftime('%Y-%m-%d')
        slug = f"podcast-mercado-it-{date_str}"
        title = f"Podcast El Mercado IT: Episodio [{date_str}] — {total_jobs} Vacantes Analizadas"

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={api_key}"
        prompt = f"""
Escribe el guion para un episodio de podcast de 5 minutos titulado 'El Mercado IT'.
Fecha: {date_str}.
Datos clave: Actualmente hay {total_jobs} ofertas de empleo activas en España.

El guion debe incluir:
1. Bienvenida entusiasta del locutor (Raúl M.).
2. Resumen de las 3 tecnologías más demandadas esta semana (React, Python, Cloud/AWS).
3. Consejos para preparar entrevistas técnicas.
4. Cierre invitando a visitar Portal Trabajo IT (/salarios y /trabajos/informatica-tecnologia).

Formato JSON obligatorio:
{{
  "title": "{title}",
  "excerpt": "Episodio semanal del podcast El Mercado IT con el análisis de {total_jobs} vacantes activas.",
  "content": "Guion estructurado en Markdown con diálogos e indicaciones de audio [Música de inicio], [Pausa], etc."
}}
"""
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"}
        }
        res = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=60)
        
        if res.status_code == 200:
            data = json.loads(res.json()['candidates'][0]['content']['parts'][0]['text'])
            conn = psycopg2.connect(db_url)
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO blog_posts (slug, title, excerpt, content, date, author, is_evergreen)
                VALUES (%s, %s, %s, %s, %s, %s, 0)
                ON DUPLICATE KEY UPDATE
                    title = VALUES(title),
                    excerpt = VALUES(excerpt),
                    content = VALUES(content),
                    date = VALUES(date)
            """, (slug, data['title'], data['excerpt'], data['content'], date_str, 'Podcast El Mercado IT'))
            conn.commit()
            cur.close()
            conn.close()
            print(f"🎉 Guion de Podcast publicado exitosamente con slug: {slug}")
        else:
            print(f"⚠️ Error Gemini API: status {res.status_code}")

    except Exception as e:
        print(f"❌ Error en generate_podcast_episode: {e}")

if __name__ == "__main__":
    generate_podcast_episode()
