import os
import requests
import psycopg2
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from logic.classifier import classify_job
from logic.salary_parser import parse_salary


load_dotenv()

# NOTA: Este archivo se llama scraper_infoempleo.py por razones históricas,
# pero actualmente scrapea el feed RSS de Stratos (stratos-ad.com).
# Si se quiere añadir Infoempleo real, crear un archivo separado.
URL_RSS = "https://www.stratos-ad.com/monitor/rss"

def scrape_stratos():
    print("🇪🇸 Iniciando robot Stratos HTML Scraper (scraper_infoempleo.py)...")
    
    url = "https://www.stratos-ad.com/trabajo"
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        response = requests.get(url, headers=headers, timeout=15)
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

