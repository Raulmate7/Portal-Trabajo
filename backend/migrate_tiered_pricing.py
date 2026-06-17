import os
import sys
from dotenv import load_dotenv

# Añadir el directorio actual al path por si acaso
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db_helper import get_db_connection

def migrate():
    load_dotenv()
    print("🛠️ Iniciando migración de base de datos para tarifas de pago...")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # 1. Obtener columnas existentes
        cursor.execute("SHOW COLUMNS FROM jobs")
        columns = [row[0] for row in cursor.fetchall()]
        print(f"📊 Columnas encontradas en la tabla 'jobs': {columns}")

        # 2. Agregar columna 'plan' si no existe
        if 'plan' not in columns:
            print("🔧 Agregando columna 'plan' a la tabla 'jobs'...")
            cursor.execute("ALTER TABLE jobs ADD COLUMN plan VARCHAR(50) DEFAULT 'free';")
            print("✅ Columna 'plan' agregada con éxito.")
        else:
            print("ℹ️ La columna 'plan' ya existe. Saltando...")

        # 3. Agregar columna 'featured_expires_at' si no existe
        if 'featured_expires_at' not in columns:
            print("🔧 Agregando columna 'featured_expires_at' a la tabla 'jobs'...")
            cursor.execute("ALTER TABLE jobs ADD COLUMN featured_expires_at TIMESTAMP NULL DEFAULT NULL;")
            print("✅ Columna 'featured_expires_at' agregada con éxito.")
        else:
            print("ℹ️ La columna 'featured_expires_at' ya existe. Saltando...")

        cursor.close()
        conn.close()
        print("🎉 Migración completada con éxito.")

    except Exception as e:
        print(f"❌ Error durante la migración de base de datos: {e}")
        sys.exit(1)

if __name__ == "__main__":
    migrate()
