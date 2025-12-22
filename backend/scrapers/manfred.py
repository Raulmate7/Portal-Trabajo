import requests
import xml.etree.ElementTree as ET

def get_manfred_jobs():
    print("🦄 Conectando con Manfred (RSS)...")
    url = "https://getmanfred.com/feed.xml"
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        # Manfred suele usar codificación utf-8, nos aseguramos
        response.encoding = 'utf-8'
        
        root = ET.fromstring(response.content)
        jobs = []
        
        # Espacio de nombres de Atom (formato que usa Manfred)
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        for entry in root.findall('atom:entry', ns):
            try:
                title = entry.find('atom:title', ns).text
                link = entry.find('atom:link', ns).attrib['href']
                
                # La descripción suele estar en 'content' o 'summary'
                content = entry.find('atom:content', ns)
                summary = entry.find('atom:summary', ns)
                
                desc_text = ""
                if content is not None and content.text:
                    desc_text = content.text
                elif summary is not None and summary.text:
                    desc_text = summary.text
                    
                # Limpieza básica de HTML para el snippet
                snippet = desc_text.replace('<p>', '').replace('</p>', '').replace('<b>', '')[:200] + "..."
                
                job = {
                    'title': title,
                    'company': "Manfred (Verified)", # Manfred valida las empresas
                    'location': "España / Remoto",
                    'salary': "Ver en oferta",
                    'description': snippet,
                    'link': link
                }
                jobs.append(job)
                
            except Exception as e:
                continue

        print(f"✅ Encontradas {len(jobs)} ofertas en Manfred.")
        return jobs

    except Exception as e:
        print(f"❌ Error en Manfred: {e}")
        return []
