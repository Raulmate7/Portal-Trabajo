import requests
from bs4 import BeautifulSoup
from supabase import create_client
import os

# Configuración de conexión (Mantenemos lo que ya funcionaba)
url_supabase = os.environ.get("SUPABASE_URL")
key_supabase = os.environ.get("SUPABASE_KEY")

if not url_supabase or not url_supabase.startswith("http"):
    print("Error: SUPABASE_URL no configurada correctamente")
    exit(1)

supabase = create_client(url_supabase, key_supabase)

# --- CEREBRO DE CATEGORIZACIÓN ---
def detectar_categoria(titulo):
    t = titulo.lower()
    
    # Palabras clave para Frontend
    if any(k in t for k in ['frontend', 'react', 'angular', 'vue', 'javascript', 'html', 'css', 'ux/ui']):
        return 'Frontend'
    
    # Palabras clave para Backend
    if any(k in t for k in ['backend', 'java', 'php', 'python', 'node', 'c#', '.net', 'ruby', 'go', 'spring']):
        return 'Backend'
    
    # Palabras clave para Datos/IA
    if any(k in t for k in ['data', 'analyst', 'sql', 'big data', 'machine learning', 'ia', 'inteligencia', 'power bi']):
        return 'Data & AI'
    
    # Palabras clave para Cloud/Sistemas
    if any(k in t for k in ['cloud', 'devops', 'aws', 'azure', 'docker', 'kubernetes', 'linux', 'sysadmin']):
        return 'Cloud & DevOps'
        
    return 'Otros' # Si no encuentra nada

def scrape_tecnoempleo():
    print("Iniciando scraping inteligente...")
    url = "https://www.tecnoempleo.com/ofertas-trabajo/"
    try:
        response = requests.get(url, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        ofertas = soup.find_all('div', class_='p-2')
        
        count = 0
        for oferta in ofertas:
            try:
                titulo = oferta.find('h3').text.strip()
                empresa = oferta.find('div', class_='text-primary').text.strip()
                link = oferta.find('a')['href']
                
                # Aquí aplicamos la inteligencia
                categoria = detectar_categoria(titulo)
                
                data = {
                    "title": titulo,
                    "company": empresa,
                    "url_source": link,
                    "location": "España",
                    "description_snippet": "Oferta de TecnoEmpleo",
                    "category": categoria 
                }
                
                supabase.table("jobs").upsert(data).execute()
                count += 1
                print(f"[{categoria}] Guardada: {titulo}")
                
            except Exception:
                continue
        print(f"Resumen: {count} ofertas procesadas.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    scrape_tecnoempleo()
