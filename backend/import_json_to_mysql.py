import os
import sys
import json
import pymysql

# Cargar variables de entorno
from dotenv import load_dotenv
load_dotenv()

# Credenciales de MySQL
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_USER = os.getenv("MYSQL_USER", "ecosier2_UserPortal")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "&+{Tv*GbZw4~Ye2;")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "ecosier2_PortalEmpleo")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))

# Si estamos en localhost y las variables individuales de cPanel están definidas, las priorizamos
cpanel_user = os.getenv("MYSQL_USER")
cpanel_db = os.getenv("MYSQL_DATABASE")
if MYSQL_HOST == 'localhost' or MYSQL_HOST == '127.0.0.1':
    if cpanel_user: MYSQL_USER = cpanel_user
    if cpanel_db: MYSQL_DATABASE = cpanel_db
    if os.getenv("MYSQL_PASSWORD"): MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")

print("🔌 Conectando a Raiola (MySQL) para importación de datos...")
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
    sys.exit(1)

def format_mysql_datetime(val):
    if not val:
        return None
    if isinstance(val, str):
        # Reemplazar 'T' por espacio
        val = val.replace('T', ' ')
        # Quitar el offset de zona horaria si existe (ej: +00:00)
        if '+' in val:
            val = val.split('+')[0]
        elif '-' in val and len(val.split('-')) > 3:
            parts = val.rsplit('-', 1)
            if len(parts) == 2 and ' ' in parts[0]:
                val = parts[0]
        if val.endswith('Z'):
            val = val[:-1]
        # Quitar microsegundos para máxima compatibilidad
        if '.' in val:
            val = val.split('.')[0]
        return val
    return val

# Carpeta de origen
input_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "migration_data")

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
            id VARCHAR(36) PRIMARY KEY,
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
            id VARCHAR(36) PRIMARY KEY,
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
            id VARCHAR(36) PRIMARY KEY,
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

# Recrear tablas
print("\n🔨 Recreando tablas en MySQL...")
mysql_cur.execute("SET FOREIGN_KEY_CHECKS = 0;")
for table, ddl in DDL_TABLES.items():
    print(f"  - Recreando tabla '{table}'...")
    mysql_cur.execute(f"DROP TABLE IF EXISTS {table};")
    mysql_cur.execute(ddl)
mysql_cur.execute("SET FOREIGN_KEY_CHECKS = 1;")
print("✅ Creación de tablas e índices completada.")

TABLES = ['sectors', 'jobs', 'subscribers', 'alerts', 'sponsored_jobs', 'email_tracking', 'premium_leads']

for table in TABLES:
    filepath = os.path.join(input_dir, f"{table}.json")
    if not os.path.exists(filepath):
        print(f"⚠️ Archivo '{filepath}' no encontrado. Saltando tabla.")
        continue

    print(f"\n📦 Importando datos para la tabla '{table}'...")
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if not data:
        print(f"  - No hay datos en '{table}.json' para importar.")
        continue

    print(f"  - Cargados {len(data)} registros.")
    
    # Obtener nombres de las columnas desde el primer registro
    cols = list(data[0].keys())
    
    # Preparar sentencia de inserción
    placeholders = ", ".join(["%s"] * len(cols))
    cols_str = ", ".join(cols)
    insert_sql = f"INSERT INTO {table} ({cols_str}) VALUES ({placeholders})"
    
    batch_data = []
    for record in data:
        row_values = []
        for col in cols:
            val = record[col]
            
            # Conversiones especiales
            if col.endswith('_at'):
                val = format_mysql_datetime(val)
            elif table == 'sectors' and col == 'keywords':
                # Convertir array a JSON string
                val = json.dumps(val)
            elif table == 'jobs' and col in ['is_featured', 'is_active']:
                # Convertir booleano a entero para MySQL
                val = 1 if val else 0
            
            row_values.append(val)
        batch_data.append(tuple(row_values))

    # Inserción en lotes
    batch_size = 100
    for i in range(0, len(batch_data), batch_size):
        batch = batch_data[i:i + batch_size]
        mysql_cur.executemany(insert_sql, batch)

    print(f"  - ✅ Importados {len(batch_data)} registros en '{table}'.")

# Crear índices adicionales en MySQL
print("\n⚡ Añadiendo índices de optimización en MySQL...")
try:
    mysql_cur.execute("CREATE INDEX idx_jobs_created_at ON jobs (created_at DESC);")
    mysql_cur.execute("CREATE INDEX idx_jobs_is_featured ON jobs (is_featured);")
    mysql_cur.execute("CREATE INDEX idx_jobs_is_active ON jobs (is_active);")
    mysql_cur.execute("CREATE INDEX idx_jobs_category ON jobs (category);")
    mysql_cur.execute("CREATE FULLTEXT INDEX idx_jobs_search ON jobs (title, company, location);")
    print("✅ Índices optimizados creados.")
except Exception as e:
    print(f"⚠️ Nota de Índices: {e} (quizás ya existían)")

mysql_conn.close()
print("\n🎉 ¡IMPORTACIÓN COMPLETADA CON ÉXITO!")
print("Todos los datos de los JSON locales han sido cargados en tu base de datos de Raiola.")
