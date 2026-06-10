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
        if '$' in clean_str or 'usd' in clean_str:
            currency = 'USD'
        elif '£' in clean_str or 'gbp' in clean_str:
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
