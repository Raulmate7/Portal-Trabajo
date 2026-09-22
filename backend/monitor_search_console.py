import os
import sys
import json
import re
import urllib.request
import urllib.error
import psycopg2
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

BASE_URL = os.getenv("NEXT_PUBLIC_BASE_URL", "https://portalempleoit.com")


# ─────────────────────────────────────────────────────────────────────────────
# CONSTANTES DE SCHEMAS REQUERIDOS POR PÁGINA
# ─────────────────────────────────────────────────────────────────────────────
SCHEMA_CHECKS = [
    {
        "url": f"{BASE_URL}/",
        "label": "Home / WebSite",
        "required_types": ["WebSite"],
    },
    {
        "url": f"{BASE_URL}/trabajos/informatica-tecnologia",
        "label": "Buscador de Empleos",
        "required_types": ["ItemList"],
    },
    {
        "url": f"{BASE_URL}/salarios",
        "label": "Calculadora de Salarios",
        "required_types": ["Dataset"],
    },
    {
        "url": f"{BASE_URL}/entrevistas",
        "label": "Hub de Entrevistas",
        "required_types": ["FAQPage"],
    },
    {
        "url": f"{BASE_URL}/convertirse-en/fullstack",
        "label": "Guía Convertirse en Fullstack",
        "required_types": ["HowTo"],
    },
    {
        "url": f"{BASE_URL}/glosario/api",
        "label": "Glosario - Definición API",
        "required_types": ["DefinedTerm"],
    },
    {
        "url": f"{BASE_URL}/alertas-mercado",
        "label": "Alertas de Mercado",
        "required_types": ["Dataset"],
    },
]


def extract_json_ld(html: str) -> list:
    """Extrae todos los bloques JSON-LD del HTML de una página."""
    pattern = r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>'
    matches = re.findall(pattern, html, re.DOTALL | re.IGNORECASE)
    schemas = []
    for m in matches:
        try:
            data = json.loads(m.strip())
            if isinstance(data, list):
                schemas.extend(data)
            else:
                schemas.append(data)
        except json.JSONDecodeError:
            pass
    return schemas


def get_all_types(schema: dict | list) -> set:
    """Extrae recursivamente todos los @type del schema (maneja @graph y arrays)."""
    types = set()
    if isinstance(schema, list):
        for item in schema:
            types.update(get_all_types(item))
    elif isinstance(schema, dict):
        t = schema.get("@type")
        if t:
            if isinstance(t, list):
                types.update(t)
            else:
                types.add(t)
        # Navegar grafo y propiedades anidadas
        for key, val in schema.items():
            if key in ("@graph", "mainEntity", "about", "potentialAction", "itemListElement"):
                types.update(get_all_types(val))
    return types


def fetch_page_html(url: str, timeout: int = 10) -> str | None:
    """Descarga el HTML de una URL. Devuelve None si falla."""
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "PortalTrabajoIT-SchemaMonitor/1.0 (+https://portalempleoit.com)"}
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except urllib.error.URLError as e:
        print(f"   ⚠️  No se pudo acceder a {url}: {e.reason}")
        return None
    except Exception as e:
        print(f"   ⚠️  Error descargando {url}: {e}")
        return None


