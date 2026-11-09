import os
import psycopg2
from dotenv import load_dotenv

def apply_indexes():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    
    if not db_url:
        print("❌ Error: DATABASE_URL no definida en .env")
        return
        
    sql_path = "database_optimization.sql"
    if not os.path.exists(sql_path):
        print(f"❌ Error: No se encontró el archivo {sql_path}")
        return
        
    print("🔌 Conectando a la base de datos...")
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        cur = conn.cursor()
        
        # VULN-32: Detectar motor de base de datos para ejecutar sintaxis de índices compatible
        is_postgres = True
        try:
            cur.execute("SELECT version();")
            ver = str(cur.fetchone()[0]).lower()
            if "mysql" in ver or "mariadb" in ver:
                is_postgres = False
        except Exception:
            is_postgres = False
            
        print(f"⚡ Aplicando índices de optimización (Motor detectado: {'PostgreSQL' if is_postgres else 'MySQL'})...")
        if is_postgres:
            cur.execute("""
                CREATE EXTENSION IF NOT EXISTS pg_trgm;
                CREATE INDEX IF NOT EXISTS jobs_title_trgm_idx ON jobs USING gin (title gin_trgm_ops);
                CREATE INDEX IF NOT EXISTS jobs_location_trgm_idx ON jobs USING gin (location gin_trgm_ops);
                CREATE INDEX IF NOT EXISTS jobs_category_idx ON jobs (category);
                CREATE INDEX IF NOT EXISTS jobs_is_featured_idx ON jobs (is_featured);
                CREATE INDEX IF NOT EXISTS jobs_created_at_idx ON jobs (created_at DESC);
            """)
            cur.execute("SELECT indexname FROM pg_indexes WHERE tablename = 'jobs';")
            indexes = [r[0] for r in cur.fetchall()]
        else:
            # Creación segura de índices en MySQL
            mysql_indexes = [
                ("idx_jobs_created_at", "CREATE INDEX idx_jobs_created_at ON jobs (created_at DESC);"),
                ("idx_jobs_is_featured", "CREATE INDEX idx_jobs_is_featured ON jobs (is_featured);"),
                ("idx_jobs_is_active", "CREATE INDEX idx_jobs_is_active ON jobs (is_active);"),
                ("idx_jobs_category", "CREATE INDEX idx_jobs_category ON jobs (category);"),
                ("idx_jobs_search", "CREATE FULLTEXT INDEX idx_jobs_search ON jobs (title, company, location);")
            ]
            for idx_name, idx_sql in mysql_indexes:
                try:
                    cur.execute(idx_sql)
                    print(f" - ✅ Creado índice '{idx_name}'")
                except Exception as idx_err:
                    err_msg = str(idx_err).lower()
                    if "duplicate key" in err_msg or "already exists" in err_msg or "1061" in err_msg:
                        print(f" - ℹ️ El índice '{idx_name}' ya existe.")
                    else:
                        print(f" - ⚠️ Nota en índice '{idx_name}': {idx_err}")
            cur.execute("SHOW INDEX FROM jobs;")
            indexes = list(set([r[2] for r in cur.fetchall()]))
            
        print("\n📋 Índices activos en la tabla 'jobs':")
        for name in indexes:
            print(f" - {name}")
            
        conn.close()
        print("✅ ¡Optimizaciones aplicadas correctamente!")
    except Exception as e:
        print(f"❌ Error aplicando optimizaciones: {e}")

if __name__ == "__main__":
    apply_indexes()
