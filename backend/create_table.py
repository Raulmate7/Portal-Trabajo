import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
db_url = os.environ.get('DATABASE_URL')
if not db_url:
    # Try reading from frontend/.env.local
    load_dotenv('../frontend/.env.local')
    db_url = os.environ.get('DATABASE_URL')

if not db_url:
    print("No DATABASE_URL found.")
    exit(1)

conn = psycopg2.connect(db_url)
cur = conn.cursor()

query = """
CREATE TABLE IF NOT EXISTS premium_leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    stack VARCHAR(255) NOT NULL,
    experience VARCHAR(50) NOT NULL,
    linkedin VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""
cur.execute(query)
conn.commit()
cur.close()
conn.close()
print("Tabla premium_leads creada exitosamente.")
