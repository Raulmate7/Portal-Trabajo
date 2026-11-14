import os
import requests
import psycopg2
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from logic.classifier import classify_job
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
    if not ofertas: return

    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
        c = 0
        
        for o in ofertas:
            # 1. VERIFICAR DUPLICADOS (url_source)
            cur.execute("SELECT id FROM jobs WHERE url_source = %s", (o['url_source'],))
            if cur.fetchone(): continue
            
            # 2. INSERTAR (Columnas reales)
            desc = f"[Fuente: Stratos] {o['title']}"
            category = classify_job(o['title'], desc)
            
            s_min, s_max, s_curr = parse_salary(o['salary'])
            
            cur.execute("""
                INSERT INTO jobs (title, company, location, salary, description_snippet, url_source, category, created_at, salary_min, salary_max, salary_currency, is_active) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), %s, %s, %s, TRUE)
            """, (
                o['title'], 
                o['company'], 
                o['location'], 
                o['salary'], 
                desc, 
                o['url_source'],
                category,
                s_min,
                s_max,
                s_curr
            ))
            c += 1
        conn.commit()
        conn.close()
        print(f"✅ Stratos: Guardadas {c} nuevas.")
    except Exception as e:
        print(f"❌ Error BD: {e}")

if __name__ == "__main__":
    scrape_stratos()

