import os
import psycopg2
from dotenv import load_dotenv
# Importamos los dos que SI funcionan
from scrapers.wwr import get_wwr_jobs
from scrapers.remotive import get_remotive_jobs

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")

def save_jobs(jobs, source_name):
    if not jobs:
        return
    
    conn = psycopg2.connect(DB_URL)
    cursor = conn.cursor()
    
    # Buscamos el ID del sector
    cursor.execute("SELECT id FROM sectors WHERE slug = 'informatica-tecnologia'")
    result = cursor.fetchone()
    if not result:
        print("⚠️ Error: Sector no encontrado.")
        return
    sector_id = result[0]

    new_count = 0
    for job in jobs:
        # Evitar duplicados
        cursor.execute("SELECT id FROM jobs WHERE url_source = %s", (job['link'],))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO jobs (title, company, location, salary, description_snippet, url_source, sector_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                job['title'], 
                job['company'], 
                job['location'], 
                job['salary'], 
                job['description'], 
                job['link'],
                sector_id
            ))
            new_count += 1
    
    conn.commit()
    cursor.close()
    conn.close()
    print(f"💾 Guardadas {new_count} nuevas ofertas de {source_name}")

def main():
    print("🚀 Iniciando Scrapers (Fuentes Oficiales)...")
    
    # 1. WeWorkRemotely
    print("\n--- Ejecutando WeWorkRemotely ---")
    wwr_jobs = get_wwr_jobs()
    save_jobs(wwr_jobs, "WeWorkRemotely")
    
    # 2. Remotive (API)
    print("\n--- Ejecutando Remotive API ---")
    remotive_jobs = get_remotive_jobs()
    save_jobs(remotive_jobs, "Remotive")
    
    print("\n✅ Todo terminado con éxito.")

if __name__ == "__main__":
    main()
