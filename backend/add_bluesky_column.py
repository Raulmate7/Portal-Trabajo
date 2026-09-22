import os
import psycopg2
from dotenv import load_dotenv

def migrate_bluesky_column():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL no encontrada en las variables de entorno.")
        return

    try:
        print("🔗 Conectando a la base de datos...")
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()

        print("🛠️ Agregando columna last_bluesky_posted_at a la tabla 'jobs' si no existe...")
        
        cursor.execute("""
            ALTER TABLE jobs 
            ADD COLUMN IF NOT EXISTS last_bluesky_posted_at TIMESTAMP;
        """)
        
        conn.commit()
        cursor.close()
        conn.close()
        print("🎉 Migración de columna last_bluesky_posted_at completada con éxito.")

    except Exception as e:
        print(f"❌ Error durante la migración de Bluesky: {e}")

if __name__ == "__main__":
    migrate_bluesky_column()
