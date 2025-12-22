import requests
from bs4 import BeautifulSoup
from supabase import create_client
import os

# Cambiado para usar EXACTAMENTE lo que tienes en GitHub Secrets
url_supabase = os.environ.get("DATABASE_URL")
key_supabase = os.environ.get("SUPABASE_KEY")

if not url_supabase:
    print("Error: No se encuentra DATABASE_URL en los secretos")
    exit(1)

# Si no tienes la KEY, el cliente fallará, pero intentaremos conectar
supabase = create_client(url_supabase, key_supabase if key_supabase else "")

def scrape_tecnoempleo():
    print(f"Conectando a: {url_supabase[:20]}...")
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
            except Exception as e:
                continue
    except Exception as e:
        print(f"Error en el proceso: {e}")

if __name__ == "__main__":
    scrape_tecnoempleo()
