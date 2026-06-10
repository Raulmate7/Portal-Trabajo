import os
import psycopg2
from dotenv import load_dotenv

def migrate():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL no encontrada en las variables de entorno.")
        return

    try:
        print("🔗 Conectando a la base de datos...")
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()

        print("🛠️ Agregando nuevas columnas a la tabla 'jobs' si no existen...")
        
        cursor.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;")
        cursor.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS title_es VARCHAR(255);")
        cursor.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS description_snippet_es TEXT;")
        cursor.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_min NUMERIC;")
        cursor.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_max NUMERIC;")
        cursor.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_currency VARCHAR(10) DEFAULT 'EUR';")
        
        conn.commit()
        print("✅ Columnas verificadas/creadas con éxito:")
        print("   - is_active (BOOLEAN)")
        print("   - title_es (VARCHAR)")
        print("   - description_snippet_es (TEXT)")
        print("   - salary_min (NUMERIC)")
        print("   - salary_max (NUMERIC)")
        print("   - salary_currency (VARCHAR)")

        # Rellenar con valores predeterminados para registros existentes
        print("🔄 Inicializando valores predeterminados...")
        cursor.execute("UPDATE jobs SET is_active = TRUE WHERE is_active IS NULL;")
        conn.commit()
        print("✅ Inicialización completada.")

        cursor.close()
        conn.close()
        print("🎉 Migración V2 completada con éxito.")

    except Exception as e:
        print(f"❌ Error durante la migración: {e}")

if __name__ == "__main__":
    migrate()
