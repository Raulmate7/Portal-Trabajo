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

        print("🛠️ Agregando columna 'referred_by' a la tabla 'subscribers' si no existe...")
        try:
            cursor.execute("ALTER TABLE subscribers ADD COLUMN referred_by VARCHAR(255) NULL;")
            conn.commit()
            print("✅ Columna 'referred_by' agregada con éxito.")
        except Exception as e:
            conn.rollback()
            err_msg = str(e).lower()
            if "duplicate column" in err_msg or "already exists" in err_msg or "1060" in err_msg:
                print("ℹ️ La columna 'referred_by' ya existe.")
            else:
                print(f"⚠️ Advertencia al agregar columna: {e}")

        cursor.close()
        conn.close()
        print("🎉 Migración de subscribers completada.")

    except Exception as e:
        print(f"❌ Error durante la migración: {e}")

if __name__ == "__main__":
    migrate()
