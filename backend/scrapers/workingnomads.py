import requests

def get_workingnomads_jobs():
    print("🐫 Cruzando el desierto con WorkingNomads (Europa/España)...")
    
    # API Oficial (devuelve todas las ofertas)
    url = "https://www.workingnomads.com/api/exposed_jobs"
    
    try:
        response = requests.get(url, timeout=20)
        response.raise_for_status()
        
        data = response.json()
        jobs = []

        # Palabras clave para filtrar cercanía
        keywords_europe = ['europe', 'europa', 'spain', 'españa', 'madrid', 'barcelona', 'emea']

        for item in data:
            try:
                # 1. Filtro de Categoría: Solo Desarrollo
                category = item.get('category_name', '').lower()
                if 'development' not in category:
                    continue

                # 2. Filtro de Ubicación: Solo España o Europa
                # La ubicación en esta API suele venir en 'location' o 'locations'
                location_raw = item.get('location', '') or ""
                
                # Convertimos a minúsculas para buscar
                loc_lower = location_raw.lower()
                
                # Si NO contiene ninguna palabra clave europea/española, saltamos
                if not any(word in loc_lower for word in keywords_europe):
                    continue

                title = item.get('title', 'Sin título')
                company = item.get('company_name', 'Empresa')
                link = item.get('url', '')
                description = item.get('description', '')[:200] + "..."
                
                # Formatear la ubicación para la web
                location_display = "Europa / España"
                if "spain" in loc_lower or "españa" in loc_lower or "madrid" in loc_lower:
                    location_display = "España"

                jobs.append({
                    'title': title,
                    'company': company,
                    'location': location_display,
                    'salary': 'Consultar',
                    'description': description,
                    'link': link
                })

            except Exception as e:
                continue

        print(f"✅ Encontradas {len(jobs)} ofertas en WorkingNomads.")
        return jobs

    except Exception as e:
        print(f"❌ Error en WorkingNomads: {e}")
        return []
