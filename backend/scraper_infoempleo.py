import os
import requests
import psycopg2
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from logic.classifier import classify_job
from logic.dedup import compute_dedup_hash
from logic.job_identity import new_job_id, infer_work_mode
from logic.salary_parser import parse_salary, extract_salary_from_text
from logic.scraper_http import ScraperHttpClient
from logic.tdm import is_scraping_allowed, truncate_snippet


load_dotenv()

STRATOS_JOBS_URL = "https://www.stratos-ad.com/trabajo"

def scrape_stratos():
    print("🇪🇸 Iniciando robot Stratos HTML Scraper (scraper_infoempleo.py)...")
    
    url = STRATOS_JOBS_URL
    if not is_scraping_allowed(url):
        print("⛔ Stratos bloqueado por robots.txt o reserva TDM. Omitiendo.")
        return
    http_client = ScraperHttpClient("Stratos")
    try:
        response = http_client.get(url)
        if not is_scraping_allowed(url, response.headers):
            print("⛔ Stratos indica TDM-Reservation / X-Robots-Tag restrictivo. Omitiendo.")
            return
        if response.status_code != 200:
            print(f"❌ Error Stratos: Status {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Error de conexión con Stratos: {e}")
        return

    try:
        soup = BeautifulSoup(response.text, 'html.parser')
        rows = soup.find_all('tr')
    except Exception as e:
        print(f"❌ Error de parseo HTML de Stratos: {e}")
        return
    
    nuevas_ofertas = []

    for row in rows:
        try:
            tds = row.find_all('td')
            if len(tds) >= 4:
                a_link = tds[1].find('a', href=True)
                if a_link and '/trabajo?job=' in a_link['href']:
                    title = a_link.get_text(strip=True)
                    link = "https://www.stratos-ad.com" + a_link['href']
                    location = tds[2].get_text(strip=True)
                    company = tds[3].get_text(strip=True) or "Stratos"
                    
                    if not title or not link:
                        continue

                    nuevas_ofertas.append({
                        "title": title,
                        "company": company,
                        "location": location,
                        "url_source": link,
                        "salary": "Consultar"
                    })
        except Exception:
            continue

    print(f"🔍 Stratos: Encontradas {len(nuevas_ofertas)} ofertas.")
    if not nuevas_ofertas:
        print("⚠️ ALERTA FUNC-041: Stratos devolvió 0 ofertas; posible cambio en estructura HTML <tr>.")
        return
    guardar_en_bd(nuevas_ofertas)

def guardar_en_bd(ofertas):
    if not ofertas:
        return

    conn = None
    cur = None
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
        c = 0

        # BUG-007: una única consulta para conocer las URLs ya guardadas (evita N+1)
        urls = list({o['url_source'] for o in ofertas})
        existing = set()
        for k in range(0, len(urls), 200):
            chunk = urls[k:k + 200]
            placeholders = ",".join(["%s"] * len(chunk))
            cur.execute(f"SELECT url_source FROM jobs WHERE url_source IN ({placeholders})", tuple(chunk))
            existing.update(row[0] for row in cur.fetchall())

        for o in ofertas:
            if o['url_source'] in existing:
                continue

            desc = f"[Fuente: Stratos] {o['title']}"
            category = classify_job(o['title'], desc)
            s_min, s_max, s_curr = parse_salary(o['salary'])
            work_mode = infer_work_mode(o['title'], o['location'], desc)
            dedup_hash = compute_dedup_hash(o['company'], o['title'], work_mode or '')

            # BUG-007: id (PK sin DEFAULT), dedup_hash y work_mode explícitos
            cur.execute("""
                INSERT INTO jobs (id, title, company, location, salary, description_snippet, url_source, category, created_at, salary_min, salary_max, salary_currency, dedup_hash, work_mode, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), %s, %s, %s, %s, %s, TRUE)
            """, (
                new_job_id(),
                o['title'],
                o['company'],
                o['location'],
                o['salary'],
                desc,
                o['url_source'],
                category,
                s_min,
                s_max,
                s_curr,
                dedup_hash,
                work_mode,
            ))
            existing.add(o['url_source'])
            c += 1
        conn.commit()
        print(f"✅ Stratos: Guardadas {c} nuevas.")
    except Exception as e:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        print(f"❌ Error BD: {e}")
    finally:
        # BUG-007: cierre garantizado aunque falle a mitad del bucle
        if cur is not None:
            try:
                cur.close()
            except Exception:
                pass
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass

if __name__ == "__main__":
    scrape_stratos()

