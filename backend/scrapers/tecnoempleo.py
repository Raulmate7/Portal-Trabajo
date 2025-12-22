import requests
from bs4 import BeautifulSoup

def get_tecnoempleo_jobs():
    print("🔎 Escaneando TecnoEmpleo...")
    # URL directa de búsqueda
    url = "https://www.tecnoempleo.com/ofertas-trabajo/?te=informatica-tecnologia"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
        # Si la web nos bloquea, lanzará error aquí
        response.raise_for_status() 
        
        soup = BeautifulSoup(response.text, 'html.parser')
        jobs = []

        # ESTRATEGIA: En TecnoEmpleo, los títulos de las ofertas suelen estar en etiquetas <h3>
        # dentro de un <a> o conteniendo un <a>. Buscamos todos los h3.
        candidates = soup.find_all('h3')

        for candidate in candidates:
            try:
                # Buscamos el enlace dentro del h3
                link_elem = candidate.find('a')
                if not link_elem:
                    continue

                title = link_elem.get_text(strip=True)
                link = link_elem['href']
                
                # Arreglar enlace si es relativo (empieza por /)
                if link.startswith('/'):
                    link = "https://www.tecnoempleo.com" + link

                # Descartamos si no parece una oferta (a veces hay publicidad)
                if "ofertas-trabajo" not in link and "empleo" not in link:
                    continue

                # Intentamos sacar datos extra buscando alrededor del título
                # El "padre" del h3 suele ser la tarjeta de la oferta
                card = candidate.find_parent('div')
                
                company = "Empresa IT"
                location = "España/Remoto"
                description = "Ver detalles en la oferta..."

                if card:
                    text_content = card.get_text(separator=" ", strip=True)
                    # Pequeño truco: cogemos un trozo de texto como descripción
                    description = text_content[:150] + "..."

                jobs.append({
                    'title': title,
                    'company': company,
                    'location': location,
                    'salary': 'Consultar',
                    'description': description,
                    'link': link
                })

            except Exception as e:
                continue

        print(f"✅ Encontradas {len(jobs)} ofertas en TecnoEmpleo.")
        return jobs

    except Exception as e:
        print(f"❌ Error crítico en TecnoEmpleo: {e}")
        return []
