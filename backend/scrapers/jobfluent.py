import requests
from bs4 import BeautifulSoup

def get_jobfluent_jobs():
    print("💃 Bailando con JobFluent (Startups España)...")
    url = "https://www.jobfluent.com/es/empleos-startup-espana"
    
    headers = {'User-Agent': 'Mozilla/5.0'}

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        jobs = []

        # JobFluent es muy limpio. Las ofertas suelen estar en 'a' con clase 'offer-link'
        # O contenedores div
        offers = soup.find_all('div', class_='offer-body')

        for offer in offers:
            try:
                # Título (está dentro de un h3 -> a)
                h3 = offer.find('h3')
                if not h3: continue
                
                link_elem = h3.find('a')
                if not link_elem: continue
                
                title = link_elem.get_text(strip=True)
                link = "https://www.jobfluent.com" + link_elem['href']

                # Empresa
                company = "Startup"
                comp_elem = offer.find('h4')
                if comp_elem:
                    company = comp_elem.get_text(strip=True)

                # Ubicación (Suele estar en un span class="location")
                location = "España" # Por defecto, ya que la URL es de España
                loc_icon = offer.find('span', class_='location')
                if loc_icon:
                    location = loc_icon.get_text(strip=True)

                jobs.append({
                    'title': title,
                    'company': company,
                    'location': location,
                    'salary': 'Competitivo',
                    'description': f"Oferta de startup en {location}",
                    'link': link
                })

            except Exception as e:
                continue

        print(f"✅ Encontradas {len(jobs)} ofertas en JobFluent.")
        return jobs

    except Exception as e:
        print(f"❌ Error en JobFluent: {e}")
        return []
