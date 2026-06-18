import os
import pymysql
from dotenv import load_dotenv

# Load env variables from backend first, fallback to frontend .env.local
load_dotenv()
if not os.getenv("MYSQL_USER"):
    load_dotenv('../frontend/.env.local')

MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))

if not MYSQL_USER or not MYSQL_PASSWORD or not MYSQL_DATABASE:
    print("❌ Error: Missing MySQL credentials in environment variables.")
    exit(1)

print(f"🔌 Connecting to MySQL database '{MYSQL_DATABASE}' on {MYSQL_HOST}:{MYSQL_PORT}...")
try:
    conn = pymysql.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DATABASE,
        port=MYSQL_PORT,
        charset='utf8mb4',
        autocommit=True
    )
    cur = conn.cursor()
    print("✅ Connection established.")
except Exception as e:
    print(f"❌ Error connecting to MySQL: {e}")
    exit(1)

query = """
CREATE TABLE IF NOT EXISTS company_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_slug VARCHAR(255) NOT NULL,
    rating INT NOT NULL,
    review_text TEXT NOT NULL,
    role VARCHAR(255) DEFAULT 'Anónimo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_company_slug (company_slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

try:
    print("🔨 Creating table 'company_reviews'...")
    cur.execute(query)
    print("✅ Table 'company_reviews' created successfully.")
except Exception as e:
    print(f"❌ Error creating table: {e}")
finally:
    cur.close()
    conn.close()
