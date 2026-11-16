import os
import re
import urllib.parse
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
from logic.dedup import compute_dedup_hash, token_jaccard_similarity
from logic.job_identity import new_job_id, infer_work_mode
from logic.translator import translate_text
from logic.salary_parser import parse_salary, extract_salary_from_text


load_dotenv()

DB_URL = os.getenv("DATABASE_URL")


from logic.ssrf import is_safe_public_url


def is_safe_scraper_url(url: str) -> bool:
    """Valida que la URL de origen de la oferta sea un destino público legítimo con verificación DNS (SEC-044)."""
    return is_safe_public_url(url, resolve_dns=True)


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
        url_source = str(job.get('url_source', '')).strip()
        if not url_source or not is_safe_scraper_url(url_source):
            continue  # Oferta sin URL válida o insegura, se descarta

        # Verificar duplicado por URL
        cursor.execute("SELECT id FROM jobs WHERE url_source = %s", (url_source,))
        if cursor.fetchone():
            continue

        # Evitar duplicidad semántica (mismo título y empresa conocida en las últimas 48 horas)
        title = str(job.get('title', 'Sin título')).strip()[:250]
        company = str(job.get('company', 'Desconocida')).strip()[:250]
        location = str(job.get('location', 'Remoto')).strip()[:250]
        # Deduplicación multi-fuente por dedup_hash canónico (FUNC-019).
        # BUG-001: la modalidad se infiere antes del hash para no colapsar ofertas remoto/presencial.
        work_mode = infer_work_mode(title, location, job.get('description_snippet', ''))
        dedup_hash = compute_dedup_hash(company, title, work_mode or '')
        if company != 'Desconocida':
            try:
                cursor.execute("""
                    SELECT id FROM jobs 
                    WHERE (dedup_hash = %s OR (title = %s AND company = %s))
                      AND created_at > NOW() - INTERVAL '14 days'
                """, (dedup_hash, title, company))
            except Exception:
                conn.rollback()
                cursor.execute("""
                    SELECT id FROM jobs 
                    WHERE title = %s AND company = %s AND created_at > NOW() - INTERVAL '7 days'
                """, (title, company))
            if cursor.fetchone():
                continue
            # Segunda etapa difusa (FUNC-025): comparar similitud Jaccard contra vacantes recientes de la misma empresa
            try:
                cursor.execute("""
                    SELECT title FROM jobs
                    WHERE company = %s AND work_mode = %s AND created_at > NOW() - INTERVAL '14 days'
                    LIMIT 10
                """, (company, work_mode or ''))
                if any(token_jaccard_similarity(title, row[0]) >= 0.85 for row in cursor.fetchall()):
                    continue
            except Exception:
                pass

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

        # Traducir si es un scraper internacional (desacoplable con SKIP_SYNC_TRANSLATION=true, FUNC-043)
        title_es = None
        desc_es = None
        if is_intl and os.getenv("SKIP_SYNC_TRANSLATION", "false").lower() != "true":
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
            INSERT INTO jobs (id, title, company, location, salary, description_snippet, url_source, sector_id, category, title_es, description_snippet_es, salary_min, salary_max, salary_currency, dedup_hash, work_mode, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE)
        """, (
            new_job_id(),
            title,
            company,
            location,
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
            dedup_hash,
            work_mode,
        ))
        new_count += 1

    conn.commit()
    cursor.close()
    conn.close()
    print(f"💾 Guardadas {new_count} nuevas ofertas de {source_name}")


def main():
    from concurrent.futures import ThreadPoolExecutor, as_completed
    print("🚀 Iniciando Scrapers en paralelo (Pack Completo — Internacional y España)...")

    scrapers = [
        ("JobFluent", get_jobfluent_jobs),
        ("RemoteOK", get_remoteok_jobs),
        ("WorkingNomads", get_workingnomads_jobs),
        ("WeWorkRemotely", get_wwr_jobs),
        ("Remotive", get_remotive_jobs),
        ("Himalayas", get_himalayas_jobs),
        ("Python.org", get_pythonorg_jobs),
    ]

    results = {}
    with ThreadPoolExecutor(max_workers=4) as executor:
        future_map = {executor.submit(fn): name for name, fn in scrapers}
        for future in as_completed(future_map):
            name = future_map[future]
            try:
                results[name] = future.result() or []
                print(f"📡 {name}: {len(results[name])} ofertas obtenidas.")
            except Exception as exc:
                print(f"❌ Error ejecutando scraper {name}: {exc}")
                results[name] = []

    for name, _ in scrapers:
        print(f"\n--- Guardando {name} ---")
        save_jobs(results.get(name, []), name)

    print("\n✅ Todo terminado con éxito.")


if __name__ == "__main__":
    main()
