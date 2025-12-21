import scrapy
from datetime import datetime

class JobSpider(scrapy.Spider):
    name = "job_spider"
    allowed_domains = ["tecnoempleo.com"]
    start_urls = ["https://www.tecnoempleo.com/ofertas-trabajo/informatica-telecomunicaciones"]

    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'DOWNLOAD_DELAY': 2,
    }

    def parse(self, response):
        # ESTRATEGIA ROBUSTA:
        # En TecnoEmpleo, los títulos de las ofertas suelen ser enlaces dentro de etiquetas H3 o H4.
        # Buscamos directamente esos elementos, que son más estables que las "divs" con clases raras.
        
        # Seleccionamos todos los elementos 'a' (enlaces) que estén dentro de un 'h3'
        # o que su URL contenga "/ofertas-trabajo/" (pero no sean índices)
        enlaces_ofertas = response.css('h3 a') or response.css('h4 a')

        # Si lo anterior falla, plan de emergencia: buscar cualquier link de oferta
        if not enlaces_ofertas:
             self.logger.warning("⚠️ No encontré H3/H4, probando búsqueda genérica de enlaces...")
             enlaces_ofertas = response.css('a[href*="/ofertas-trabajo/"]:not([href*="busqueda"])')

        count = 0
        for link in enlaces_ofertas:
            # 1. Título (Texto del enlace)
            title = link.css('::text').get()
            
            # 2. URL (Atributo href)
            relative_url = link.css('::attr(href)').get()
            
            # Validación: Si no hay título o URL, o el título es muy corto, saltamos
            if not title or not relative_url or len(title) < 5:
                continue
                
            full_url = response.urljoin(relative_url)

            # 3. Intentamos sacar la empresa y ubicación buscando cerca del enlace
            # (Subimos al padre y buscamos textos cercanos)
            # Esto es "best effort": si no lo encuentra, pondrá genéricos.
            container = link.xpath('..//..') # Subimos dos niveles para ver el contexto
            
            # Buscamos cualquier texto que parezca una empresa (suelen ser enlaces simples cerca)
            company = container.css('a.text-primary::text').get() or "Empresa IT"
            
            # Buscamos ubicación (texto al final)
            location = container.css('span.float-end::text').get() or "España"

            # 4. Salario
            salary = "Consultar"

            count += 1
            yield {
                 'title': title.strip(),
                 'company': company.strip(),
                 'location': location.strip(),
                 'salary': salary,
                 'description_snippet': "Oferta encontrada en TecnoEmpleo.",
                 'url_source': full_url,
                 'sector_slug': 'informatica-tecnologia',  # <--- ESTA ES LA CLAVE NUEVA
                 'created_at': datetime.now().isoformat()
             }
        
        self.logger.info(f"✅ SE HAN ENCONTRADO {count} OFERTAS EN ESTA PÁGINA")
