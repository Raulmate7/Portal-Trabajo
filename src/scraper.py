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

# --- CATEGORIZACIÓN ---
def detectar_categoria(titulo):
    t = titulo.lower()
    if any(k in t for k in ['frontend', 'react', 'angular', 'vue', 'javascript', 'js', 'html', 'css']): return 'Frontend'
    if any(k in t for k in ['backend', 'java', 'php', 'python', 'node', 'c#', '.net', 'ruby', 'go', 'spring', 'api']): return 'Backend'
    if any(k in t for k in ['data', 'sql', 'mysql', 'postgres', 'bi', 'machine', 'ia', 'ai ', 'analista']): return 'Data & AI'
    if any(k in t for k in ['cloud', 'aws', 'azure', 'devops', 'docker', 'linux', 'sysadmin', 'seguridad']): return 'Cloud & DevOps'
    if any(k in t for k in ['mobile', 'android', 'ios', 'flutter', 'app']): return 'Mobile'
    return 'Otros'

def scrape_tecnoempleo():
    print("Iniciando scraping por Títulos...")
    target_url = "https://www.tecnoempleo.com/ofertas-trabajo/"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    }

    try:
        response = requests.get(target_url, headers=headers, timeout=15)
        if response.status_code != 200:
            print(f"Bloqueo o Error: {response.status_code}")
            return

        soup = BeautifulSoup(response.text, 'html.parser')
        
        # ESTRATEGIA NUEVA: Buscamos todos los H3 (Títulos) que tengan enlace dentro
        # Esta estrategia falla mucho menos porque los títulos siempre son H3 o H2.
        titulos_encontrados = soup.find_all('h3')
        
        print(f"Posibles títulos encontrados: {len(titulos_encontrados)}")
        
        count = 0
        for h3 in titulos_encontrados:
            try:
                # Buscamos el enlace dentro del h3
                enlace_tag = h3.find('a')
                if not enlace_tag:
                    continue # Si no tiene enlace, no es una oferta
                
                titulo = enlace_tag.text.strip()
                link = enlace_tag['href']
                
                # Para la empresa, miramos el contenedor padre o hermanos
                # En TecnoEmpleo suele estar cerca. Si falla, ponemos "Ver oferta"
                # Intentamos buscar un div con clase text-primary cerca
                padre = h3.find_parent('div')
                empresa_tag = padre.find('div', class_='text-primary') if padre else None
                empresa = empresa_tag.text.strip() if empresa_tag else "Consultar en Web"

                categoria = detectar_categoria(titulo)
                
                data = {
                    "title": titulo,
                    "company": empresa,
                    "url_source": link,
                    "location": "España",
                    "description_snippet": "Ver detalles en TecnoEmpleo",
                    "category": categoria 
                }
                
                # Insertamos en Supabase
                supabase.table("jobs").upsert(data).execute()
                count += 1
                print(f"[{categoria}] Guardada: {titulo}")
                
            except Exception as e:
                # print(f"Saltando elemento no válido: {e}")
                continue
                
        print(f"Resumen Final: {count} ofertas guardadas.")
        
    except Exception as e:
        print(f"Error Crítico: {e}")

if __name__ == "__main__":
    scrape_tecnoempleo()
