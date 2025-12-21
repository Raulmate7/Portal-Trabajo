# job_aggregator/spiders/job_spider.py

import scrapy
from scrapy.exceptions import DropItem
from job_aggregator.items import JobItem
from logic.classifier import SectorClassifier
import os
from dotenv import load_dotenv

# Cargar variables de entorno al inicio del script
load_dotenv()

class JobSpider(scrapy.Spider):
    name = "job_spider"
    # Reemplaza con los dominios que deseas rastrear
    allowed_domains = ["ejemplo.com", "otroejemplo.es"] 
    # Reemplaza con las URLs de inicio
    start_urls = ["http://www.ejemplo.com/jobs", "http://www.otroejemplo.es/empleo"]

    # Inicializar el clasificador al inicio del spider
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        try:
            # El clasificador se conecta a la DB para cargar los sectores
            self.classifier = SectorClassifier()
            if not self.classifier.sectors_data:
                 self.logger.warning("El clasificador no pudo cargar los datos de sectores. La clasificación fallará.")
        except Exception as e:
            self.logger.error(f"Error al inicializar SectorClassifier: {e}")
            # Si no se puede inicializar, el spider no debería correr o debe correr sin clasificación
            self.classifier = None

    def parse(self, response):
        # Estructura genérica de scraping: Asume que cada oferta está en un contenedor
        # Reemplaza '.job-listing' con el selector CSS real de tu sitio objetivo
        job_listings = response.css('.job-listing') 

        for job in job_listings:
            # Extracción de datos (ajusta los selectores CSS/XPath según el sitio)
            title = job.css('h2.job-title::text').get()
            company = job.css('.company-name::text').get()
            location = job.css('.location::text').get()
            url_source = job.css('a::attr(href)').get()
            description_snippet = job.css('.snippet::text').get()
            salary = job.css('.salary::text').get() # Opcional

            # Limpieza básica
            if not title or not url_source:
                self.logger.debug("Oferta sin título o URL, ignorando.")
                continue

            # Clasificación
            sector_id = None
            if self.classifier:
                # Usamos el título y el snippet para la clasificación
                text_to_classify = f"{title} {description_snippet or ''}"
                sector_id = self.classifier.classify(text_to_classify)
            
            if not sector_id:
                # Si no se clasifica, se puede decidir ignorar la oferta o guardarla con sector_id=NULL
                self.logger.debug(f"Oferta '{title}' no clasificada, ignorando.")
                # raise DropItem(f"Oferta no clasificada: {title}")
                continue # Ignoramos las que no se clasifican para mantener la calidad

            # Creación del Item
            item = JobItem()
            item['title'] = title.strip()
            item['company'] = company.strip() if company else 'Desconocida'
            item['location'] = location.strip() if location else 'España'
            item['salary'] = salary.strip() if salary else None
            item['description_snippet'] = description_snippet.strip() if description_snippet else None
            item['url_source'] = response.urljoin(url_source) # Asegura que la URL sea absoluta
            item['sector_id'] = sector_id

            yield item

        # Lógica para seguir a la siguiente página (Paginación)
        # Reemplaza '.next-page a::attr(href)' con el selector real
        next_page = response.css('.next-page a::attr(href)').get()
        if next_page is not None:
            yield response.follow(next_page, self.parse)

# NOTA: Para que Scrapy reconozca este proyecto, se necesita un archivo scrapy.cfg
# en el directorio raíz del proyecto (scraper/).

