import sys
import os
import json
import pymysql
from datetime import datetime

# 1. Truco de importación para cargar el verdadero psycopg2 instalado en el sistema
# y evitar cargar el archivo psycopg2.py local que está en este mismo directorio.
original_path = list(sys.path)
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path = [p for p in sys.path if p != current_dir and p != '']

try:
    import psycopg2
finally:
    # Restauramos el path original
    sys.path = original_path

# Cargamos el archivo .env
from dotenv import load_dotenv
load_dotenv()

# URLs de base de datos
SUPABASE_URL = os.getenv("DATABASE_URL") # postgresql://...
# Si DATABASE_URL ya apunta a MySQL, se puede configurar SUPABASE_URL a mano
if not SUPABASE_URL or not SUPABASE_URL.startswith("postgres"):
    # Si la variable principal se ha cambiado, buscamos en el entorno
    SUPABASE_URL = "postgresql://postgres.ggwrsvzlaxeephkhwmtn:Tolili07@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"

# Credenciales de MySQL
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))

if not MYSQL_USER or not MYSQL_PASSWORD or not MYSQL_DATABASE:
    raise ValueError("❌ Error: Faltan credenciales de base de datos MySQL en las variables de entorno.")

print("🔌 Conectando a Supabase (PostgreSQL)...")
try:
    pg_conn = psycopg2.connect(SUPABASE_URL)
    pg_cur = pg_conn.cursor()
    print("✅ Conexión a Supabase establecida.")
except Exception as e:
    print(f"❌ Error conectando a Supabase: {e}")
    sys.exit(1)

print("🔌 Conectando a Raiola (MySQL)...")
try:
    mysql_conn = pymysql.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DATABASE,
        port=MYSQL_PORT,
        charset='utf8mb4',
        autocommit=True
    )
    mysql_cur = mysql_conn.cursor()
    print("✅ Conexión a MySQL establecida.")
except Exception as e:
    print(f"❌ Error conectando a MySQL: {e}")
    pg_conn.close()
    sys.exit(1)

