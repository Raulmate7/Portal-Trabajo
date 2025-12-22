import requests
from bs4 import BeautifulSoup

def get_ticjob_jobs():
    print("🥘 TicJob: Estrategia Cazador de Enlaces...")
    
    url = "https://ticjob.es/busca-ofertas-trabajo-tic"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    try:
        response = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(response.text, 'html.parser')
        jobs = []

        # BUSCAMOS TODOS LOS ENLACES que tengan "/oferta-trabajo/" en la URL
        # Esta estrategia casi nunca falla.
        links = soup.find_all('a', href=lambda x: x and '/oferta-trabajo/' in x)

        for link_elem in links:
            try:
                title = link_elem.get_text(strip=True)
                # Si el enlace no tiene texto (es una imagen o botón), lo saltamos
                if not title or len(title) < 5: 
                    # A veces el título está en un h2 hijo
                    h2 = link_elem.find('h2')
                    if h2: title = h2.get_text(strip=True)
                    else: continue

                link = link_elem['href']
                
                # Descartamos si es el enlace de "ver más"
                if "page=" in link: continue

                jobs.append({
                    'title': title,
                    'company': "Empresa TIC", # TicJob protege nombres a veces
                    'location': "España",
                    'salary': 'Consultar',
                    'description': "Ver detalles en la oferta...",
                    'link': link
                })

            except Exception as e:
                continue

        # Limpiamos duplicados (TicJob pone el mismo enlace en el título y en el logo)
        unique_jobs = list({v['link']: v for v in jobs}.values())

        print(f"✅ Encontradas {len(unique_jobs)} ofertas en TicJob.")
        return unique_jobs

    except Exception as e:
        print(f"❌ Error en TicJob: {e}")
        return []
