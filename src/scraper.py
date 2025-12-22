import requests
from bs4 import BeautifulSoup
from supabase import create_client
import os

# Leemos los secretos que ya tienes
url_raw = os.environ.get("DATABASE_URL", "")
key_supabase = os.environ.get("SUPABASE_KEY", "")

# LIMPIEZA DE URL: Si es una URL de PostgreSQL, intentamos avisar.
# Supabase API URL debe ser: https://xyz.supabase.co
if url_raw.startswith("postgresql://"):
    print("ERROR: El secreto DATABASE_URL contiene una ruta de base de datos (PostgreSQL),")
    print("pero el Scraper necesita la API URL (https://...).")
    print("Copia la 'Project URL' desde Settings -> API en Supabase.")
    exit(1)

if not url_raw.startswith("http"):
    print(f"ERROR: La URL proporcionada no es válida: {url_raw[:10]}...")
    exit(1)

supabase = create_client(url_raw, key_supabase)

def scrape_tecnoempleo():
    print("Iniciando scraping...")
    url = "https://www.tecnoempleo.com/ofertas-trabajo/"
    try:
        response = requests.get(url, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        ofertas = soup.find_all('div', class_='p-2')
        
        for oferta in ofertas:
            try:
                titulo = oferta.find('h3').text.strip()
                empresa = oferta.find('div', class_='text-primary').text.strip()
                link = oferta.find('a')['href']
                
                data = {
                    "title": titulo,
                    "company": empresa,
                    "url_source": link,
                    "location": "España",
                    "description_snippet": "Oferta de TecnoEmpleo"
                }
                supabase.table("jobs").upsert(data).execute()
                print(f"Guardada: {titulo}")
            except Exception:
                continue
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    scrape_tecnoempleo()
