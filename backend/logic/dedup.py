import hashlib
import re
import unicodedata

COMPANY_SUFFIXES_RE = re.compile(
    r'\b(s\.?l\.?u?\.?|s\.?a\.?|inc\.?|ltd\.?|llc|gmbh|corp\.?|technologies|technology|tech|spain|iberia)\b',
    re.IGNORECASE,
)


def _strip_accents(text: str) -> str:
    return ''.join(
        c for c in unicodedata.normalize('NFKD', text or '')
        if not unicodedata.combining(c)
    )


def normalize_company(company: str) -> str:
    s = _strip_accents(company).lower()
    s = COMPANY_SUFFIXES_RE.sub(' ', s)
    s = re.sub(r'[^a-z0-9]+', ' ', s).strip()
    return s


def normalize_title_core(title: str) -> str:
    s = _strip_accents(title).lower()
    s = re.sub(r'\([^)]*\)', ' ', s)
    s = re.sub(r'[^a-z0-9+#]+', ' ', s).strip()
    return s


def compute_dedup_hash(company: str, title: str, work_mode: str = '') -> str:
    """Genera un hash SHA-256 canónico para deduplicación multi-fuente (FUNC-019)."""
    canon = f"{normalize_company(company)}|{normalize_title_core(title)}|{(work_mode or '').lower().strip()}"
    return hashlib.sha256(canon.encode('utf-8')).hexdigest()


def token_jaccard_similarity(a: str, b: str) -> float:
    ta = set(normalize_title_core(a).split())
    tb = set(normalize_title_core(b).split())
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / len(ta | tb)
