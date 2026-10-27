import re
import unicodedata

def slugify(text):
    if not text:
        return ''
    text = unicodedata.normalize('NFD', str(text).strip().lower())
    text = re.sub(r'[\u0300-\u036f]', '', text) # Elimina acentos igual que frontend
    text = re.sub(r'\s+', '-', text)
    text = re.sub(r'[^\w\-]', '', text)
    text = re.sub(r'-{2,}', '-', text)
    return text.strip('-')

def get_job_slug(job_id, title, location=None, company=None, title_es=None):
    title_to_use = title_es or title
    parts = [
        slugify(title_to_use),
        slugify(location) if location else '',
        slugify(company) if company and company != 'Desconocida' else ''
    ]
    slug = '-'.join([p for p in parts if p])
    return f"{slug}-{job_id}"

