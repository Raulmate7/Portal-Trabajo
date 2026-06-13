import os
import psycopg2
from dotenv import load_dotenv

def migrate_social_columns():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL no encontrada en las variables de entorno.")
        return

    try:
        print("🔗 Conectando a la base de datos...")
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()

        print("🛠️ Agregando columnas de redes sociales a la tabla 'jobs' si no existen...")
        
        # Agregar columnas para redes sociales
        cursor.execute("""
            ALTER TABLE jobs 
            ADD COLUMN IF NOT EXISTS last_tweeted_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS last_linkedin_posted_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS last_tooted_at TIMESTAMP;
        """)
        
        conn.commit()
        
        # Verificar que se añadieron correctamente
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'jobs' 
              AND column_name IN ('last_tweeted_at', 'last_linkedin_posted_at', 'last_tooted_at');
        """)
        columns = [row[0] for row in cursor.fetchall()]
        print(f"📊 Columnas verificadas/creadas: {columns}")
        
        cursor.close()
        conn.close()
        print("🎉 Migración de columnas de redes sociales completada con éxito.")

    except Exception as e:
        print(f"❌ Error durante la migración: {e}")

if __name__ == "__main__":
    migrate_social_columns()
