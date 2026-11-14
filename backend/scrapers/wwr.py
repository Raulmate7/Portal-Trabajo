import defusedxml.ElementTree as ET
from bs4 import BeautifulSoup
from logic.ssrf import safe_http_get
from logic.tdm import is_scraping_allowed, truncate_snippet

def get_wwr_jobs():
    print("🌍 Conectando con WeWorkRemotely (RSS)...")

    url = "https://weworkremotely.com/categories/remote-programming-jobs.rss"

    headers = {'User-Agent': 'PortalTrabajoITBot/1.0 (+https://portalempleoit.com/bot; bot@portalempleoit.com)'}

    try:
        response = safe_http_get(url, headers=headers, timeout=(5, 15))
        response.raise_for_status()

        root = ET.fromstring(response.content)

        jobs = []

        for item in root.findall('.//item'):
            try:
                title_raw = item.find('title').text or ''
                # En WWR el título suele ser "Company: Job Title", lo separamos
                if ':' in title_raw:
                    company, job_title = title_raw.split(':', 1)
                    company = company.strip()
                    job_title = job_title.strip()
                else:
                    company = "WeWorkRemotely"
                    job_title = title_raw

                url_source = item.find('link').text or ''

                description_html = item.find('description').text or ""
                description_snippet = truncate_snippet(description_html, 200)

                if not job_title or not url_source:
                    continue

                jobs.append({
                    'title': job_title,
                    'company': company,
                    'location': 'Remoto (Mundial)',
                    'salary': 'Ver en oferta',
                    'description_snippet': description_snippet,
                    'url_source': url_source,  # clave unificada
                })

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
