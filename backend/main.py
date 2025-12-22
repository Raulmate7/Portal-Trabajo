import os
import psycopg2
from dotenv import load_dotenv

# --- IMPORTAMOS LOS ROBOTS ---
from scrapers.wwr import get_wwr_jobs
from scrapers.remotive import get_remotive_jobs
from scrapers.jobfluent import get_jobfluent_jobs
from scrapers.remoteok import get_remoteok_jobs
from scrapers.workingnomads import get_workingnomads_jobs # <--- NUEVO

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")

def save_jobs(jobs, source_name):
    if not jobs:
        return
    
    conn = psycopg2.connect(DB_URL)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM sectors WHERE slug = 'informatica-tecnologia'")
    result = cursor.fetchone()
    if not result:
        return
    sector_id = result[0]

    new_count = 0
    for job in jobs:
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
    print("🚀 Iniciando Scrapers (Pack Completo)...")
    
    # --- ESPAÑA & EUROPA ---
    print("\n--- Ejecutando JobFluent (ES) ---")
    save_jobs(get_jobfluent_jobs(), "JobFluent")

    print("\n--- Ejecutando RemoteOK (ES) ---")
    save_jobs(get_remoteok_jobs(), "RemoteOK")
    
    print("\n--- Ejecutando WorkingNomads (EU/ES) ---")
    save_jobs(get_workingnomads_jobs(), "WorkingNomads")
    
    # --- GLOBAL ---
    print("\n--- Ejecutando WeWorkRemotely ---")
    save_jobs(get_wwr_jobs(), "WeWorkRemotely")
    
    print("\n--- Ejecutando Remotive API ---")
    save_jobs(get_remotive_jobs(), "Remotive")
    
    print("\n✅ Todo terminado con éxito.")

if __name__ == "__main__":
    main()
