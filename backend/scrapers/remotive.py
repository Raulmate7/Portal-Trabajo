import requests
from bs4 import BeautifulSoup

def get_remotive_jobs():
    print("⚡ Conectando con API de Remotive...")
    url = "https://remotive.com/api/remote-jobs?category=software-dev&limit=50"

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        data = response.json()
        raw_jobs = data.get('jobs', [])

        jobs = []
        for item in raw_jobs:
            try:
                title = item.get('title', 'Sin título')
                company = item.get('company_name', 'Remotive Inc.')
                location = item.get('candidate_required_location', 'Remoto')
                url_source = item.get('url', '')
                description_html = item.get('description', '')

                # Limpieza HTML con BeautifulSoup para snippet limpio
                clean_text = BeautifulSoup(description_html, 'html.parser').get_text()
                description_snippet = clean_text[:200].strip() + "..."

                if not title or not url_source:
                    continue

                jobs.append({
                    'title': title,
                    'company': company,
                    'location': location,
                    'salary': item.get('salary', 'Ver en oferta') or 'Ver en oferta',
                    'description_snippet': description_snippet,  # clave unificada
                    'url_source': url_source,                    # clave unificada
                })
            except Exception:
                continue

        print(f"✅ Encontradas {len(jobs)} ofertas en Remotive.")
        return jobs

    except Exception as e:
        print(f"❌ Error en Remotive: {e}")
        return []

if __name__ == "__main__":
    jobs = get_remotive_jobs()
    print(jobs[0] if jobs else "Nada encontrado")
