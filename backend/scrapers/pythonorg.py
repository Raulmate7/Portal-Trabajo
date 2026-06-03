import requests
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup

def get_pythonorg_jobs():
    print("🐍 Conectando con Python.org Jobs RSS...")
    url = "https://www.python.org/jobs/feed/rss/"

    headers = {'User-Agent': 'Mozilla/5.0'}

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        root = ET.fromstring(response.content)
        items = root.findall('.//item')

        jobs = []
        for item in items:
            try:
                title_raw = item.find('title').text or ''
                if not title_raw:
                    continue

                # Parsear Título y Empresa
                parts = [p.strip() for p in title_raw.split(',')]
                if len(parts) > 1:
                    # Agrupar Inc., LLC, etc. con el penúltimo elemento
                    if parts[-1].lower() in ['inc.', 'inc', 'llc', 'ltd.', 'ltd', 'corp.', 'corp', 'co.']:
                        company = ", ".join(parts[-2:])
                        job_title = ", ".join(parts[:-2])
                    else:
                        company = parts[-1]
                        job_title = ", ".join(parts[:-1])
                else:
                    company = "Python.org Partner"
                    job_title = title_raw

                url_source = item.find('link').text or ''

                # Parsear Ubicación e HTML de Descripción
                desc_raw = item.find('description').text or ''
                lines = desc_raw.split('\n')
                location = "Remoto"
                description_html = desc_raw

                if lines:
                    first_line = lines[0].strip()
                    # Si la primera línea es texto plano y no HTML, es la localización
                    if first_line and not first_line.startswith('<'):
                        location = first_line
                        description_html = '\n'.join(lines[1:])

                # Limpieza de HTML para el Snippet
                if description_html:
                    clean_text = BeautifulSoup(description_html, 'html.parser').get_text()
                    clean_text = clean_text.replace('\n', ' ').strip()
                    snippet = clean_text[:200]
                    if len(clean_text) > 200:
                        snippet += "..."
                else:
                    snippet = "Oferta de empleo para desarrolladores Python."

                # Agregar prefijo de Fuente para el frontend
                description_snippet = f"[Fuente: Python.org] {snippet}"

                if not job_title or not url_source:
                    continue

                jobs.append({
                    'title': job_title,
                    'company': company,
                    'location': location,
                    'salary': 'Ver en oferta',
                    'description_snippet': description_snippet,
                    'url_source': url_source,
                })
            except Exception as e:
                print(f"⚠️ Error procesando oferta individual de Python.org: {e}")
                continue

        print(f"✅ Encontradas {len(jobs)} ofertas en Python.org.")
        return jobs

    except Exception as e:
        print(f"❌ Error en Python.org RSS: {e}")
        return []

if __name__ == "__main__":
    jobs = get_pythonorg_jobs()
    if jobs:
        print("Ejemplo de oferta:", jobs[0])
    else:
        print("No se encontraron ofertas.")