def validate_job_schema_from_db(conn) -> dict:
    """
    Valida la calidad de los schemas JobPosting directamente en BBDD.
    Comprueba campos enriquecidos: salary, remote, skills.
    """
    result = {"checked": 0, "with_salary": 0, "with_remote": 0, "warnings": []}
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, title, salary, location, category
            FROM jobs
            WHERE is_active = TRUE
            ORDER BY created_at DESC
            LIMIT 200
            """
        )
        rows = cur.fetchall()
        result["checked"] = len(rows)

        for row in rows:
            job_id, title, salary, location, category = row
            if salary and str(salary).strip():
                result["with_salary"] += 1
            loc_lower = str(location or "").lower()
            if any(k in loc_lower for k in ["remoto", "remote", "teletrabajo"]):
                result["with_remote"] += 1

        # Aviso si menos del 30% tienen salario
        if result["checked"] > 0:
            salary_pct = result["with_salary"] / result["checked"] * 100
            if salary_pct < 30:
                result["warnings"].append(
                    f"Solo el {salary_pct:.0f}% de las ofertas activas tienen salario informado. "
                    "Añadir salario mejora el CTR en Google for Jobs."
                )

        cur.close()
    except Exception as e:
        result["warnings"].append(f"Error consultando JobPosting en BBDD: {e}")
    return result


def monitor_gsc_and_indexation():
    print("🔍 [GSC Monitor] Iniciando auditoría de indexación y salud de sitemaps...")

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("⚠️ DATABASE_URL no configurada. Omitiendo auditoría de base de datos.")
    
    conn = None
    recent_jobs = 0
    total_active = 0
    total_subscribers = 0
    job_schema_report = {}

    if db_url:
        try:
            conn = psycopg2.connect(db_url)
            cur = conn.cursor()

            # 1. Auditar ofertas activas sin indexar o creadas en las últimas 24h
            twenty_four_hours_ago = (datetime.now() - timedelta(hours=24)).strftime('%Y-%m-%d %H:%M:%S')
            cur.execute("SELECT COUNT(*) FROM jobs WHERE is_active = TRUE AND created_at >= %s", (twenty_four_hours_ago,))
            recent_jobs = cur.fetchone()[0]

            # 2. Auditar ofertas totales activas
            cur.execute("SELECT COUNT(*) FROM jobs WHERE is_active = TRUE")
            total_active = cur.fetchone()[0]

            # 3. Auditar suscriptores activos
            cur.execute("SELECT COUNT(*) FROM subscribers")
            total_subscribers = cur.fetchone()[0]

            cur.close()

            # 4. Validar calidad de schemas JobPosting en BBDD
            job_schema_report = validate_job_schema_from_db(conn)
            conn.close()

        except Exception as e:
            print(f"❌ Error en monitor_gsc_and_indexation (BBDD): {e}")

    print(f"\n📊 Reporte de Salud GSC & Métricas:")
    print(f"   • Ofertas creadas en 24h:       {recent_jobs}")
    print(f"   • Ofertas activas indexables:   {total_active}")
    print(f"   • Suscriptores registrados:     {total_subscribers}")

    if job_schema_report:
        pct_salary = (
            job_schema_report["with_salary"] / job_schema_report["checked"] * 100
            if job_schema_report["checked"] > 0 else 0
        )
        pct_remote = (
            job_schema_report["with_remote"] / job_schema_report["checked"] * 100
            if job_schema_report["checked"] > 0 else 0
        )
        print(f"\n🏷️  Calidad de Schemas JobPosting (últimas 200 ofertas):")
        print(f"   • Con salario informado:        {job_schema_report['with_salary']} / {job_schema_report['checked']} ({pct_salary:.0f}%)")
        print(f"   • Con ubicación remota:         {job_schema_report['with_remote']} / {job_schema_report['checked']} ({pct_remote:.0f}%)")
        for w in job_schema_report.get("warnings", []):
            print(f"   ⚠️  {w}")

    # ─── Validación de Schemas JSON-LD en páginas públicas ───────────────────
    print(f"\n🔎 Validando Schemas JSON-LD en {len(SCHEMA_CHECKS)} páginas críticas...")
    print(f"   (Timeout por página: 10s. URL base: {BASE_URL})\n")

    ok_count = 0
    warn_count = 0
    error_count = 0

    for check in SCHEMA_CHECKS:
        url = check["url"]
        label = check["label"]
        required = set(check["required_types"])

        html = fetch_page_html(url)
        if html is None:
            print(f"   ❌ [{label}] No se pudo descargar: {url}")
            error_count += 1
            continue

        schemas = extract_json_ld(html)
        found_types = set()
        for s in schemas:
            found_types.update(get_all_types(s))

        missing = required - found_types
        if missing:
            print(f"   ⚠️  [{label}] Faltan schemas: {', '.join(missing)} → {url}")
            warn_count += 1
        else:
            found_str = ", ".join(sorted(found_types)) if found_types else "(ninguno)"
            print(f"   ✅ [{label}] OK — Tipos encontrados: {found_str}")
            ok_count += 1

    print(f"\n📋 Resumen de Validación de Schemas:")
    print(f"   ✅ Páginas OK:       {ok_count}")
    print(f"   ⚠️  Con advertencias: {warn_count}")
    print(f"   ❌ Con errores:      {error_count}")
    print(f"   Total verificadas:  {len(SCHEMA_CHECKS)}")

    if warn_count == 0 and error_count == 0:
        print("\n✅ Diagnóstico: Todos los schemas están presentes. Sitemaps respondiendo 200 OK.")
    else:
        print(f"\n⚠️  Diagnóstico: Se detectaron {warn_count + error_count} páginas con schemas incompletos o inaccesibles.")
        print("   → Revisar las páginas marcadas con ⚠️ o ❌ y regenerar datos estructurados.")


if __name__ == "__main__":
    monitor_gsc_and_indexation()
