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
    
    cards = soup.find_all('div', class_='row fs--15')
    nuevas_ofertas = []

    for card in cards:
        try:
            # 1. Título y Link
            h3 = card.find('h3')
            if not h3:
                continue
            a_title = h3.find('a')
            if not a_title:
                continue
            
            title = a_title.get_text(strip=True)
            # Limpiar badge 'Urgente' del título si existe
            if title.startswith('Urgente'):
                title = title.replace('Urgente', '', 1).strip()
            
            url_oferta = a_title['href']
            if not url_oferta.startswith('http'):
                url_oferta = f"https://www.tecnoempleo.com{url_oferta}"

            # 2. Compañía
            company = "Tecnoempleo Partner"
            a_company = card.find('a', class_='text-primary')
            if a_company:
                company = a_company.get_text(strip=True)

            # 3. Ubicación
            location = "España"
            b_loc = card.find('b')
            if b_loc:
                loc_text = b_loc.get_text(strip=True)
                sibling = b_loc.next_sibling
                if sibling and isinstance(sibling, str):
                    sibling_clean = sibling.strip()
                    if sibling_clean:
                        loc_text += f" {sibling_clean}"
                if " - " in loc_text:
                    loc_text = loc_text.split(" - ")[0].strip()
                location = loc_text

            # 4. Descripción snippet
            desc_div = card.find('span', class_='hidden-md-down')
            desc_text = ""
            if desc_div:
                desc_text = desc_div.get_text(strip=True)

            if len(title) < 5:
                continue

            nuevas_ofertas.append({
                "title": title,
                "company": company,
                "location": location,
                "url_source": url_oferta,
                "salary": "Consultar",
                "description_snippet": desc_text
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
            if cur.fetchone(): 
                continue
            
            # 2. INSERTAR
            # Metemos el origen en description_snippet porque no hay columna source
            snippet_raw = o.get('description_snippet') or o['title']
            desc = f"[Fuente: Tecnoempleo] {snippet_raw}"
            if len(desc) > 500:
                desc = desc[:497] + "..."
            
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
