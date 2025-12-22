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
    print("Iniciando scraping (Versión Todoterreno)...")
    target_url = "https://www.tecnoempleo.com/ofertas-trabajo/"
    domain = "https://www.tecnoempleo.com" # Para arreglar enlaces relativos
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    }

    try:
        response = requests.get(target_url, headers=headers, timeout=15)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Buscamos los H3
        elementos = soup.find_all('h3')
        print(f"Elementos H3 encontrados: {len(elementos)}")
        
        count = 0
        errores = 0
        
        for index, elem in enumerate(elementos):
            try:
                # ESTRATEGIA 1: El enlace está DENTRO del h3
                link_tag = elem.find('a')
                
                # ESTRATEGIA 2: Si no está dentro, miramos si el H3 está DENTRO de un enlace
                if not link_tag:
                    link_tag = elem.find_parent('a')
                
                if not link_tag:
                    # Si falla, imprimimos el HTML del primero para ver qué estructura tiene
                    if errores < 1: 
                        print(f"DEBUG ESTRUCTURA: {elem}")
                    errores += 1
                    continue

                # Extracción de datos
                titulo = elem.text.strip()
                href = link_tag['href']
                
                # Arreglar enlace si es relativo (empieza por /)
                if href.startswith('/'):
                    href = domain + href
                
                # Buscar empresa (intento genérico)
                # Buscamos un div cercano con texto
                padre = elem.find_parent('div')
                empresa = "Consultar oferta"
                if padre:
                    # Intentamos encontrar cualquier texto que no sea el título
                    textos = padre.get_text(separator='|').split('|')
                    # Cogemos el segundo trozo de texto si existe (el primero suele ser el título)
                    if len(textos) > 1:
                        empresa = textos[-1].strip()

                categoria = detectar_categoria(titulo)
                
                data = {
                    "title": titulo,
                    "company": empresa[:50], # Cortamos por si acaso captura mucho texto
                    "url_source": href,
                    "location": "España",
                    "description_snippet": "Oferta activa en TecnoEmpleo",
                    "category": categoria 
                }
                
                # Insertar
                supabase.table("jobs").upsert(data).execute()
                count += 1
                if count <= 3: # Solo imprimimos los 3 primeros para no ensuciar
                    print(f"Guardado OK: {titulo} -> {categoria}")
                
            except Exception as e:
                print(f"Error procesando oferta {index}: {e}")
                errores += 1
                continue
                
        print(f"FIN: {count} guardadas. {errores} fallidas.")
        
    except Exception as e:
        print(f"Error Crítico Conexión: {e}")

if __name__ == "__main__":
    scrape_tecnoempleo()
