import re

def classify_job(title: str, description: str) -> str:
    """
    Clasifica una oferta de empleo en base a su título y descripción en una de las categorías:
    'Backend', 'Frontend', 'Data & AI', 'Cloud & DevOps', 'Mobile' o 'Otros'.
    Usa un sistema de puntuación con mayor peso en el título.
    """
    title_lower = (title or "").lower()
    desc_lower = (description or "").lower()
    
    # Definición de palabras clave por categoría
    # Se usan tuplas de (patrón, puntuación_en_titulo, puntuación_en_desc)
    # Algunos patrones necesitan regex con límites de palabra (\b) para evitar falsos positivos.
    categories_rules = {
        'Frontend': [
            (r'\bfrontend\b', 10, 3),
            (r'\bfront-end\b', 10, 3),
            (r'\breact\b', 8, 2),
            (r'\bangular\b', 8, 2),
            (r'\bvue\b', 8, 2),
            (r'\bnextjs\b', 8, 2),
            (r'\bnext\.js\b', 8, 2),
            (r'\bnuxt\b', 8, 2),
            (r'\bsvelte\b', 8, 2),
            (r'\bjavascript\b', 6, 2),
            (r'\btypescript\b', 6, 2),
            (r'\bjs\b', 4, 1),
            (r'\bts\b', 4, 1),
            (r'\btailwind\b', 6, 2),
            (r'\bbootstrap\b', 4, 1),
            (r'\bhtml\b', 4, 2),
            (r'\bcss\b', 4, 2),
            (r'\bui/ux\b', 6, 2),
            (r'\bmaquetador\b', 8, 2),
        ],
        'Backend': [
            (r'\bbackend\b', 10, 3),
            (r'\bback-end\b', 10, 3),
            (r'\bnode\b', 8, 2),
            (r'\bnodejs\b', 8, 2),
            (r'\bnode\.js\b', 8, 2),
            (r'\bpython\b', 7, 2), # python también puede ser data
            (r'\bjava\b', 8, 2),
            (r'\bphp\b', 8, 2),
            (r'\bruby\b', 8, 2),
            (r'\brails\b', 8, 2),
            (r'\bgolang\b', 8, 2),
            (r'\bgo\b', 4, 1), # 'go' es corto, requiere límite estricto
            (r'\brust\b', 8, 2),
            (r'\bc#', 8, 2), # c# no tiene limite de palabra a la derecha
            (r'\bcsharp\b', 8, 2),
            (r'\bc-sharp\b', 8, 2),
            (r'\bspring\b', 8, 2),
            (r'\bspringboot\b', 8, 2),
            (r'\bdjango\b', 8, 2),
            (r'\bflask\b', 8, 2),
            (r'\bfastapi\b', 8, 2),
            (r'\blaravel\b', 8, 2),
            (r'\bexpress\b', 6, 1),
            (r'\bnestjs\b', 8, 2),
            (r'\bnest\.js\b', 8, 2),
            (r'\b\.net\b', 7, 2),
            (r'\bdotnet\b', 8, 2),
            (r'\bapi\b', 4, 1),
            (r'\bapis\b', 4, 1),
            (r'\bmicroservicios\b', 6, 2),
            (r'\bmicroservices\b', 6, 2),
        ],
        'Data & AI': [
            (r'\bdata\b', 8, 2),
            (r'\bbigdata\b', 8, 2),
            (r'\bbig data\b', 8, 2),
            (r'\banalytics\b', 6, 2),
            (r'\banálisis de datos\b', 8, 3),
            (r'\banalysta de datos\b', 8, 3),
            (r'\bmachine learning\b', 10, 4),
            (r'\bml\b', 4, 1),
            (r'\bai\b', 5, 1),
            (r'\bia\b', 4, 1),
            (r'\binteligencia artificial\b', 10, 4),
            (r'\bartificial intelligence\b', 10, 4),
            (r'\bsql\b', 4, 2),
            (r'\bpowerbi\b', 8, 3),
            (r'\bpower bi\b', 8, 3),
            (r'\btableau\b', 8, 3),
            (r'\bspark\b', 8, 2),
            (r'\bhadoop\b', 8, 2),
            (r'\bpandas\b', 6, 2),
            (r'\bnumpy\b', 6, 1),
            (r'\btensorflow\b', 8, 2),
            (r'\bpytorch\b', 8, 2),
            (r'\bcientífico de datos\b', 10, 4),
            (r'\bdata scientist\b', 10, 4),
            (r'\bdata engineer\b', 10, 4),
            (r'\bingeniero de datos\b', 10, 4),
            (r'\bdata analyst\b', 10, 4),
            (r'\bdeep learning\b', 8, 2),
            (r'\bnlp\b', 8, 2),
        ],
        'Cloud & DevOps': [
            (r'\bcloud\b', 8, 2),
            (r'\bnube\b', 4, 1),
            (r'\bdevops\b', 10, 3),
            (r'\bdevsecops\b', 10, 3),
            (r'\baws\b', 8, 2),
            (r'\bamazon web services\b', 8, 2),
            (r'\bdocker\b', 6, 2),
            (r'\bkubernetes\b', 8, 2),
            (r'\bk8s\b', 8, 2),
            (r'\bazure\b', 8, 2),
            (r'\bgcp\b', 8, 2),
            (r'\bgoogle cloud\b', 8, 2),
            (r'\bsistemas\b', 4, 1),
            (r'\bsysadmin\b', 10, 3),
            (r'\blinux\b', 6, 2),
            (r'\badministrador de sistemas\b', 10, 3),
            (r'\bterraform\b', 8, 2),
            (r'\bansible\b', 8, 2),
            (r'\bjenkins\b', 6, 2),
            (r'\bci/cd\b', 6, 2),
            (r'\bcicd\b', 6, 2),
            (r'\bseguridad\b', 4, 1),
            (r'\bsecurity\b', 4, 1),
            (r'\bcybersecurity\b', 8, 2),
            (r'\bciberseguridad\b', 8, 2),
            (r'\bpentester\b', 8, 2),
            (r'\bhacker\b', 6, 1),
            (r'\bnetworks\b', 6, 1),
            (r'\bredes\b', 4, 1),
        ],
        'Mobile': [
            (r'\bmobile\b', 8, 2),
            (r'\bmóvil\b', 8, 2),
            (r'\bmovil\b', 8, 2),
            (r'\bandroid\b', 10, 3),
            (r'\bios\b', 10, 3),
            (r'\bflutter\b', 10, 3),
            (r'\breact native\b', 10, 3),
            (r'\bkotlin\b', 8, 2),
            (r'\bswift\b', 8, 2),
            (r'\bxamarin\b', 8, 2),
            (r'\bionic\b', 8, 2),
        ]
    }
    
    scores = {cat: 0 for cat in categories_rules.keys()}
    
    # Calcular puntuaciones
    for cat, rules in categories_rules.items():
        for pattern, title_weight, desc_weight in rules:
            # Buscar en título
            if re.search(pattern, title_lower):
                scores[cat] += title_weight
            # Buscar en descripción
            if re.search(pattern, desc_lower):
                scores[cat] += desc_weight
                
    # Determinar categoría ganadora
    winner = 'Otros'
    max_score = 0
    for cat, score in scores.items():
        if score > max_score:
            max_score = score
            winner = cat
            
    # Caso especial: Si es Fullstack (tiene palabras de Frontend y Backend con similar peso)
    # O si explícitamente dice fullstack, decidimos por puntuación o por defecto a Backend
    if 'fullstack' in title_lower or 'full-stack' in title_lower:
        if max_score < 10:
            # Si no hay un ganador claro, lo asociamos a Backend como predeterminado para Fullstack
            winner = 'Backend'
            
    return winner
