import requests

def get_remoteok_jobs():
    print("🚀 Conectando con API de RemoteOK (Filtrando España)...")
    url = "https://remoteok.com/api"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }

    try:
        response = requests.get(url, headers=headers, timeout=20)
        # RemoteOK devuelve una lista directa en JSON
        data = response.json()
        
        jobs = []
        
        # Palabras clave para saber si es de España
        keywords_spain = ['spain', 'españa', 'madrid', 'barcelona', 'valencia', 'sevilla', 'bilbao', 'malaga']

        # El primer elemento de RemoteOK suele ser info legal, lo saltamos
        for item in data[1:]:
            try:
                # Obtenemos la ubicación
                location = item.get('location', '').lower()
                
                # --- FILTRO ESTRICTO ESPAÑA ---
                # Solo guardamos si la ubicación menciona explícitamente España o ciudades principales
                if not any(word in location for word in keywords_spain):
                    continue

                title = item.get('position', 'Sin título')
                company = item.get('company', 'Empresa Tech')
                link = item.get('url', '')
                description = item.get('description', '')[:200] + "..." # Snippet corto
                
                # Arreglamos la ubicación para que quede bonita en la web
                location_display = "España (Remoto)"
                if "madrid" in location: location_display = "Madrid"
                elif "barcelona" in location: location_display = "Barcelona"

                jobs.append({
                    'title': title,
                    'company': company,
                    'location': location_display,
                    'salary': item.get('salary_min', 'Competitivo'), # A veces tienen salario
                    'description': description,
                    'link': link
                })

            except Exception as e:
                continue

        print(f"✅ Encontradas {len(jobs)} ofertas en RemoteOK (España).")
        return jobs

    except Exception as e:
        print(f"❌ Error en RemoteOK: {e}")
        return []
