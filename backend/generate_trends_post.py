import os
import re
from datetime import datetime, timedelta
from db_helper import get_db_connection
from dotenv import load_dotenv

load_dotenv()

TECNOLOGIAS = [
    'react', 'angular', 'vue', 'node', 'python', 'java', 'typescript', 'aws', 'docker', 
    'flutter', 'csharp', 'php', 'sql', 'go', 'rust', 'ruby', 'scala', 'elixir', 
    'salesforce', 'cybersecurity'
]

DISPLAY_NAMES = {
    'react': 'React', 'angular': 'Angular', 'vue': 'Vue.js', 'node': 'Node.js', 
    'python': 'Python', 'java': 'Java', 'typescript': 'TypeScript', 'aws': 'AWS', 
    'docker': 'Docker', 'flutter': 'Flutter', 'csharp': 'C# / .NET', 'php': 'PHP', 
    'sql': 'SQL / Bases de Datos', 'go': 'Go', 'rust': 'Rust', 'ruby': 'Ruby', 
    'scala': 'Scala', 'elixir': 'Elixir', 'salesforce': 'Salesforce', 'cybersecurity': 'Ciberseguridad'
}

def generate_trends_post():
    print("📈 Iniciando generación de artículo semanal de tendencias...")

    try:
        conn = get_db_connection()
        cur = conn.cursor()
    except Exception as e:
        print(f"❌ Error de BD: {e}")
        return

    # 1. Asegurar que existe la tabla blog_posts en MySQL
    try:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS blog_posts (
                slug VARCHAR(255) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                excerpt TEXT,
                content LONGTEXT,
                date VARCHAR(50),
                author VARCHAR(100),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                is_evergreen INT DEFAULT 1
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)
        conn.commit()
    except Exception as e:
        print(f"❌ Error asegurando la tabla blog_posts: {e}")
        conn.close()
        return

    # 2. Fechas para intervalos
    now = datetime.now()
    seven_days_ago = now - timedelta(days=7)
    fourteen_days_ago = now - timedelta(days=14)

    stats = []

    # 3. Consultar estadísticas por tecnología
    for tech in TECNOLOGIAS:
        tech_pattern = f"%{tech}%"
        try:
            # Periodo actual (últimos 7 días)
            cur.execute("""
                SELECT COUNT(*) FROM jobs 
                WHERE is_active = 1 
                  AND created_at >= %s
                  AND (title LIKE %s OR description_snippet LIKE %s)
            """, (seven_days_ago, tech_pattern, tech_pattern))
            current_count = cur.fetchone()[0]

            # Periodo anterior (hace 8-14 días)
            cur.execute("""
                SELECT COUNT(*) FROM jobs 
                WHERE is_active = 1 
                  AND created_at >= %s 
                  AND created_at < %s
                  AND (title LIKE %s OR description_snippet LIKE %s)
            """, (fourteen_days_ago, seven_days_ago, tech_pattern, tech_pattern))
            previous_count = cur.fetchone()[0]

            growth = 0
            if previous_count > 0:
                growth = round(((current_count - previous_count) / previous_count) * 100, 1)
            elif current_count > 0:
                growth = 100.0  # Crecimiento del 100% si antes no había nada

            stats.append({
                'tech': tech,
                'name': DISPLAY_NAMES[tech],
                'current': current_count,
                'previous': previous_count,
                'growth': growth
            })
        except Exception as e:
            print(f"⚠️ Error recopilando estadísticas para {tech}: {e}")

    # 4. Procesar estadísticas para el artículo
    # Ordenar por volumen actual para ver los más populares
    popular_techs = sorted(stats, key=lambda x: x['current'], reverse=True)
    # Ordenar por crecimiento (con volumen mínimo de 2 ofertas en el periodo actual para evitar ruido de poco volumen)
    growing_techs = sorted([s for s in stats if s['current'] >= 2], key=lambda x: x['growth'], reverse=True)

    top_volume = popular_techs[:3]
    top_growth = growing_techs[:3]

    # Datos generales de la semana
    try:
        cur.execute("SELECT COUNT(*) FROM jobs WHERE is_active = 1 AND created_at >= %s", (seven_days_ago,))
        total_weekly_jobs = cur.fetchone()[0]
    except:
        total_weekly_jobs = sum(t['current'] for t in stats)

    # 5. Redactar el artículo
    meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    mes_str = meses[now.month - 1].capitalize()
    
    slug_date = now.strftime('%Y-%m-%d')
    slug = f"tendencias-empleo-tech-espana-{slug_date}"
    title = f"Tendencias de Empleo Tech en España: Análisis de Mercado [{slug_date}]"
    
    excerpt = f"Análisis semanal del mercado laboral tecnológico en España. Descubre cuáles son las tecnologías en auge, los perfiles más demandados y las estadísticas de vacantes de la semana."

    # Cuerpo del artículo en Markdown
    content = f"""
El mercado laboral tecnológico en España es una entidad extremadamente dinámica. Cada semana, cientos de nuevas ofertas de empleo en programación, ingeniería de sistemas y ciencia de datos se publican en nuestro portal. Para los profesionales IT y los candidatos en búsqueda activa, conocer qué tecnologías están ganando peso o cuáles registran el mayor volumen de contratación es vital para tomar decisiones de carrera inteligentes.

En este análisis exclusivo correspondiente al **{now.day} de {mes_str} de {now.year}**, desglosamos las estadísticas reales de nuestra base de datos. Evaluamos las vacantes registradas en los últimos 7 días y su variación respecto a la semana anterior para identificar los stacks clave de contratación.

---

## 📊 Resumen del Mercado en Cifras
Durante la última semana, se han registrado un total de **{total_weekly_jobs} nuevas ofertas de empleo tecnológico activas** en España. La distribución geográfica sigue estando fuertemente concentrada en los centros de Madrid y Barcelona, seguidos por un auge en los hubs de Málaga y Valencia, y la consolidación de las vacantes 100% en remoto (teletrabajo).

---

## 🚀 Las Tecnologías con Mayor Crecimiento Semanal
El crecimiento porcentual revela qué stacks tecnológicos están experimentando repuntes de contratación rápidos por parte de las empresas. A continuación, destacamos las tecnologías con mayor variación positiva en la última semana:

"""

    for idx, item in enumerate(top_growth):
        emoji = "🥇" if idx == 0 else ("🥈" if idx == 1 else "🥉")
        sign = "+" if item['growth'] >= 0 else ""
        content += f"""### {emoji} {item['name']} ({sign}{item['growth']}%)
* **Ofertas esta semana:** {item['current']}
* **Ofertas semana anterior:** {item['previous']}
* **Análisis:** {item['name']} destaca como una de las tecnologías de mayor evolución en el mercado. Esta tendencia se justifica por la necesidad de las empresas de incorporar profesionales capaces de sumarse a proyectos en marcha de forma inmediata.

"""

    content += """
---

## 🔥 Las Tecnologías Más Demandadas (Mayor Volumen de Vacantes)
Si buscas estabilidad y una probabilidad de contratación alta debido a un gran volumen de ofertas, estos son los stacks que siguen dominando las mesas de contratación en España:

"""

    for idx, item in enumerate(top_volume):
        content += f"""### {idx+1}. {item['name']} ({item['current']} vacantes activas)
* **Cuota de mercado estimada:** {round((item['current']/max(1, total_weekly_jobs))*100, 1)}% del empleo tech de la semana.
* **Perfil de la demanda:** {item['name']} sigue siendo imprescindible en las estructuras de software empresarial. Los perfiles que dominan este stack son contactados con frecuencia por reclutadores.

"""

    content += f"""
---

## 💡 Recomendaciones de Carrera
Basándonos en las cifras reales de reclutamiento de esta semana, te sugerimos los siguientes pasos prácticos para impulsar tu perfil técnico:

1. **Especialización:** Si dominas **{top_volume[0]['name']}**, te encuentras en la categoría de mayor volumen. Optimiza tu perfil técnico y destaca tus habilidades en metodologías de entrega continua para destacar.
2. **Tecnologías Emergentes:** El crecimiento de **{top_growth[0]['name']}** indica que las startups y las consultoras de desarrollo ágil están aumentando presupuestos en este stack. Considera realizar certificaciones oficiales.
3. **Optimización Salarial:** Recuerda que puedes contrastar tu retribución esperada utilizando nuestra [Calculadora de Salarios IT](/salarios), segmentada de forma interactiva por stack técnico y nivel de experiencia en España.

*Los datos de este informe de tendencias se calculan de manera automatizada a partir de vacantes agregadas de fuentes públicas de empleo en España.*
"""

    # 6. Insertar/Actualizar en la BD
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
        """, (slug, title, excerpt, content, now.strftime('%Y-%m-%d'), 'Sistema de Tendencias IT'))
        conn.commit()
        print(f"🎉 Artículo de tendencias publicado con éxito en la BD con slug: {slug}")
    except Exception as e:
        print(f"❌ Error al guardar el artículo en la base de datos: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    generate_trends_post()
