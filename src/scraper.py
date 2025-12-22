import requests
from bs4 import BeautifulSoup
from supabase import create_client
import os

# --- CONFIGURACIÓN ---
url_supabase = os.environ.get("SUPABASE_URL")
key_supabase = os.environ.get("SUPABASE_KEY")

if not url_supabase or not url_supabase.startswith("http"):
    print("Error: SUPABASE_URL no configurada correctamente")
    exit(1)

supabase = create_client(url_supabase, key_supabase)

# --- INTELIGENCIA DE CATEGORÍAS ---
def detectar_categoria(titulo):
    t = titulo.lower()
    if any(k in t for k in ['frontend', 'react', 'angular', 'vue', 'javascript', 'js', 'html', 'css', 'ux', 'ui']): return 'Frontend'
    if any(k in t for k in ['backend', 'java', 'php', 'python', 'node', 'c#', '.net', 'ruby', 'go', 'spring', 'django', 'api']): return 'Backend'
    if any(k in t for k in ['data', 'sql', 'mysql', 'postgres', 'bi', 'machine', 'ia', 'ai ', 'analista']): return 'Data & AI'
    if any(k in t for k in ['cloud', 'aws', 'azure', 'devops', 'docker', 'linux', 'sysadmin', 'cyber', 'seguridad']): return 'Cloud & DevOps'
    if any(k in t for k in ['mobile', 'android', 'ios', 'flutter', 'app']): return 'Mobile'
    return 'Otros'

def scrape_tecnoempleo():
    print("Iniciando scraping con 'disfraz' de navegador...")
    target_url = "https://www.tecnoempleo.com/ofertas-trabajo/"
    
    # ESTA ES LA CLAVE: Simulamos ser un navegador real
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
    }

    try:
        response = requests.get(target_url, headers=headers, timeout=10)
        print(f"Estado de la conexión: {response.status_code}") # 200 es Éxito, 403 es Bloqueo

        if response.status_code != 200:
            print("ERROR: La web nos ha bloqueado o no responde.")
            return

        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Buscamos las tarjetas de empleo
        # Nota: La clase 'p-2' es muy genérica, añadimos border-bottom para asegurar
        ofertas = soup.find_all('div', class_='p-2')
        
        print(f"Ofertas encontradas en la página: {len(ofertas)}")
        
        count = 0
        for oferta in ofertas:
            try:
                h3 = oferta.find('h3')
                if not h3: continue
                
                titulo = h3.text.strip()
                link = oferta.find('a')['href']
                
                # Gestión segura de la empresa
                empresa_div = oferta.find('div', class_='text-primary')
                empresa = empresa_div.text.strip() if empresa_div else "Empresa Confidencial"

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
                
        print(f"Resumen Final: {count} ofertas procesadas correctamente.")
        
    except Exception as e:
        print(f"Error Crítico: {e}")

if __name__ == "__main__":
    scrape_tecnoempleo()
