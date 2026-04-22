import requests

def get_workingnomads_jobs():
    print("🐫 Cruzando el desierto con WorkingNomads (Europa/España)...")

    url = "https://www.workingnomads.com/api/exposed_jobs"

    try:
        response = requests.get(url, timeout=20)
        response.raise_for_status()

        data = response.json()
        jobs = []

        keywords_europe = ['europe', 'europa', 'spain', 'españa', 'madrid', 'barcelona', 'emea']

        for item in data:
            try:
                # Filtro de Categoría: Solo Desarrollo
                category = item.get('category_name', '').lower()
                if 'development' not in category:
                    continue

                location_raw = item.get('location', '') or ""
                loc_lower = location_raw.lower()

                if not any(word in loc_lower for word in keywords_europe):
                    continue

                title = item.get('title', 'Sin título')
                company = item.get('company_name', 'Empresa')
                url_source = item.get('url', '')

                if not url_source:
                    continue

                description_raw = item.get('description', '') or ''
                description_snippet = description_raw[:200].strip() + "..."

                location_display = "Europa / España"
                if any(w in loc_lower for w in ['spain', 'españa', 'madrid', 'barcelona']):
                    location_display = "España"

                jobs.append({
                    'title': title,
                    'company': company,
                    'location': location_display,
                    'salary': 'Consultar',
                    'description_snippet': description_snippet,  # clave unificada
                    'url_source': url_source,                    # clave unificada
                })

            except Exception:
                continue

        print(f"✅ Encontradas {len(jobs)} ofertas en WorkingNomads.")
        return jobs

    except Exception as e:
        print(f"❌ Error en WorkingNomads: {e}")
        return []
