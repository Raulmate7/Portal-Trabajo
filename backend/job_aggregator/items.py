# Define here the models for your scraped items
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/items.html

import scrapy


class JobItem(scrapy.Item):
    # define the fields for your item here like:
    title = scrapy.Field()
    company = scrapy.Field()
    location = scrapy.Field()
    salary = scrapy.Field()
    description_snippet = scrapy.Field()
    url_source = scrapy.Field()
    sector_id = scrapy.Field() # Lo obtendremos del clasificador

