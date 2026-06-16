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

        # Detectar si es Postgres o MySQL
        is_postgres = True
        try:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()[0]
            if "mysql" in version.lower() or "mariadb" in version.lower():
                is_postgres = False
        except Exception:
            pass

        print(f"🛠️ Creando tabla 'job_reactions' (Postgres: {is_postgres})...")
        if is_postgres:
            query = """
            CREATE TABLE IF NOT EXISTS job_reactions (
                id SERIAL PRIMARY KEY,
                job_id VARCHAR(36) NOT NULL,
                reaction_type VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
            );
            """
        else:
            query = """
            CREATE TABLE IF NOT EXISTS job_reactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                job_id VARCHAR(36) NOT NULL,
                reaction_type VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """
        
        cursor.execute(query)
        conn.commit()
        print("✅ Tabla 'job_reactions' creada/verificada con éxito.")

        cursor.close()
        conn.close()
        print("🎉 Migración de job_reactions completada.")

    except Exception as e:
        print(f"❌ Error durante la creación de la tabla: {e}")

if __name__ == "__main__":
    migrate()
