import scrapy
from datetime import datetime

class JobSpider(scrapy.Spider):
    name = "job_spider"
    allowed_domains = ["tecnoempleo.com"]
    
    # CONFIGURACIÓN DEL ROBOT
    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'DOWNLOAD_DELAY': 2, # 2 segundos de pausa para no saturar
        'DEFAULT_REQUEST_HEADERS': {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
        }
    }

    # MÉTODO NUEVO: Genera URLs para las 5 primeras páginas
    def start_requests(self):
        url_base = "https://www.tecnoempleo.com/ofertas-trabajo/informatica-telecomunicaciones"
        # Bucle de la página 1 a la 5
        for i in range(1, 6):
            url = f"{url_base}?pagina={i}"
            yield scrapy.Request(url=url, callback=self.parse)

    def parse(self, response):
        # Buscamos enlaces de ofertas dentro de H3 o H4
        enlaces_ofertas = response.css('h3 a') or response.css('h4 a')

        # Plan B si falla lo anterior
        if not enlaces_ofertas:
             enlaces_ofertas = response.css('a[href*="/ofertas-trabajo/"]:not([href*="busqueda"])')

        for link in enlaces_ofertas:
            # 1. Título
            title = link.css('::text').get()
            # 2. URL
            relative_url = link.css('::attr(href)').get()
            
            if not title or not relative_url or len(title) < 5:
                continue
                
            full_url = response.urljoin(relative_url)

            # 3. Datos extra (Empresa, Ubicación)
            container = link.xpath('..//..') 
            company = container.css('a.text-primary::text').get() or "Empresa IT"
            location = container.css('span.float-end::text').get() or "España"

            # 4. Enviar datos
            yield {
                'title': title.strip(),
                'company': company.strip(),
                'location': location.strip(),
                'salary': "Consultar",
                'description_snippet': "Oferta encontrada en TecnoEmpleo.",
                'url_source': full_url,
                'sector_slug': 'informatica-tecnologia', # Etiqueta automática
                'created_at': datetime.now().isoformat()
            }
