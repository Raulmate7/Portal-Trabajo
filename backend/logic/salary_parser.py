import re

FX_TO_EUR = {
    'EUR': 1.0,
    'USD': 0.92,
    'GBP': 1.17,
}


def _normalize_numeric_tokens(raw: str) -> list:
    """Normaliza formatos europeos ('3.200,50', '45,5k', '45k') a enteros."""
    s = raw.lower().strip()
    # Convertir separador decimal europeo seguido de 2 dígitos (,50) a punto o descartar céntimos cuando no lleva 'k'
    s = re.sub(r'(\d+)[.,](\d{1,2})\s*k\b', lambda m: str(int(float(f"{m.group(1)}.{m.group(2)}") * 1000)), s)
    s = re.sub(r'(\d+)\s*k\b', r'\g<1>000', s)
    # Quitar céntimos decimales (,50 / .50 al final de un número)
    s = re.sub(r'(?<=\d)[.,]\d{2}(?!\d)', '', s)
    # Quitar separadores de miles (. o , entre bloques de 3 dígitos)
    s = re.sub(r'(?<=\d)[.,](?=\d{3}\b)', '', s)
    return [int(n) for n in re.findall(r'\d+', s)]


def parse_salary(salary_str: str):
    """
    Parsea una cadena de texto de salario y extrae:
    (salary_min, salary_max, salary_currency)
    Si no detecta números o no puede parsearlo, devuelve (None, None, 'EUR')
    """
    if not salary_str or not salary_str.strip() or salary_str.lower().strip() in ['consultar', 'sin especificar']:
        return None, None, 'EUR'

    try:
        clean_str = salary_str.lower()

        # Detectar moneda
        currency = 'EUR'
        if any(x in clean_str for x in ['$', 'usd', 'dólar', 'dolar', 'dollar']):
            currency = 'USD'
        elif any(x in clean_str for x in ['£', 'gbp', 'libra', 'pound']):
            currency = 'GBP'

        numbers = _normalize_numeric_tokens(clean_str)
        if not numbers:
            return None, None, currency

        is_hourly = any(x in clean_str for x in ['/h', 'por hora', 'per hour', 'hourly', '/hora'])
        is_monthly = (not is_hourly) and (
            any(x in clean_str for x in ['mes', 'mensual', 'month', 'monthly', '/m'])
            or (numbers[0] > 0 and numbers[0] < 6000)
        )

        if is_hourly:
            multiplier = 1760
        elif is_monthly:
            multiplier = 12
        else:
            multiplier = 1

        if len(numbers) >= 2:
            val_min = min(numbers[0], numbers[1]) * multiplier
            val_max = max(numbers[0], numbers[1]) * multiplier
        else:
            val_min = numbers[0] * multiplier
            val_max = val_min

        if val_min is not None and (val_min < 5000 or val_min > 500000):
            val_min = None
        if val_max is not None and (val_max < 5000 or val_max > 500000):
            val_max = None

        return val_min, val_max, currency

    except Exception as e:
        print(f"⚠️ Error parsing salary '{salary_str}': {e}")
        return None, None, 'EUR'


def parse_salary_eur(salary_str: str):
    """Devuelve (salary_min_eur, salary_max_eur, source_currency) normalizados a EUR anuales (FUNC-010)."""
    val_min, val_max, currency = parse_salary(salary_str)
    rate = FX_TO_EUR.get(currency, 1.0)
    min_eur = int(round(val_min * rate)) if val_min is not None else None
    max_eur = int(round(val_max * rate)) if val_max is not None else None
    return min_eur, max_eur, currency

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
        r'\b\d{2}[.,]\d{3}\s*(?:€|euros?|\$|usd|£|gbp|dólares|dolares|dollars)?\s*(?:-|a|to|y|hasta)\s*\d{2}[.,]\d{3}\s*(?:€|euros?|\$|usd|£|gbp|dólares|dolares|dollars)?',
        r'\b\d{2,3}\s*k\s*(?:-|a|to|y|hasta)\s*\d{2,3}\s*k\s*(?:€|euros?|\$|usd|£|gbp|dólares|dolares|dollars)?',
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
