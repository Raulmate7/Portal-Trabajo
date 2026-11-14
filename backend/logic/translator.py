import concurrent.futures
import re
import time
from deep_translator import GoogleTranslator

_CONSECUTIVE_FAILURES = 0
_CIRCUIT_OPEN_UNTIL = 0.0
_MAX_FAILURES = 3
_COOLDOWN_SECONDS = 300
_TRANSLATE_TIMEOUT_SECONDS = 8.0
_HTML_OR_BLOCK_MARKERS = ("<html", "<!doctype", "<script", "captcha", "too many requests", "429 error")


def _is_valid_translation(original: str, translated: str) -> bool:
    if not translated or not isinstance(translated, str):
        return False
    lower = translated.lower()
    if any(marker in lower for marker in _HTML_OR_BLOCK_MARKERS):
        return False
    max_len = max(500, len(original) * 4)
    if len(translated) > max_len:
        return False
    return True


def translate_text(text: str, target_lang: str = 'es') -> str:
    """
    Traduce un texto al idioma destino con timeout estricto, circuit breaker y validación anti-HTML (SEC-048).
    Si hay algún error o el circuito está abierto, devuelve el texto original como salvaguarda.
    """
    global _CONSECUTIVE_FAILURES, _CIRCUIT_OPEN_UNTIL

    if not text or not text.strip():
        return text

    now = time.monotonic()
    if now < _CIRCUIT_OPEN_UNTIL:
        return text

    # Proteger marcas y términos técnicos IT para evitar traducciones literales incorrectas (SEO-040)
    protected_words = [
        'React', 'Spring', 'Rust', 'Go', 'Golang', 'Docker', 'Kubernetes', 'Node.js', 'NodeJS',
        'Next.js', 'NextJS', 'Svelte', 'Vue', 'Angular', 'Python', 'TypeScript', 'JavaScript',
        'Java', 'DevOps', 'Full Stack', 'Fullstack', 'Backend', 'Frontend', 'Cloud', 'AWS',
        'GCP', 'Azure', 'Flutter', 'Django', 'FastAPI', 'Laravel', 'GraphQL', 'PostgreSQL',
        'MySQL', 'Redis', 'Terraform', 'SRE', 'MLOps', 'LLM',
    ]
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
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(GoogleTranslator(source='auto', target=target_lang).translate, temp_text)
            translated = future.result(timeout=_TRANSLATE_TIMEOUT_SECONDS)

        if _is_valid_translation(temp_text, translated):
            _CONSECUTIVE_FAILURES = 0
            for placeholder, original_word in replacements.items():
                translated = re.sub(re.escape(placeholder), original_word, translated, flags=re.IGNORECASE)
            return translated

        raise ValueError("Respuesta de traducción inválida o sospechosa")
    except Exception as e:
        _CONSECUTIVE_FAILURES += 1
        if _CONSECUTIVE_FAILURES >= _MAX_FAILURES:
            _CIRCUIT_OPEN_UNTIL = time.monotonic() + _COOLDOWN_SECONDS
            print(f"⚠️ Circuit breaker de traducción abierto durante {_COOLDOWN_SECONDS}s tras {_CONSECUTIVE_FAILURES} fallos: {e}")
        else:
            print(f"⚠️ Error en traducción automática con deep-translator: {e}")

    return text


if __name__ == "__main__":
    test_en = "React Software Engineer (Remote - Europe)"
    test_es = translate_text(test_en)
    print(f"Original: {test_en}")
    print(f"Traducido: {test_es}")
