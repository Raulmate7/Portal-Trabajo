import requests
from bs4 import BeautifulSoup

def get_himalayas_jobs():
    print("🏔️  Conectando con Himalayas Remote Jobs API...")
    url = "https://himalayas.app/jobs/api?limit=50"

    headers = {'User-Agent': 'Mozilla/5.0'}

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        data = response.json()
        raw_jobs = data.get('jobs', [])

        jobs = []
        for item in raw_jobs:
            try:
                title = item.get('title', '').strip()
                company = item.get('companyName', '').strip() or 'Himalayas Partner'
                
                # Ubicación: Himalayas es remoto, unimos las restricciones de localización
                loc_list = item.get('locationRestrictions', [])
                if loc_list:
                    location = f"Remoto ({', '.join(loc_list)})"
                else:
                    location = "Remoto (Mundial)"

                url_source = item.get('applicationLink', '') or item.get('guid', '')

                # Salario
                min_sal = item.get('minSalary')
                max_sal = item.get('maxSalary')
                currency = item.get('currency', 'USD')
                if min_sal and max_sal:
                    salary = f"{min_sal:,} - {max_sal:,} {currency}"
                elif min_sal:
                    salary = f"Desde {min_sal:,} {currency}"
                elif max_sal:
                    salary = f"Hasta {max_sal:,} {currency}"
                else:
                    salary = "Ver en oferta"

                # Descripción y snippet
                description_html = item.get('description', '')
                if description_html:
                    clean_text = BeautifulSoup(description_html, 'html.parser').get_text()
                    clean_text = clean_text.replace('\n', ' ').strip()
                    snippet = clean_text[:200]
                    if len(clean_text) > 200:
                        snippet += "..."
                else:
                    snippet = "Oferta de empleo remota tecnológica."

                # Agregamos el prefijo [Fuente: Himalayas] al snippet para que el frontend lo detecte
                description_snippet = f"[Fuente: Himalayas] {snippet}"

                if not title or not url_source:
                    continue

                jobs.append({
                    'title': title,
                    'company': company,
                    'location': location,
                    'salary': salary,
                    'description_snippet': description_snippet,
                    'url_source': url_source,
                })
            except Exception as e:
                print(f"⚠️ Error procesando oferta individual de Himalayas: {e}")
                continue

        print(f"✅ Encontradas {len(jobs)} ofertas en Himalayas.")
        return jobs

    except Exception as e:
        print(f"❌ Error en Himalayas API: {e}")
        return []

if __name__ == "__main__":
    jobs = get_himalayas_jobs()
    if jobs:
        print("Ejemplo de oferta:", jobs[0])
    else:
        print("No se encontraron ofertas.")
