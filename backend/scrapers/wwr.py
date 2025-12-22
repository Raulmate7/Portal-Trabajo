import requests
import xml.etree.ElementTree as ET
from datetime import datetime

def get_wwr_jobs():
    print("🌍 Conectando con WeWorkRemotely (RSS)...")
    
    # URL oficial del canal de ofertas de programación
    url = "https://weworkremotely.com/categories/remote-programming-jobs.rss"
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        # Analizamos el XML
        root = ET.fromstring(response.content)
        
        jobs = []
        
        # Recorremos cada oferta (item)
        for item in root.findall('.//item'):
            try:
                title = item.find('title').text
                # En WWR el título suele ser "Company: Job Title", lo separamos
                if ':' in title:
                    company, job_title = title.split(':', 1)
                    company = company.strip()
                    job_title = job_title.strip()
                else:
                    company = "WeWorkRemotely"
                    job_title = title
                
                link = item.find('link').text
                
                # La descripción viene con HTML, cogemos un trozo para el snippet
                description_html = item.find('description').text or ""
                # Limpieza rápida de etiquetas HTML para el snippet
                snippet = description_html.replace('<p>', '').replace('</p>', '')[:200] + "..."
                
                job = {
                    'title': job_title,
                    'company': company,
                    'location': 'Remoto (Mundial)', # WWR es 100% remoto
                    'salary': 'Ver en oferta', # No suelen poner salario en el RSS
                    'description': snippet,
                    'link': link
                }
                jobs.append(job)
                
            except Exception as e:
                print(f"❌ Error procesando una oferta WWR: {e}")
                continue

        print(f"✅ Encontradas {len(jobs)} ofertas en WeWorkRemotely.")
        return jobs

    except Exception as e:
        print(f"🔥 Error fatal en WWR: {e}")
        return []

if __name__ == "__main__":
    ofertas = get_wwr_jobs()
    print(ofertas[0] if ofertas else "No hay ofertas")
