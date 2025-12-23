import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")

def create_table():
    try:
        print("🔌 Conectando a la base de datos...")
        conn = psycopg2.connect(DB_URL)
        cursor = conn.cursor()
        
        print("🔨 Creando tabla 'subscribers'...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS subscribers (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        conn.commit()
        cursor.close()
        conn.close()
        print("✅ ¡Éxito! La tabla 'subscribers' ha sido creada (o ya existía).")
        print("   Ya tienes el 'buzón' listo para guardar emails.")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    create_table()
