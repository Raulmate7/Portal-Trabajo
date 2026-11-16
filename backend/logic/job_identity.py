"""Utilidades de identidad de ofertas para inserciones en `jobs` (BUG-001/005/007).

`jobs.id` es VARCHAR(255) PRIMARY KEY sin DEFAULT, por lo que toda inserción
desde Python debe generar el id de forma explícita.
"""
import re
import uuid

_REMOTE_RE = re.compile(
    r'\b(remot[eo]|teletrabajo|100\s*%\s*remot[eo]|work\s*from\s*home|wfh|anywhere|fully\s*remote)\b',
    re.IGNORECASE,
)
_HYBRID_RE = re.compile(r'\b(h[ií]brid[oa]|hybrid)\b', re.IGNORECASE)
_ONSITE_RE = re.compile(r'\b(presencial|on[\s-]?site|in[\s-]?office)\b', re.IGNORECASE)


def new_job_id() -> str:
    """UUIDv4 como cadena de 36 caracteres (mismo formato que el frontend)."""
    return str(uuid.uuid4())


def infer_work_mode(title: str = '', location: str = '', description: str = ''):
    """Devuelve 'remote' | 'hybrid' | 'onsite' | None (valores del ENUM de `jobs.work_mode`).

    Prioridad: híbrido > remoto > presencial explícito. Si no hay señal clara se
    devuelve None (columna NULL) en lugar de adivinar.
    """
    text = f"{title or ''} {location or ''} {(description or '')[:600]}"
    if _HYBRID_RE.search(text):
        return 'hybrid'
    if _REMOTE_RE.search(text):
        return 'remote'
    if _ONSITE_RE.search(text):
        return 'onsite'
    return None
