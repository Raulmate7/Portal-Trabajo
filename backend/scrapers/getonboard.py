import requests
from bs4 import BeautifulSoup
import urllib3

# Silenciar advertencias SSL
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def get_getonboard_jobs():
    print("🏄 Surfeando en GetOnBoard (URL Corregida)...")
    
    # CAMBIO IMPORTANTE: URL con '/' en vez de '-'
    url = "https://www.getonboard.com/jobs/programming"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    }

    try:
        response = requests.get(url, headers=headers, timeout=15, verify=False)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        jobs = []

        # Buscamos enlaces que sean ofertas (suelen contener '/jobs/')
        items = soup.find_all('a', href=True)

        for item in items:
            try:
                link = item['href']
                # Filtramos para asegurarnos que es una oferta y no un menú
                if '/jobs/' not in link or 'programming' in link: 
                    # 'programming' en el link suele ser la categoría, no la oferta concreta
                    if not link.split('/')[-1][0].isdigit() and '-' not in link.split('/')[-1]:
                        continue

                # En GetOnBoard los títulos suelen estar dentro del <a>
                # Buscamos un strong, h4, o simplemente el texto
                title_elem = item.find('strong') or item.find('h4')
                
                if title_elem:
                    title = title_elem.get_text(strip=True)
                else:
                    # Si no hay etiqueta dentro, a veces es el propio texto
                    # Pero cuidado con enlaces vacíos
                    continue

                # Limpieza del texto del enlace para ver si es España
                text_content = item.get_text(strip=True).lower()
                
                # --- FILTRO ESPAÑA ---
                # Buscamos palabras clave en todo el texto del elemento
                keywords_es = ['spain', 'españa', 'madrid', 'barcelona', 'valencia', 'remote', 'remoto', 'europe']
                if not any(word in text_content for word in keywords_es):
                    continue

                location = "España"
                if "remote" in text_content or "remoto" in text_content:
                    location = "Remoto"

                jobs.append({
                    'title': title,
                    'company': "Empresa Tech", # Difícil de sacar fuera, ponemos genérico
                    'location': location,
                    'salary': 'Ver oferta',
                    'description': f"Oferta en GetOnBoard: {title}",
                    'link': link
                })

            except Exception as e:
                continue

        # Eliminamos duplicados por si acaso
        unique_jobs = {j['link']: j for j in jobs}.values()
        
        print(f"✅ Encontradas {len(unique_jobs)} ofertas en GetOnBoard.")
        return list(unique_jobs)

    except Exception as e:
        print(f"❌ Error en GetOnBoard: {e}")
        return []
