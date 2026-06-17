import re

def parse_salary(salary_str: str):
    """
    Parsea una cadena de texto de salario y extrae:
    (salary_min, salary_max, salary_currency)
    Si no detecta números o no puede parsearlo, devuelve (None, None, 'EUR')
    """
    if not salary_str or not salary_str.strip() or salary_str.lower() in ['consultar', 'sin especificar']:
        return None, None, 'EUR'
        
    try:
        # Convertir a minúsculas y quitar puntos y espacios
        clean_str = salary_str.lower().replace('.', '').replace(' ', '')
        
        # Detectar moneda
        currency = 'EUR'
        if any(x in clean_str for x in ['$', 'usd', 'dólar', 'dolar', 'dollar']):
            currency = 'USD'
        elif any(x in clean_str for x in ['£', 'gbp', 'libra', 'pound']):
            currency = 'GBP'
            
        # Detectar sufijo 'k' (ej. 50k -> 50000)
        clean_str = re.sub(r'(\d+)k', r'\g<1>000', clean_str)
        
        # Extraer todos los números consecutivos
        numbers = [int(n) for n in re.findall(r'\d+', clean_str)]
        
        if not numbers:
            return None, None, currency
            
        # Determinar si es mensual
        # Generalmente salarios menores a 6000 que no tengan indicación de año se tratan como mensuales
        is_monthly = 'mes' in clean_str or 'mensual' in clean_str or (numbers[0] > 0 and numbers[0] < 6000)
        
        # Convertir a anual si es mensual
        multiplier = 12 if is_monthly else 1
        
        if len(numbers) >= 2:
            val_min = min(numbers[0], numbers[1]) * multiplier
            val_max = max(numbers[0], numbers[1]) * multiplier
        else:
            val_min = numbers[0] * multiplier
            val_max = val_min
            
        # Filtrar valores atípicos imposibles (ej. IDs)
        if val_min is not None and (val_min < 5000 or val_min > 500000):
            val_min = None
        if val_max is not None and (val_max < 5000 or val_max > 500000):
            val_max = None
            
        return val_min, val_max, currency
        
    except Exception as e:
        print(f"⚠️ Error parsing salary '{salary_str}': {e}")
        return None, None, 'EUR'

def extract_salary_from_text(text: str):
    """
    Intenta extraer rango o valor de salario a partir de un texto (como description_snippet)
    si el salario es 'Consultar' o no está disponible.
    Devuelve (val_min, val_max, currency, salary_raw_extracted) o (None, None, 'EUR', None)
    """
    if not text:
        return None, None, 'EUR', None
        
    # Limpiar saltos de línea y normalizar espacios
    clean_text = text.replace('\n', ' ').replace('\r', ' ')
    
    # Expresiones regulares comunes en español/inglés:
    # 1. Rango de miles con €/dólares/libras: ej. 30.000 - 45.000 €
    # 2. Rango con k: ej. 30k - 45k
    # 3. Salario mensual: ej. 2.500 €/mes
    # 4. Salario anual único: ej. 35.000 €/año
    # 5. Salario anual simple con moneda: 35.000 €
    patterns = [
        r'\b\d{2}[.,]\d{3}\s*(?:€|euros?|\$|usd|£|gbp|dólares|dolares|dollars)?\s*(?:-|a|to)\s*\d{2}[.,]\d{3}\s*(?:€|euros?|\$|usd|£|gbp|dólares|dolares|dollars)?',
        r'\b\d{2,3}\s*k\s*(?:-|a|to)\s*\d{2,3}\s*k\s*(?:€|euros?|\$|usd|£|gbp|dólares|dolares|dollars)?',
        r'\b\d{1}[.,]\d{3}\s*(?:€|euros?|\$|usd|£|gbp|dólares|dolares|dollars)?\s*(?:/|al?|per)\s*(?:mes|mensual|month|monthly)\b',
        r'\b\d{2}[.,]\d{3}\s*(?:€|euros?|\$|usd|£|gbp|dólares|dolares|dollars)?\s*(?:/|al?|per)\s*(?:año|anual|year|yearly)\b',
        r'\b\d{2}[.,]\d{3}\s*(?:€|euros?|\$|usd|£|gbp|dólares|dolares|dollars)'
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, clean_text, re.IGNORECASE)
        for match in matches:
            val_min, val_max, currency = parse_salary(match)
            if val_min is not None or val_max is not None:
                return val_min, val_max, currency, match.strip()
                
    return None, None, 'EUR', None

if __name__ == '__main__':
    test_cases = [
        "30.000€ - 40.000€",
        "$50k - $70k",
        "45000 EUR",
        "2.500 € al mes",
        "Consultar",
        "35000"
    ]
    for case in test_cases:
        print(f"'{case}' -> {parse_salary(case)}")
