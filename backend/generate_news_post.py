import os
import sys
import json
import requests
from datetime import datetime
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

NEWS_TOPICS = [
    {
        "slug_suffix": "subida-salarios-devops-cloud-espana",
        "title": "Aumento del 12% en los Salarios de DevOps y Cloud en España este año",
        "excerpt": "Las empresas tecnológicas en Madrid y Barcelona incrementan las bandas salariales para especialistas Cloud debido a la fuerte escasez de talento.",
        "prompt": "Escribe una noticia periodística de actualidad laboral IT de unas 800 palabras explicando por qué los salarios de DevOps y Cloud Architects han subido en España. Cita datos de mercado, demandas en AWS y Kubernetes, y consejos para profesionales que quieran negociar subida."
    },
    {
        "slug_suffix": "demanda-desarrolladores-fullstack-ai-remoto",
        "title": "La demanda de Desarrolladores Fullstack con IA se dispara un 40% en Europa",
        "excerpt": "El perfil de programador Fullstack capaz de integrar APIs de LLMs se convierte en la posición más codiciada por las startups europeas.",
        "prompt": "Escribe una noticia periodística de actualidad sobre el boom de contratación de desarrolladores Fullstack con experiencia en integración de modelos de IA (OpenAI, Gemini, Anthropic). Explica los salarios medios en remoto desde España."
    },
    {
        "slug_suffix": "hubs-tecnologicos-malaga-valencia-contratacion",
        "title": "Málaga y Valencia consolidan su posición como hubs tecnológicos líderes en España",
        "excerpt": "Multinacionales de software abren nuevas sedes en Málaga TechPark y Marina de Valencia generando más de 3.000 nuevos empleos informáticos.",
        "prompt": "Escribe una noticia sobre la expansión de los hubs informáticos de Málaga y Valencia, comparándolos con Madrid y Barcelona en coste de vida, teletrabajo y número de vacantes tecnológicas."
    }
]

import psycopg2

def generate_news_article():
    print("📰 Iniciando Generador de Noticias IT de Actualidad...")
    api_key = os.getenv("GEMINI_API_KEY")
    db_url = os.getenv("DATABASE_URL")
    
    try:
        conn = psycopg2.connect(db_url) if db_url else psycopg2.connect("")
    except Exception as e:
        print(f"❌ Error al conectar a la BD: {e}")
        return
        
    cur = conn.cursor()
    now = datetime.now()
    date_str = now.strftime('%Y-%m-%d')

    # Seleccionar un tema rotativo según el día del mes
    topic_idx = now.day % len(NEWS_TOPICS)
    topic = NEWS_TOPICS[topic_idx]
    slug = f"tendencias-news-{topic['slug_suffix']}-{date_str}"
    
    if api_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={api_key}"
            prompt_text = f"""
Escribe una noticia periodística rigurosa, profesional y atractiva en español para un portal de empleo de tecnología sobre: "{topic['title']}".
{topic['prompt']}

Formato de respuesta JSON obligatorio:
{{
  "title": "{topic['title']}",
  "excerpt": "{topic['excerpt']}",
  "content": "Contenido en Markdown con encabezados H2, H3, negritas, listas e interlinking a [/salarios](/salarios) y [/trabajos/informatica-tecnologia](/trabajos/informatica-tecnologia)."
}}
"""
            payload = {
                "contents": [{"parts": [{"text": prompt_text}]}],
                "generationConfig": {"responseMimeType": "application/json"}
            }
            res = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=60)
            if res.status_code == 200:
                data = json.loads(res.json()['candidates'][0]['content']['parts'][0]['text'])
                title = data.get('title', topic['title'])
                excerpt = data.get('excerpt', topic['excerpt'])
                content = data.get('content', '')
            else:
                title = topic['title']
                excerpt = topic['excerpt']
                content = f"## {topic['title']}\n\n{topic['excerpt']}\n\nConsulte las ofertas activas en nuestro portal."
        except Exception as e:
            print(f"⚠️ Error llamando a Gemini para noticias: {e}. Usando plantilla fallback.")
            title = topic['title']
            excerpt = topic['excerpt']
            content = f"## {topic['title']}\n\n{topic['excerpt']}\n\nPara ver todas las ofertas de empleo relacionadas, visita la sección de [Vacantes IT](/trabajos/informatica-tecnologia)."
    else:
        title = topic['title']
        excerpt = topic['excerpt']
        content = f"## {topic['title']}\n\n{topic['excerpt']}\n\nPara más información sobre el mercado de trabajo IT, consulta nuestra [Calculadora de Salarios](/salarios)."

    try:
        cur.execute("""
            INSERT INTO blog_posts (slug, title, excerpt, content, date, author, is_evergreen)
            VALUES (%s, %s, %s, %s, %s, %s, 0)
            ON DUPLICATE KEY UPDATE
                title = VALUES(title),
                excerpt = VALUES(excerpt),
                content = VALUES(content),
                date = VALUES(date),
                author = VALUES(author)
        """, (slug, title, excerpt, content, date_str, 'Redacción Portal IT'))
        conn.commit()
        print(f"🎉 Noticia publicada exitosamente con slug: {slug}")
    except Exception as e:
        print(f"❌ Error guardando noticia en BD: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    generate_news_article()
