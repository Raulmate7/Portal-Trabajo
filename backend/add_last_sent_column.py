import os
import psycopg2
from dotenv import load_dotenv

def migrate_subscribers():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL no encontrada en las variables de entorno.")
        return

    try:
        print("🔗 Conectando a la base de datos...")
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()

        print("🛠️ Agregando columna 'last_sent_at' a la tabla 'subscribers' si no existe...")
        cursor.execute("""
            ALTER TABLE subscribers 
            ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMP;
        """)
        
        conn.commit()
        cursor.close()
        conn.close()
        print("🎉 Columna 'last_sent_at' verificada/creada con éxito en 'subscribers'.")

    except Exception as e:
        print(f"❌ Error durante la migración: {e}")

if __name__ == "__main__":
    migrate_subscribers()
