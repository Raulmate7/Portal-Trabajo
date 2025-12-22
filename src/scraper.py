import requests
from bs4 import BeautifulSoup
from supabase import create_client
import os

# Usamos la variable que ya tienes en GitHub
url_supabase = os.environ.get("DATABASE_URL")
# Como solo tienes una URL, usaremos la misma para la KEY o una vacía 
# (Nota: Supabase suele requerir ambas, si falla, necesitaremos añadir la KEY luego)
key_supabase = os.environ.get("SUPABASE_KEY", "") 

if not url_supabase:
    print("Error: DATABASE_URL no encontrada")
    exit(1)

supabase = create_client(url_supabase, key_supabase)

def scrape_tecnoempleo():
    print("Iniciando scraping con DATABASE_URL...")
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
