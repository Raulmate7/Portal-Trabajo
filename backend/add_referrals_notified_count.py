import os
import psycopg2
from dotenv import load_dotenv

def migrate_referral_notified_column():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL no encontrada en las variables de entorno.")
        return

    try:
        print("🔗 Conectando a la base de datos...")
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()

        print("🛠️ Agregando columna 'referrals_notified_count' a la tabla 'subscribers' si no existe...")
        
        cursor.execute("""
            ALTER TABLE subscribers 
            ADD COLUMN IF NOT EXISTS referrals_notified_count INT DEFAULT 0;
        """)
        
        conn.commit()
        
        # Verificar que se añadió correctamente
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'subscribers' 
              AND column_name = 'referrals_notified_count';
        """)
        row = cursor.fetchone()
        print(f"📊 Columna verificada: {row[0] if row else 'NO ENCONTRADA'}")
        
        cursor.close()
        conn.close()
        print("🎉 Migración de columna de referidos completada con éxito.")

    except Exception as e:
        print(f"❌ Error durante la migración: {e}")

if __name__ == "__main__":
    migrate_referral_notified_column()
