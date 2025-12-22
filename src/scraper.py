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

def detectar_categoria(titulo):
    t = titulo.lower()
    
    # FRONTEND
    if any(k in t for k in ['frontend', 'react', 'angular', 'vue', 'javascript', 'js', 'html', 'css', 'ux', 'ui', 'web', 'maquetador']):
        return 'Frontend'
    
    # BACKEND
    if any(k in t for k in ['backend', 'java', 'php', 'python', 'node', 'c#', '.net', 'ruby', 'go', 'spring', 'django', 'flask', 'api', 'laravel']):
        return 'Backend'
    
    # DATA & IA
    if any(k in t for k in ['data', 'sql', 'mysql', 'postgres', 'oracle', 'bi', 'tableau', 'machine', 'learning', 'ia', 'ai ', 'inteligencia', 'analista de datos']):
        return 'Data & AI'
    
    # CLOUD & SISTEMAS
    if any(k in t for k in ['cloud', 'aws', 'azure', 'google cloud', 'devops', 'docker', 'kubernetes', 'linux', 'sysadmin', 'sistemas', 'redes', 'seguridad', 'cyber', 'ciber']):
        return 'Cloud & DevOps'
        
    # MOBILE
    if any(k in t for k in ['mobile', 'android', 'ios', 'swift', 'kotlin', 'flutter', 'react native', 'app']):
        return 'Mobile'

    return 'Otros'

def scrape_tecnoempleo():
    print("Iniciando scraping (Modo Debug)...")
    url = "https://www.tecnoempleo.com/ofertas-trabajo/"
    try:
        response = requests.get(url, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        ofertas = soup.find_all('div', class_='p-2')
        
        count = 0
        for oferta in ofertas:
            try:
                # Búsqueda más robusta del título
                h3 = oferta.find('h3')
                if not h3: continue
                titulo = h3.text.strip()
                
                empresa_div = oferta.find('div', class_='text-primary')
                empresa = empresa_div.text.strip() if empresa_div else "Desconocida"
                
                link_tag = oferta.find('a')
                link = link_tag['href'] if link_tag else "#"
                
                # Clasificar
                categoria = detectar_categoria(titulo)
                
                # DEBUG: Imprimir qué detectamos para ver errores en los logs
                print(f"Procesando: '{titulo}' -> {categoria}")
                
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
                
            except Exception as e:
                print(f"Error en una oferta: {e}")
                continue
        print(f"Resumen: {count} ofertas procesadas.")
        
    except Exception as e:
        print(f"Error Global: {e}")

if __name__ == "__main__":
    scrape_tecnoempleo()
