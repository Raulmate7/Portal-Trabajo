import scrapy
from datetime import datetime

class JobSpider(scrapy.Spider):
    name = "job_spider"
    allowed_domains = ["tecnoempleo.com"]
    
    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'DOWNLOAD_DELAY': 2,
        'DEFAULT_REQUEST_HEADERS': {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
        }
    }

    def start_requests(self):
        # Vamos a por 5 páginas
        url_base = "https://www.tecnoempleo.com/ofertas-trabajo/informatica-telecomunicaciones"
        for i in range(1, 6):
            url = f"{url_base}?pagina={i}"
            yield scrapy.Request(url=url, callback=self.parse)

    def parse(self, response):
        # Buscamos las cajas de las ofertas
        enlaces_ofertas = response.css('h3 a') or response.css('h4 a')
        if not enlaces_ofertas:
             enlaces_ofertas = response.css('a[href*="/ofertas-trabajo/"]:not([href*="busqueda"])')

        for link in enlaces_ofertas:
            title = link.css('::text').get()
            relative_url = link.css('::attr(href)').get()
            
            if not title or not relative_url or len(title) < 5:
                continue
            
            full_url = response.urljoin(relative_url)
            container = link.xpath('..//..') 

            # --- MEJORA: DETECCIÓN DE UBICACIÓN ---
            company = container.css('a.text-primary::text').get() or "Empresa IT"
            
            # Intento 1: Span a la derecha (diseño escritorio)
            location = container.css('span.float-end::text').get()
            
            # Intento 2: Si falla, buscar cualquier span que tenga una coma (ej: "Madrid, España")
            if not location:
                possible_locations = container.css('span::text').getall()
                for loc in possible_locations:
                    if "," in loc or "Madrid" in loc or "Barcelona" in loc:
                        location = loc
                        break
            
            # Intento 3: Buscar clases comunes de ubicación
            if not location:
                location = container.css('.bg-light.text-secondary::text').get()

            # Sanitización y normalización para evitar textos largos (párrafos de descripción)
            if location:
                location = location.strip()
                if len(location) > 60 or '\n' in location or '\r' in location:
                    ciudades_populares = [
                        'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza', 'Málaga', 'Murcia', 
                        'Palma', 'Las Palmas', 'Bilbao', 'Alicante', 'Córdoba', 'Valladolid', 'Vigo', 
                        'Gijón', 'Hospitalet', 'Vitoria', 'A Coruña', 'Coruña', 'Granada', 'Elche', 'Oviedo', 
                        'Terrassa', 'Badalona', 'Cartagena', 'Jerez', 'Sabadell', 'Móstoles', 'Pamplona', 
                        'Almería', 'Leganés', 'San Sebastián', 'Getafe', 'Burgos', 'Santander', 'Albacete', 
                        'Castellón', 'Logroño', 'Badajoz', 'Huelva', 'Salamanca', 'Lleida', 'Tarragona', 
                        'León', 'Cádiz', 'Jaén', 'Ourense', 'Girona', 'Lugo', 'Cáceres', 'Toledo'
                    ]
                    location_lower = location.lower()
                    found_city = None
                    for ciudad in ciudades_populares:
                        if ciudad.lower() in location_lower:
                            found_city = ciudad
                            break
                    
                    if "remoto" in location_lower or "teletrabajo" in location_lower or "remote" in location_lower:
                        if found_city:
                            location = f"Remoto ({found_city})"
                        else:
                            location = "Remoto"
                    elif found_city:
                        location = f"{found_city}, España"
                    else:
                        location = "España"
            else:
                location = "España"
            # --------------------------------------

            yield {
                'title': title.strip(),
                'company': company.strip(),
                'location': location.strip(),
                'salary': "Consultar",
                'description_snippet': "Oferta de TecnoEmpleo",
                'url_source': full_url,
                'sector_slug': 'informatica-tecnologia',
                'created_at': datetime.now().isoformat()
            }
