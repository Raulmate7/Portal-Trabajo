import os
import requests
import psycopg2
import xml.etree.ElementTree as ET
from dotenv import load_dotenv

load_dotenv()

URL_RSS = "https://www.stratos-ad.com/monitor/rss"

def scrape_stratos():
    print("🇪🇸 Iniciando robot Stratos (Ajustado a tus columnas)...")
    
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        response = requests.get(URL_RSS, headers=headers, timeout=10)
        if response.status_code != 200: return
    except: return

    try:
        root = ET.fromstring(response.content)
        items = root.findall('.//item')
    except: return
    
    nuevas_ofertas = []

    for item in items:
        try:
            title = item.find('title').text
            link = item.find('link').text
            if not title or not link: continue

            nuevas_ofertas.append({
                "title": title,
                "company": "Stratos",
                "location": "España",
                "url_source": link, # NOMBRE CORRECTO
                "salary": "Consultar"
            })
        except: continue

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
        print(f"✅ Stratos: Guardadas {c} nuevas.")
    except Exception as e:
        print(f"❌ Error BD: {e}")

if __name__ == "__main__":
    scrape_stratos()
