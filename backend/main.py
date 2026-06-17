import os
import psycopg2
from dotenv import load_dotenv

# --- IMPORTAMOS LOS SCRAPERS ---
from scrapers.wwr import get_wwr_jobs
from scrapers.remotive import get_remotive_jobs
from scrapers.jobfluent import get_jobfluent_jobs
from scrapers.remoteok import get_remoteok_jobs
from scrapers.workingnomads import get_workingnomads_jobs
from scrapers.himalayas import get_himalayas_jobs
from scrapers.pythonorg import get_pythonorg_jobs
from logic.classifier import classify_job
from logic.translator import translate_text
from logic.salary_parser import parse_salary, extract_salary_from_text


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

        # Verificar duplicado por URL
        cursor.execute("SELECT id FROM jobs WHERE url_source = %s", (url_source,))
        if cursor.fetchone():
            continue

        # Evitar duplicidad semántica (mismo título y empresa conocida en las últimas 48 horas)
        title = job.get('title', 'Sin título')
        company = job.get('company', 'Desconocida')
        if company != 'Desconocida':
            cursor.execute("""
                SELECT id FROM jobs 
                WHERE title = %s AND company = %s AND created_at > NOW() - INTERVAL '7 days'
            """, (title, company))
            if cursor.fetchone():
                continue

        desc_snippet = job.get('description_snippet', '')
        
        # Paso 24: Filtro de Relevancia Geográfica Internacional
        is_intl = source_name.lower() in ['weworkremotely', 'remotive', 'himalayas', 'python.org', 'workingnomads', 'remoteok']
        if is_intl:
            desc_lower = (desc_snippet or "").lower()
            title_lower = (title or "").lower()
            lockout_phrases = [
                "us only", "us-only", "us resident", "u.s. resident", "united states resident", 
                "must be authorized to work in the us", "must be authorized to work in the u.s.",
                "authorized to work in the us", "authorized to work in the u.s.", 
                "legal authorization to work in the us", "legal authorization to work in the u.s.",
                "eligible to work in the us", "eligible to work in the u.s.",
                "us citizen", "citizenship: us", "north america only", "canada only", 
                "us/canada only", "us / canada only", "authorized to work in the united states"
            ]
            
            has_lockout = False
            for phrase in lockout_phrases:
                if phrase in desc_lower or phrase in title_lower:
                    has_lockout = True
                    break
                    
            if has_lockout:
                print(f"🚫 Oferta descartada por exclusión geográfica internacional: '{title}' de '{company}' ({source_name})")
                continue

        category = classify_job(title, desc_snippet)

        # Traducir si es un scraper internacional
        title_es = None
        desc_es = None
        if is_intl:
            title_es = translate_text(title)
            desc_es = translate_text(desc_snippet)
            if title_es == title:
                title_es = None
            if desc_es == desc_snippet:
                desc_es = None

        # Parsear salarios
        salary_raw = job.get('salary', 'Consultar')
        if not salary_raw or salary_raw.strip() == '' or salary_raw.lower() in ['consultar', 'sin especificar']:
            salary_raw = 'Consultar'
            
        s_min, s_max, s_curr = parse_salary(salary_raw)

        # Paso 21: Inferencia de salario si es 'Consultar' y hay datos en el snippet
        if (s_min is None and s_max is None) and desc_snippet:
            s_min_ext, s_max_ext, s_curr_ext, raw_ext = extract_salary_from_text(desc_snippet)
            if s_min_ext is not None or s_max_ext is not None:
                s_min, s_max, s_curr = s_min_ext, s_max_ext, s_curr_ext
                salary_raw = f"{raw_ext} (estimado)"

        cursor.execute("""
            INSERT INTO jobs (title, company, location, salary, description_snippet, url_source, sector_id, category, title_es, description_snippet_es, salary_min, salary_max, salary_currency, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE)
        """, (
            title,
            job.get('company', 'Desconocida'),
            job.get('location', 'Remoto'),
            salary_raw,
            desc_snippet,
            url_source,
            sector_id,
            category,
            title_es,
            desc_es,
            s_min,
            s_max,
            s_curr,
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

    print("\n--- Ejecutando Himalayas API ---")
    save_jobs(get_himalayas_jobs(), "Himalayas")

    print("\n--- Ejecutando Python.org RSS ---")
    save_jobs(get_pythonorg_jobs(), "Python.org")

    print("\n✅ Todo terminado con éxito.")


if __name__ == "__main__":
    main()
