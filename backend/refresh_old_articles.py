import os
import sys
import psycopg2
from datetime import datetime, timedelta
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def refresh_old_articles():
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass

    print("🔄 Iniciando Módulo de Actualización de Contenido Evergreen...")
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("⚠️ DATABASE_URL no encontrada. Omitiendo actualización.")
        return

    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Buscar artículos publicados hace más de 180 días con is_evergreen = 1
        six_months_ago = (datetime.now() - timedelta(days=180)).strftime('%Y-%m-%d')
        cur.execute("""
            SELECT slug, title, date 
            FROM blog_posts 
            WHERE is_evergreen = 1 AND date <= %s 
            ORDER BY date ASC 
            LIMIT 3
        """, (six_months_ago,))
        
        old_posts = cur.fetchall()
        if not old_posts:
            print("✨ Todos los artículos evergreen están actualizados al día de hoy.")
            conn.close()
            return

        today_str = datetime.now().strftime('%Y-%m-%d')
        for post in old_posts:
            slug, title, old_date = post
            print(f"✏️ Revalidando fecha del artículo evergreen: '{title}' ({slug}) de {old_date} a {today_str}...")
            
            cur.execute("""
                UPDATE blog_posts 
                SET date = %s 
                WHERE slug = %s
            """, (today_str, slug))
            
        conn.commit()
        cur.close()
        conn.close()
        print("✅ Revalidación de artículos evergreen completada exitosamente.")

    except Exception as e:
        print(f"❌ Error durante la actualización de artículos evergreen: {e}")

if __name__ == "__main__":
    refresh_old_articles()
