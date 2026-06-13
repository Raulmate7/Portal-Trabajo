import re
from deep_translator import GoogleTranslator

def translate_text(text: str, target_lang: str = 'es') -> str:
    """
    Traduce un texto al idioma destino usando el endpoint gratuito de Google Translate.
    Si hay algún error, devuelve el texto original como salvaguarda.
    """
    if not text or not text.strip():
        return text

    # Proteger marcas de tecnología para evitar traducciones literales incorrectas
    protected_words = ['React', 'Spring', 'Rust', 'Go', 'Docker', 'Kubernetes', 'Node.js', 'NodeJS', 'Next.js', 'NextJS', 'Svelte', 'Vue', 'Angular', 'Python']
    replacements = {}
    temp_text = text
    
    try:
        for i, word in enumerate(protected_words):
            pattern = r'\b' + re.escape(word) + r'\b'
            if re.search(pattern, temp_text, re.IGNORECASE):
                placeholder = f"PROTTECH{i}ZZ"
                matches = re.findall(pattern, temp_text, re.IGNORECASE)
                if matches:
                    replacements[placeholder] = matches[0]
                    temp_text = re.sub(pattern, placeholder, temp_text)
    except Exception as e:
        print(f"⚠️ Error protegiendo palabras clave: {e}")
        temp_text = text
    
    try:
        translated = GoogleTranslator(source='auto', target=target_lang).translate(temp_text)
        if translated:
            # Restaurar palabras protegidas con su caso original
            for placeholder, original_word in replacements.items():
                translated = re.sub(re.escape(placeholder), original_word, translated, flags=re.IGNORECASE)
            return translated
    except Exception as e:
        print(f"⚠️ Error en traducción automática con deep-translator: {e}")
        
    return text

if __name__ == "__main__":
    test_en = "React Software Engineer (Remote - Europe)"
    test_es = translate_text(test_en)
    print(f"Original: {test_en}")
    print(f"Traducido: {test_es}")
