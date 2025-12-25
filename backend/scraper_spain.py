import os
import cloudscraper
import psycopg2
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()

URL_OBJETIVO = "https://www.tecnoempleo.com/ofertas-trabajo/"

def scrape_tecnoempleo():
    print("🇪🇸 Iniciando robot Tecnoempleo (Ajustado a tus columnas)...")
    
    scraper = cloudscraper.create_scraper()
    
    try:
        response = scraper.get(URL_OBJETIVO)
        if response.status_code != 200:
            print(f"❌ Error Tecnoempleo: Status {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Error descargando: {e}")
        return

    soup = BeautifulSoup(response.text, 'html.parser')
    
    enlaces = soup.find_all('a', href=True)
    nuevas_ofertas = []

    for link in enlaces:
        try:
            url_oferta = link['href']
            
            # Filtros básicos
            if '/ofertas/' not in url_oferta or 'tecnologia' in url_oferta:
                if not any(char.isdigit() for char in url_oferta):
                    continue

            if not url_oferta.startswith('http'):
                url_oferta = f"https://www.tecnoempleo.com{url_oferta}"

            title = link.get_text(strip=True)
            if len(title) < 10:
                h3 = link.find('h3')
                title = h3.get_text(strip=True) if h3 else title

            if len(title) < 5: continue

            nuevas_ofertas.append({
                "title": title,
                "company": "Tecnoempleo",
                "location": "España",
                "url_source": url_oferta, # NOMBRE CORRECTO
                "salary": "Consultar"
            })

        except Exception:
            continue

    # Limpieza duplicados
    ofertas_unicas = {v['url_source']: v for v in nuevas_ofertas}.values()
    print(f"🔍 Tecnoempleo: Encontradas {len(ofertas_unicas)} ofertas.")
    guardar_en_bd(list(ofertas_unicas))

def guardar_en_bd(ofertas):
    if not ofertas:
        return
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
        c = 0
        for o in ofertas:
            # 1. VERIFICAR DUPLICADOS (Usando url_source)
            cur.execute("SELECT id FROM jobs WHERE url_source = %s", (o['url_source'],))
            if cur.fetchone(): continue
            
            # 2. INSERTAR (Usando las columnas que SÍ existen)
            # Metemos el origen en description_snippet porque no hay columna source
            desc = f"[Fuente: Tecnoempleo] {o['title']}"
            
            cur.execute("""
                INSERT INTO jobs (title, company, location, salary, description_snippet, url_source, created_at) 
                VALUES (%s, %s, %s, %s, %s, %s, NOW())
            """, (
                o['title'], 
                o['company'], 
                o['location'], 
                o['salary'], 
                desc, 
                o['url_source']
            ))
            c += 1
        conn.commit()
        conn.close()
        print(f"✅ Tecnoempleo: Guardadas {c} nuevas ofertas.")
    except Exception as e:
        print(f"❌ Error BD: {e}")

if __name__ == "__main__":
    scrape_tecnoempleo()
