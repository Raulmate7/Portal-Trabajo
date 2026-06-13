import os
import psycopg2
from dotenv import load_dotenv

def migrate_onboarding():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL no encontrada en las variables de entorno.")
        return

    try:
        print("🔗 Conectando a la base de datos...")
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()

        # 1. Columnas en subscribers
        print("🛠️ Agregando columnas de onboarding a la tabla 'subscribers'...")
        cursor.execute("""
            ALTER TABLE subscribers 
            ADD COLUMN IF NOT EXISTS onboarding_stage INT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS onboarding_last_sent_at TIMESTAMP;
        """)

        # 2. Columnas en jobs
        print("🛠️ Agregando columna 'last_instant_alert_sent_at' a la tabla 'jobs'...")
        cursor.execute("""
            ALTER TABLE jobs 
            ADD COLUMN IF NOT EXISTS last_instant_alert_sent_at TIMESTAMP;
        """)

        # 3. Crear tabla email_tracking
        print("🔨 Creando tabla 'email_tracking' si no existe...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS email_tracking (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                campaign VARCHAR(255) NOT NULL,
                opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        conn.commit()
        
        # Verificar que se crearon correctamente
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'subscribers' 
              AND column_name IN ('onboarding_stage', 'onboarding_last_sent_at');
        """)
        sub_cols = cursor.fetchall()
        print(f"📊 Columnas verificadas en 'subscribers': {sub_cols}")
        
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'jobs' 
              AND column_name = 'last_instant_alert_sent_at';
        """)
        job_cols = cursor.fetchall()
        print(f"📊 Columnas verificadas en 'jobs': {job_cols}")
        
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'email_tracking'
            );
        """)
        table_exists = cursor.fetchone()[0]
        print(f"📊 ¿Existe tabla 'email_tracking'?: {table_exists}")

        cursor.close()
        conn.close()
        print("🎉 Migración de onboarding y tracking completada con éxito.")

    except Exception as e:
        print(f"❌ Error durante la migración: {e}")

if __name__ == "__main__":
    migrate_onboarding()
