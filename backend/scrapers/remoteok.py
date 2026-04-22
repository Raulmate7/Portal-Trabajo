import requests

def get_remoteok_jobs():
    print("🚀 Conectando con API de RemoteOK (Filtrando España)...")
    url = "https://remoteok.com/api"

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }

    try:
        response = requests.get(url, headers=headers, timeout=20)
        response.raise_for_status()  # Fix #11: verificar errores HTTP

        data = response.json()

        jobs = []

        keywords_spain = ['spain', 'españa', 'madrid', 'barcelona', 'valencia', 'sevilla', 'bilbao', 'malaga']

        # El primer elemento de RemoteOK suele ser info legal, lo saltamos
        for item in data[1:]:
            try:
                location = item.get('location', '').lower()

                # Solo guardamos si la ubicación menciona explícitamente España
                if not any(word in location for word in keywords_spain):
                    continue

                title = item.get('position', 'Sin título')
                company = item.get('company', 'Empresa Tech')
                url_source = item.get('url', '')

                if not url_source:
                    continue

                description_raw = item.get('description', '') or ''
                description_snippet = description_raw[:200].strip() + "..."

                location_display = "España (Remoto)"
                if "madrid" in location:
                    location_display = "Madrid"
                elif "barcelona" in location:
                    location_display = "Barcelona"

                # salary_min puede ser 0 o vacío, usamos "Competitivo" como fallback
                salary = item.get('salary_min')
                salary_display = str(salary) if salary else 'Competitivo'

                jobs.append({
                    'title': title,
                    'company': company,
                    'location': location_display,
                    'salary': salary_display,
                    'description_snippet': description_snippet,  # clave unificada
                    'url_source': url_source,                    # clave unificada
                })

            except Exception:
                continue

        print(f"✅ Encontradas {len(jobs)} ofertas en RemoteOK (España).")
        return jobs

    except Exception as e:
        print(f"❌ Error en RemoteOK: {e}")
        return []
