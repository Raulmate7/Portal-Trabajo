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

        # 1. Agregar columna is_featured si no existe
        print("🛠️ Agregando columna 'is_featured' a la tabla 'jobs' si no existe...")
        cursor.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;")
        conn.commit()
        print("✅ Columna 'is_featured' verificada/creada con éxito.")

        # 2. Marcar algunas ofertas recientes como destacadas para pruebas (VULN-19: Parametrización estricta)
        print("⭐ Marcando algunas ofertas como destacadas para propósitos de prueba...")
        cursor.execute("SELECT id FROM jobs ORDER BY created_at DESC LIMIT 3;")
        recent_ids = cursor.fetchall()
        if recent_ids:
            ids = [r[0] for r in recent_ids]
            placeholders = ', '.join(['%s'] * len(ids))
            cursor.execute(f"UPDATE jobs SET is_featured = TRUE WHERE id IN ({placeholders});", tuple(ids))
            conn.commit()
            print(f"✅ Se han marcado las ofertas con IDs {ids} como destacadas.")
        else:
            print("⚠️ No se encontraron ofertas en la BD para marcar como destacadas.")

        cursor.close()
        conn.close()
        print("🎉 Migración completada con éxito.")

    except Exception as e:
        print(f"❌ Error durante la migración de base de datos: {e}")

if __name__ == "__main__":
    migrate()
