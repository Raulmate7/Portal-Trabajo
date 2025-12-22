import requests

def get_remotive_jobs():
    print("⚡ Conectando con API de Remotive...")
    # URL oficial de la API para desarrolladores de software
    url = "https://remotive.com/api/remote-jobs?category=software-dev&limit=50"
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        # En esta API, las ofertas están dentro de una lista llamada 'jobs'
        raw_jobs = data.get('jobs', [])
        
        jobs = []
        for item in raw_jobs:
            try:
                # Mapeamos los datos de la API a nuestro formato
                title = item.get('title', 'Sin título')
                company = item.get('company_name', 'Remotive Inc.')
                location = item.get('candidate_required_location', 'Remoto')
                link = item.get('url', '')
                description_html = item.get('description', '')
                
                # Limpieza rápida de la descripción
                snippet = description_html.replace('<div>', '').replace('</div>', '')[:200] + "..."
                
                # Solo guardamos si tenemos título y enlace
                if title and link:
                    jobs.append({
                        'title': title,
                        'company': company,
                        'location': location,
                        'salary': item.get('salary', 'Ver en oferta'), # A veces viene, a veces no
                        'description': snippet,
                        'link': link
                    })
            except Exception as e:
                continue

        print(f"✅ Encontradas {len(jobs)} ofertas en Remotive.")
        return jobs

    except Exception as e:
        print(f"❌ Error en Remotive: {e}")
        return []

if __name__ == "__main__":
    jobs = get_remotive_jobs()
    print(jobs[0] if jobs else "Nada encontrado")