# Definición de DDL de tablas
DDL_TABLES = {
    "sectors": """
        CREATE TABLE IF NOT EXISTS sectors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            keywords JSON NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """,
    "jobs": """
        CREATE TABLE IF NOT EXISTS jobs (
            id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            sector_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_featured BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            salary_min DECIMAL(12, 2),
            salary_max DECIMAL(12, 2),
            last_tweeted_at TIMESTAMP NULL,
            last_linkedin_posted_at TIMESTAMP NULL,
            last_tooted_at TIMESTAMP NULL,
            last_instant_alert_sent_at TIMESTAMP NULL,
            title_es VARCHAR(255),
            description_snippet_es TEXT,
            title TEXT NOT NULL,
            company VARCHAR(255) NOT NULL,
            location VARCHAR(1000) DEFAULT 'España',
            salary VARCHAR(255),
            description_snippet TEXT,
            url_source VARCHAR(700) UNIQUE NOT NULL,
            salary_currency VARCHAR(10) DEFAULT 'EUR',
            category VARCHAR(255) DEFAULT 'Otros',
            FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """,
    "subscribers": """
        CREATE TABLE IF NOT EXISTS subscribers (
            id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            email VARCHAR(255) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_sent_at TIMESTAMP NULL,
            onboarding_stage INT DEFAULT 0,
            onboarding_last_sent_at TIMESTAMP NULL,
            tech_keywords TEXT,
            location_pref TEXT,
            frequency VARCHAR(50) DEFAULT 'weekly'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """,
    "alerts": """
        CREATE TABLE IF NOT EXISTS alerts (
            id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            email VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """,
    "sponsored_jobs": """
        CREATE TABLE IF NOT EXISTS sponsored_jobs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_name VARCHAR(255) NOT NULL,
            company_email VARCHAR(255) NOT NULL,
            company_phone VARCHAR(255),
            job_title VARCHAR(255) NOT NULL,
            job_location VARCHAR(255) NOT NULL,
            job_salary VARCHAR(255),
            job_description TEXT NOT NULL,
            job_url VARCHAR(255) NOT NULL,
            plan VARCHAR(255) DEFAULT 'basico',
            status VARCHAR(255) DEFAULT 'pendiente',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """,
    "email_tracking": """
        CREATE TABLE IF NOT EXISTS email_tracking (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            campaign VARCHAR(255) NOT NULL,
            opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """,
    "premium_leads": """
        CREATE TABLE IF NOT EXISTS premium_leads (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            stack VARCHAR(255) NOT NULL,
            experience VARCHAR(255) NOT NULL,
            linkedin VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
}

# Crear las tablas en MySQL
print("\n🔨 Creando tablas en MySQL...")
# Desactivamos comprobaciones de claves foráneas temporalmente para la creación limpia
mysql_cur.execute("SET FOREIGN_KEY_CHECKS = 0;")
for table, ddl in DDL_TABLES.items():
    print(f"  - Creando tabla '{table}'...")
    mysql_cur.execute(f"DROP TABLE IF EXISTS {table};")
    mysql_cur.execute(ddl)
mysql_cur.execute("SET FOREIGN_KEY_CHECKS = 1;")
print("✅ Creación de tablas e índices completada.")

# Función genérica de migración de datos
def migrate_table(table_name, select_cols, insert_cols, convert_row_fn=None):
    print(f"\n📦 Migrando datos de tabla '{table_name}'...")
    
    # 1. Leer de Postgres
    cols_str = ", ".join(select_cols)
    pg_cur.execute(f"SELECT {cols_str} FROM {table_name}")
    rows = pg_cur.fetchall()
    
    if not rows:
        print(f"  - No hay registros en '{table_name}' para migrar.")
        return

    print(f"  - Encontrados {len(rows)} registros. Insertando en MySQL...")
    
    # 2. Insertar en MySQL
    placeholders = ", ".join(["%s"] * len(insert_cols))
    insert_cols_str = ", ".join(insert_cols)
    insert_sql = f"INSERT INTO {table_name} ({insert_cols_str}) VALUES ({placeholders})"
    
    batch_data = []
    for row in rows:
        val_list = list(row)
        if convert_row_fn:
            val_list = convert_row_fn(val_list)
        batch_data.append(tuple(val_list))
    
    # Inserción en lotes de 100
    batch_size = 100
    for i in range(0, len(batch_data), batch_size):
        batch = batch_data[i:i + batch_size]
        mysql_cur.executemany(insert_sql, batch)
        
    print(f"  - ✅ Migrados {len(batch_data)} registros en '{table_name}'.")

# Conversiones específicas para tipos de datos de Postgres a MySQL

def convert_sectors(row):
    # La columna 'keywords' de Postgres es ARRAY de TEXT.
    # En MySQL es JSON, por lo que la serializamos a JSON String.
    keywords_array = row[2]
    row[2] = json.dumps(keywords_array)
    return row

def convert_jobs(row):
    # Convertimos tipos Booleanos y UUIDs
    # indices: is_featured (row[3]), is_active (row[4])
    row[3] = 1 if row[3] else 0
    row[4] = 1 if row[4] else 0
    return row

# 1. Migrar 'sectors' (Primero por claves foráneas)
migrate_table(
    table_name="sectors",
    select_cols=["id", "name", "slug", "keywords"],
    insert_cols=["id", "name", "slug", "keywords"],
    convert_row_fn=convert_sectors
)

# 2. Migrar 'jobs'
migrate_table(
    table_name="jobs",
    select_cols=[
        "id", "sector_id", "created_at", "is_featured", "is_active", 
        "salary_min", "salary_max", "last_tweeted_at", "last_linkedin_posted_at", 
        "last_tooted_at", "last_instant_alert_sent_at", "title_es", "description_snippet_es", 
        "title", "company", "location", "salary", "description_snippet", "url_source", 
        "salary_currency", "category"
    ],
    insert_cols=[
        "id", "sector_id", "created_at", "is_featured", "is_active", 
        "salary_min", "salary_max", "last_tweeted_at", "last_linkedin_posted_at", 
        "last_tooted_at", "last_instant_alert_sent_at", "title_es", "description_snippet_es", 
        "title", "company", "location", "salary", "description_snippet", "url_source", 
        "salary_currency", "category"
    ],
    convert_row_fn=convert_jobs
)

# 3. Migrar 'subscribers'
migrate_table(
    table_name="subscribers",
    select_cols=[
        "id", "email", "created_at", "last_sent_at", "onboarding_stage", 
        "onboarding_last_sent_at", "tech_keywords", "location_pref", "frequency"
    ],
    insert_cols=[
        "id", "email", "created_at", "last_sent_at", "onboarding_stage", 
        "onboarding_last_sent_at", "tech_keywords", "location_pref", "frequency"
    ]
)

# 4. Migrar 'alerts'
migrate_table(
    table_name="alerts",
    select_cols=["id", "email", "created_at"],
    insert_cols=["id", "email", "created_at"]
)

# 5. Migrar 'sponsored_jobs'
migrate_table(
    table_name="sponsored_jobs",
    select_cols=[
        "id", "company_name", "company_email", "company_phone", "job_title", 
        "job_location", "job_salary", "job_description", "job_url", "plan", 
        "status", "created_at"
    ],
    insert_cols=[
        "id", "company_name", "company_email", "company_phone", "job_title", 
        "job_location", "job_salary", "job_description", "job_url", "plan", 
        "status", "created_at"
    ]
)

# 6. Migrar 'email_tracking'
migrate_table(
    table_name="email_tracking",
    select_cols=["id", "email", "campaign", "opened_at"],
    insert_cols=["id", "email", "campaign", "opened_at"]
)

# 7. Migrar 'premium_leads'
migrate_table(
    table_name="premium_leads",
    select_cols=["id", "name", "email", "stack", "experience", "linkedin", "created_at"],
    insert_cols=["id", "name", "email", "stack", "experience", "linkedin", "created_at"]
)

# Crear índices adicionales en MySQL
print("\n⚡ Añadiendo índices de optimización en MySQL...")
try:
    mysql_cur.execute("CREATE INDEX idx_jobs_created_at ON jobs (created_at DESC);")
    mysql_cur.execute("CREATE INDEX idx_jobs_is_featured ON jobs (is_featured);")
    mysql_cur.execute("CREATE INDEX idx_jobs_is_active ON jobs (is_active);")
    mysql_cur.execute("CREATE INDEX idx_jobs_category ON jobs (category);")
    # Índice Fulltext para búsquedas de texto
    mysql_cur.execute("CREATE FULLTEXT INDEX idx_jobs_search ON jobs (title, company, location);")
    print("✅ Índices optimizados creados.")
except Exception as e:
    print(f"⚠️ Nota de Índices: {e} (quizás ya existían)")

pg_conn.close()
mysql_conn.close()

print("\n🎉 ¡MIGRACIÓN COMPLETADA CON ÉXITO!")
print("Todos los datos han sido copiados de Supabase a Raiola MySQL de forma limpia.")
