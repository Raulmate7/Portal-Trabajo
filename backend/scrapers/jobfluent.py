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

        offers = soup.find_all('div', class_='offer-body')

        for offer in offers:
            try:
                h3 = offer.find('h3')
                if not h3:
                    continue

                link_elem = h3.find('a')
                if not link_elem:
                    continue

                title = link_elem.get_text(strip=True)
                url_source = "https://www.jobfluent.com" + link_elem['href']

                company = "Startup"
                comp_elem = offer.find('h4')
                if comp_elem:
                    company = comp_elem.get_text(strip=True)

                location = "España"
                loc_icon = offer.find('span', class_='location')
                if loc_icon:
                    location = loc_icon.get_text(strip=True)

                jobs.append({
                    'title': title,
                    'company': company,
                    'location': location,
                    'salary': 'Competitivo',
                    'description_snippet': f"Oferta de startup en {location}",  # clave unificada
                    'url_source': url_source,                                    # clave unificada
                })

            except Exception:
                continue

        print(f"✅ Encontradas {len(jobs)} ofertas en JobFluent.")
        return jobs

    except Exception as e:
        print(f"❌ Error en JobFluent: {e}")
        return []
