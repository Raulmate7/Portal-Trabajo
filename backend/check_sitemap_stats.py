import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

try:
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()
    
    # 1. Cantidad de ofertas activas
    cur.execute("SELECT COUNT(*) FROM jobs WHERE is_active = TRUE")
    count_active = cur.fetchone()[0]
    print(f"Número de ofertas activas: {count_active}")
    
    # 2. Cantidad de ofertas destacadas activas
    cur.execute("SELECT COUNT(*) FROM jobs WHERE is_active = TRUE AND is_featured = TRUE")
    count_featured = cur.fetchone()[0]
    print(f"Número de ofertas destacadas activas: {count_featured}")

    # 3. Tamaño promedio de description_snippet
    cur.execute("SELECT AVG(LENGTH(description_snippet)) FROM jobs WHERE is_active = TRUE AND description_snippet IS NOT NULL")
    avg_len = cur.fetchone()[0]
    print(f"Longitud promedio de description_snippet: {avg_len}")
    
    conn.close()
except Exception as e:
    print(f"Error: {e}")
