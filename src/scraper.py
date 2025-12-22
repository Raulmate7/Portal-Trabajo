import requests
from bs4 import BeautifulSoup
from supabase import create_client
import os

url_supabase = os.environ.get("SUPABASE_URL")
key_supabase = os.environ.get("SUPABASE_KEY")

if not url_supabase or not url_supabase.startswith("http"):
    print("Error: SUPABASE_URL no configurada correctamente")
    exit(1)

supabase = create_client(url_supabase, key_supabase)

def scrape_tecnoempleo():
    print("Iniciando scraping con la API URL...")
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
