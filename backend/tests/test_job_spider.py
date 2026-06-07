import unittest
from scrapy.http import HtmlResponse
from job_aggregator.spiders.job_spider import JobSpider

class TestJobSpider(unittest.TestCase):

    def test_parse_tecnoempleo_offer(self):
        # 1. Crear el spider
        spider = JobSpider()

        # 2. HTML ficticio que imita la estructura de Tecnoempleo
        html_content = """
        <html>
            <body>
                <div class="row fs--15">
                    <div>
                        <h3>
                            <a href="/ofertas-trabajo/desarrollador-python/rf-123">Desarrollador Python</a>
                        </h3>
                        <div>
                            <a class="text-primary" href="/empresa/acme">Acme Corporation</a>
                            <span class="float-end">Madrid, España</span>
                        </div>
                    </div>
                </div>
                <div class="row fs--15">
                    <div>
                        <h3>
                            <a href="/ofertas-trabajo/react-frontend/rf-456">React Developer</a>
                        </h3>
                        <div>
                            <a class="text-primary" href="/empresa/beta">Beta Tech</a>
                            <!-- Sin span.float-end para probar el fallback de ubicación -->
                        </div>
                    </div>
                </div>
            </body>
        </html>
        """

        # 3. Crear el objeto HtmlResponse de Scrapy
        response = HtmlResponse(
            url="https://www.tecnoempleo.com/ofertas-trabajo/informatica-telecomunicaciones",
            body=html_content.encode('utf-8'),
            encoding='utf-8'
        )

        # 4. Parsear
        results = list(spider.parse(response))

        # 5. Comprobaciones
        self.assertEqual(len(results), 2)

        # Primera oferta (completa)
        self.assertEqual(results[0]['title'], 'Desarrollador Python')
        self.assertEqual(results[0]['company'], 'Acme Corporation')
        self.assertEqual(results[0]['location'], 'Madrid, España')
        self.assertEqual(results[0]['url_source'], 'https://www.tecnoempleo.com/ofertas-trabajo/desarrollador-python/rf-123')
        self.assertEqual(results[0]['sector_slug'], 'informatica-tecnologia')

        # Segunda oferta (sin ubicación explícita -> fallback "España")
        self.assertEqual(results[1]['title'], 'React Developer')
        self.assertEqual(results[1]['company'], 'Beta Tech')
        self.assertEqual(results[1]['location'], 'España')
        self.assertEqual(results[1]['url_source'], 'https://www.tecnoempleo.com/ofertas-trabajo/react-frontend/rf-456')

if __name__ == '__main__':
    unittest.main()
