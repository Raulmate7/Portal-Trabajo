import os
import psycopg2
from dotenv import load_dotenv

# --- IMPORTAMOS LOS SCRAPERS ---
from scrapers.wwr import get_wwr_jobs
from scrapers.remotive import get_remotive_jobs
from scrapers.jobfluent import get_jobfluent_jobs
from scrapers.remoteok import get_remoteok_jobs
from scrapers.workingnomads import get_workingnomads_jobs

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")


def save_jobs(jobs, source_name):
    """
    Guarda la lista de ofertas en la base de datos.
    Todos los scrapers devuelven dicts con las claves:
      url_source, title, company, location, salary, description_snippet
    """
    if not jobs:
        print(f"⚠️  {source_name}: no devolvió ofertas.")
        return

    try:
        conn = psycopg2.connect(DB_URL)
        cursor = conn.cursor()
    except Exception as e:
        print(f"❌ Error conectando a la BD al procesar {source_name}: {e}")
        return

    # Fix #8: Si el sector no existe, guardamos igual con sector_id = NULL
    # en vez de abortar el proceso completo.
    cursor.execute("SELECT id FROM sectors WHERE slug = 'informatica-tecnologia'")
    result = cursor.fetchone()
    if result:
        sector_id = result[0]
    else:
        print(f"⚠️  Sector 'informatica-tecnologia' no encontrado en BD. Se guardará sin sector.")
        sector_id = None

    new_count = 0
    for job in jobs:
        # Fix #3: ahora todos los scrapers usan 'url_source' como clave
        url_source = job.get('url_source', '')
        if not url_source:
            continue  # Oferta sin URL, no la guardamos

        # Verificar duplicado
        cursor.execute("SELECT id FROM jobs WHERE url_source = %s", (url_source,))
        if cursor.fetchone():
            continue

        cursor.execute("""
            INSERT INTO jobs (title, company, location, salary, description_snippet, url_source, sector_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            job.get('title', 'Sin título'),
            job.get('company', 'Desconocida'),
            job.get('location', 'Remoto'),
            job.get('salary', 'Consultar'),
            job.get('description_snippet', ''),
            url_source,
            sector_id,
        ))
        new_count += 1

    conn.commit()
    cursor.close()
    conn.close()
    print(f"💾 Guardadas {new_count} nuevas ofertas de {source_name}")


def main():
    print("🚀 Iniciando Scrapers (Pack Completo — Internacional y España)...")

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
