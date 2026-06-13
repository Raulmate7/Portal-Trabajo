import re

def get_job_slug(job_id, title, location=None, company=None):
    def slugify(text):
        if not text:
            return ''
        text = str(text).lower().strip()
        # Reemplazar espacios y caracteres especiales
        text = re.sub(r'\s+', '-', text)
        text = re.sub(r'[^\w\-]', '', text)
        text = re.sub(r'-{2,}', '-', text)
        return text.strip('-')
    
    parts = [
        slugify(title),
        slugify(location) if location else '',
        slugify(company) if company and company != 'Desconocida' else ''
    ]
    slug = '-'.join([p for p in parts if p])
    return f"{slug}-{job_id}"
