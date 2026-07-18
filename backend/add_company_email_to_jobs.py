import os
import psycopg2
from dotenv import load_dotenv

def migrate_company_email():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL no encontrada en las variables de entorno.")
        return

    try:
        print("🔗 Conectando a la base de datos...")
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()

        print("🛠️ Agregando columna 'company_email' a la tabla 'jobs' si no existe...")
        
        cursor.execute("""
            ALTER TABLE jobs 
            ADD COLUMN IF NOT EXISTS company_email VARCHAR(255);
        """)
        
        conn.commit()
        
        # Verificar
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'jobs' 
              AND column_name = 'company_email';
        """)
        row = cursor.fetchone()
        print(f"📊 Columna verificada: {row[0] if row else 'NO ENCONTRADA'}")
        
        cursor.close()
        conn.close()
        print("🎉 Migración de columna company_email completada con éxito.")

    except Exception as e:
        print(f"❌ Error durante la migración: {e}")

if __name__ == "__main__":
    migrate_company_email()
