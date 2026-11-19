#!/usr/bin/env python3
"""
Precalcula métricas SEO programáticas en `seo_category_metrics` y normaliza
`normalized_city`, `seniority_level` y `skills_json` en `jobs`.
Diseñado para ejecutarse tras los scrapers en `run_all.py`.
"""

import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from dotenv import load_dotenv
from db_helper import get_db_connection
from logic.slug import slugify

load_dotenv()

TECH_PATTERNS = {
    "react": r"\breact(?:\.js|js)?\b",
    "angular": r"\bangular\b",
    "vue": r"\bvue(?:\.js|js)?\b",
    "node": r"\bnode(?:\.js|js)?\b",
    "python": r"\bpython\b",
    "java": r"\bjava\b",
    "php": r"\bphp\b",
    "csharp": r"(?:\bc#|c-sharp|csharp|\.net)\b",
    "ruby": r"\bruby\b",
    "go": r"\b(?:golang|go\s+developer|go\s+engineer)\b",
    "javascript": r"\bjavascript\b",
    "typescript": r"\btypescript\b",
    "aws": r"\baws\b",
    "docker": r"\bdocker\b",
    "kubernetes": r"\b(?:kubernetes|k8s)\b",
    "nextjs": r"\bnext(?:\.js|js)\b",
    "flutter": r"\bflutter\b",
    "kotlin": r"\bkotlin\b",
    "swift": r"\bswift\b",
    "sql": r"\bsql\b",
    "salesforce": r"\bsalesforce\b",
    "cybersecurity": r"\b(?:cybersecurity|ciberseguridad|pentesting|soc)\b",
    "rust": r"\brust\b",
    "scala": r"\bscala\b",
    "elixir": r"\belixir\b",
    "terraform": r"\bterraform\b",
    "graphql": r"\bgraphql\b",
    "redis": r"\bredis\b",
    "mongodb": r"\bmongodb\b",
    "django": r"\bdjango\b",
    "fastapi": r"\bfastapi\b",
    "spring-boot": r"\bspring\s*boot\b",
    "laravel": r"\blaravel\b",
    "spark": r"\bspark\b",
    "kafka": r"\bkafka\b",
    "linux": r"\blinux\b",
    "azure": r"\bazure\b",
    "gcp": r"\b(?:gcp|google\s+cloud)\b",
    "jenkins": r"\bjenkins\b",
    "ansible": r"\bansible\b",
    "devops": r"\b(?:devops|site\s+reliability|sre)\b",
    "fullstack": r"\b(?:fullstack|full\s*stack|full-stack)\b",
    "qa-engineer": r"\b(?:qa|tester|test\s+engineer|calidad)\b",
    "data-analyst": r"\b(?:data\s+analyst|analista\s+de\s+datos)\b",
    "product-manager": r"\bproduct\s+manager\b",
    "scrum-master": r"\bscrum\s+master\b",
    "ux-designer": r"\b(?:ux\s+designer|dise[ñn]ador\s+ux)\b",
}

COMPILED_TECHS = {k: re.compile(v, re.IGNORECASE) for k, v in TECH_PATTERNS.items()}

CITY_PATTERNS = [
    ("remoto", re.compile(r"\b(?:remoto|teletrabajo|remote|worldwide)\b", re.IGNORECASE)),
    ("madrid", re.compile(r"\bmadrid\b", re.IGNORECASE)),
    ("barcelona", re.compile(r"\b(?:barcelona|bcn)\b", re.IGNORECASE)),
    ("valencia", re.compile(r"\bvalencia\b", re.IGNORECASE)),
    ("malaga", re.compile(r"\bm[aá]laga\b", re.IGNORECASE)),
    ("sevilla", re.compile(r"\bsevilla\b", re.IGNORECASE)),
    ("bilbao", re.compile(r"\b(?:bilbao|bizkaia|vizcaya)\b", re.IGNORECASE)),
    ("zaragoza", re.compile(r"\bzaragoza\b", re.IGNORECASE)),
    ("alicante", re.compile(r"\balicante\b", re.IGNORECASE)),
    ("murcia", re.compile(r"\bmurcia\b", re.IGNORECASE)),
    ("vigo", re.compile(r"\bvigo\b", re.IGNORECASE)),
    ("coruna", re.compile(r"\bcoru[nñ]a\b", re.IGNORECASE)),
    ("granada", re.compile(r"\bgranada\b", re.IGNORECASE)),
    ("san-sebastian", re.compile(r"\b(?:san\s+sebasti[aá]n|donostia)\b", re.IGNORECASE)),
    ("pamplona", re.compile(r"\bpamplona\b", re.IGNORECASE)),
    ("valladolid", re.compile(r"\bvalladolid\b", re.IGNORECASE)),
    ("santander", re.compile(r"\bsantander\b", re.IGNORECASE)),
    ("palma", re.compile(r"\b(?:palma|mallorca)\b", re.IGNORECASE)),
    ("las-palmas", re.compile(r"\blas\s+palmas\b", re.IGNORECASE)),
    ("oviedo", re.compile(r"\boviedo\b", re.IGNORECASE)),
    ("gijon", re.compile(r"\bgij[oó]n\b", re.IGNORECASE)),
]

FX_TO_EUR = {"EUR": 1.0, "USD": 0.92, "GBP": 1.17}


def detect_techs(title: str, category: str | None, snippet: str | None) -> list[str]:
    text = f"{title or ''} {snippet or ''}"
    found = [slug for slug, rx in COMPILED_TECHS.items() if rx.search(text)]
    if category == "Backend":
        found.append("backend")
    elif category == "Frontend":
        found.append("frontend")
    elif category in ("Data & AI", "Data"):
        found.append("data")
    elif category in ("Cloud & DevOps", "Cloud"):
        found.append("cloud")
    elif category == "Mobile":
        found.append("mobile")
    return list(dict.fromkeys(found))


def detect_city(location: str | None) -> str | None:
    if not location:
        return None
    for city_slug, rx in CITY_PATTERNS:
        if rx.search(location):
            return city_slug
    return None


def detect_seniority(title: str, snippet: str | None) -> str:
    t = f"{title or ''} {(snippet or '')[:200]}".lower()
    if any(k in t for k in ("lead", "principal", "staff", "architect", "arquitecto")):
        return "lead"
    if any(k in t for k in ("senior", " sr ", "sr.")):
        return "senior"
    if any(k in t for k in ("junior", " jr ", "jr.", "trainee", "becario", "prácticas", "practicas", "sin experiencia")):
        return "junior"
    return "mid"


def detect_work_mode(title: str, location: str | None, snippet: str | None, current_mode: str | None) -> str:
    if current_mode in ("remote", "hybrid", "onsite"):
        return current_mode
    txt = f"{title or ''} {location or ''} {(snippet or '')[:300]}".lower()
    if any(k in txt for k in ("híbrido", "hibrido", "hybrid", "semipresencial", "semi-presencial")):
        return "hybrid"
    if any(k in txt for k in ("remoto", "remote", "teletrabajo", "worldwide")):
        return "remote"
    return "onsite"


def extract_annual_eur(salary_min, salary_max, salary_currency, salary_str) -> int | None:
    rate = FX_TO_EUR.get(str(salary_currency or "EUR").upper(), 1.0)
    try:
        s_min = float(salary_min) if salary_min is not None else None
        s_max = float(salary_max) if salary_max is not None else None
        if s_min and s_max:
            val = ((s_min + s_max) / 2.0) * rate
        elif s_min:
            val = s_min * rate
        elif s_max:
            val = s_max * rate
        else:
            val = None
        if val and 12000 <= val <= 180000:
            return int(round(val))
    except (ValueError, TypeError):
        pass

    if not salary_str:
        return None
    s = str(salary_str).lower().strip()
    if not s or s in ("consultar", "sin especificar"):
        return None
    curr_rate = 0.92 if any(k in s for k in ("$", "usd", "dollar")) else (1.17 if any(k in s for k in ("£", "gbp")) else 1.0)
    s = re.sub(r"(\d+)[.,](\d{1,2})\s*k\b", lambda m: str(int(round(float(f"{m.group(1)}.{m.group(2)}") * 1000))), s)
    s = re.sub(r"(\d+)\s*k\b", r"\1000", s)
    s = re.sub(r"(?<=\d)[.,](?=\d{3}\b)", "", s)
    nums = [int(n) for n in re.findall(r"\d+", s) if int(n) > 0]
    if not nums:
        return None
    val = sum(nums[:2]) / min(len(nums), 2)
    if any(k in s for k in ("/h", "por hora", "hourly")):
        val *= 1760
    elif any(k in s for k in ("mes", "mensual", "monthly", "/m")) or val < 6000:
        val *= 12
    val *= curr_rate
    return int(round(val)) if 12000 <= val <= 180000 else None


def build_metrics():
    print("📊 [SEO Metrics] Calculando métricas pSEO desde MySQL...")
    conn = get_db_connection()
    cur = conn.cursor()

    cutoff_180d = datetime.now() - timedelta(days=180)
    cutoff_72h = datetime.now() - timedelta(hours=72)

    cur.execute("""
        SELECT id, title, company, location, category, salary, salary_min, salary_max,
               salary_currency, work_mode, is_active, created_at, LEFT(description_snippet, 400),
               normalized_city, seniority_level
        FROM jobs
        WHERE created_at >= %s OR is_active = TRUE
    """, (cutoff_180d,))
    rows = cur.fetchall()

    # Buckets por clave de segmento
    buckets = defaultdict(lambda: {
        "route_type": "jobs_sector",
        "tech_slug": None,
        "city_slug": None,
        "seniority_slug": None,
        "active_count": 0,
        "new_72h_count": 0,
        "historical_180d_count": 0,
        "salaries": [],
        "modes": Counter(),
        "companies": defaultdict(lambda: {"count": 0, "salaries": []}),
        "co_skills": Counter(),
        "last_job_created_at": None,
    })

    backfill_updates = []

    for row in rows:
        (job_id, title, company, location, category, salary_str, s_min, s_max,
         s_curr, raw_mode, is_active, created_at, snippet, norm_city, sen_level) = row

        techs = detect_techs(title, category, snippet)
        city = norm_city or detect_city(location)
        seniority = sen_level or detect_seniority(title, snippet)
        mode = detect_work_mode(title, location, snippet, raw_mode)
        annual_eur = extract_annual_eur(s_min, s_max, s_curr, salary_str)

        if (norm_city is None and city) or sen_level is None:
            backfill_updates.append((city, seniority, json.dumps(techs[:10]), job_id))

        is_act = bool(is_active)
        is_72h = bool(is_act and created_at and created_at >= cutoff_72h)

        def add_to_bucket(key: str, rtype: str, t_slug: str | None, c_slug: str | None, s_slug: str | None):
            b = buckets[key]
            b["route_type"] = rtype
            b["tech_slug"] = t_slug
            b["city_slug"] = c_slug
            b["seniority_slug"] = s_slug
            b["historical_180d_count"] += 1
            if is_act:
                b["active_count"] += 1
                b["modes"][mode] += 1
                if created_at and (b["last_job_created_at"] is None or created_at > b["last_job_created_at"]):
                    b["last_job_created_at"] = created_at
                if company and company != "Desconocida":
                    b["companies"][company]["count"] += 1
                    if annual_eur:
                        b["companies"][company]["salaries"].append(annual_eur)
                for sk in techs:
                    if sk != t_slug:
                        b["co_skills"][sk] += 1
            if is_72h:
                b["new_72h_count"] += 1
            if annual_eur:
                b["salaries"].append(annual_eur)

        if city:
            add_to_bucket(f"city:{city}", "city_hub", None, city, None)

        for tech in techs:
            add_to_bucket(tech, "jobs_sector", tech, None, None)
            add_to_bucket(f"salarios:{tech}", "salary", tech, None, None)
            if city:
                sector_key = f"{tech}-remoto" if city == "remoto" else f"{tech}-en-{city}"
                add_to_bucket(sector_key, "jobs_sector", tech, city, None)
                add_to_bucket(f"salarios:{tech}:{city}", "salary", tech, city, None)
                add_to_bucket(f"salarios:{tech}:{city}:{seniority}", "salary", tech, city, seniority)

    # Backfill ligero de columnas normalizadas en jobs
    if backfill_updates:
        cur.executemany(
            "UPDATE jobs SET normalized_city = COALESCE(normalized_city, %s), seniority_level = COALESCE(seniority_level, %s), skills_json = COALESCE(skills_json, %s) WHERE id = %s",
            backfill_updates[:2000],
        )

    upsert_rows = []
    for slug, b in buckets.items():
        sals = sorted(b["salaries"])
        n_sal = len(sals)
        sal_avg = int(round(sum(sals) / n_sal)) if n_sal else None
        sal_med = sals[n_sal // 2] if n_sal else None
        sal_p25 = sals[int(n_sal * 0.25)] if n_sal else None
        sal_p75 = sals[int(n_sal * 0.75)] if n_sal else None
        sal_min_obs = sals[0] if n_sal else None
        sal_max_obs = sals[-1] if n_sal else None

        act = b["active_count"]
        remote_pct = int(round((b["modes"]["remote"] / act) * 100)) if act else 0
        hybrid_pct = int(round((b["modes"]["hybrid"] / act) * 100)) if act else 0
        onsite_pct = max(0, 100 - remote_pct - hybrid_pct) if act else 0

        top_companies = []
        for comp_name, cdata in sorted(b["companies"].items(), key=lambda x: x[1]["count"], reverse=True)[:5]:
            c_sals = cdata["salaries"]
            top_companies.append({
                "name": comp_name,
                "slug": slugify(comp_name),
                "count": cdata["count"],
                "avgSalary": int(round(sum(c_sals) / len(c_sals))) if c_sals else None,
            })

        related_skills = []
        if act > 0:
            for sk, cnt in b["co_skills"].most_common(6):
                related_skills.append({
                    "skill": sk,
                    "slug": sk,
                    "pct": min(100, int(round((cnt / act) * 100))),
                })

        upsert_rows.append((
            slug[:180],
            b["route_type"],
            b["tech_slug"],
            b["city_slug"],
            b["seniority_slug"],
            b["active_count"],
            b["new_72h_count"],
            b["historical_180d_count"],
            n_sal,
            sal_avg,
            sal_med,
            sal_p25,
            sal_p75,
            sal_min_obs,
            sal_max_obs,
            remote_pct,
            hybrid_pct,
            onsite_pct,
            json.dumps(top_companies, ensure_ascii=False),
            json.dumps(related_skills, ensure_ascii=False),
            b["last_job_created_at"],
        ))

    if upsert_rows:
        cur.executemany("""
            INSERT INTO seo_category_metrics (
                slug, route_type, tech_slug, city_slug, seniority_slug,
                active_count, new_72h_count, historical_180d_count,
                salary_sample_count, salary_avg, salary_median, salary_p25, salary_p75,
                salary_min_observed, salary_max_observed,
                remote_pct, hybrid_pct, onsite_pct,
                top_companies_json, related_skills_json, last_job_created_at
            ) VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s,
                %s, %s, %s,
                %s, %s, %s
            )
            ON DUPLICATE KEY UPDATE
                route_type = VALUES(route_type),
                active_count = VALUES(active_count),
                new_72h_count = VALUES(new_72h_count),
                historical_180d_count = VALUES(historical_180d_count),
                salary_sample_count = VALUES(salary_sample_count),
                salary_avg = VALUES(salary_avg),
                salary_median = VALUES(salary_median),
                salary_p25 = VALUES(salary_p25),
                salary_p75 = VALUES(salary_p75),
                salary_min_observed = VALUES(salary_min_observed),
                salary_max_observed = VALUES(salary_max_observed),
                remote_pct = VALUES(remote_pct),
                hybrid_pct = VALUES(hybrid_pct),
                onsite_pct = VALUES(onsite_pct),
                top_companies_json = VALUES(top_companies_json),
                related_skills_json = VALUES(related_skills_json),
                last_job_created_at = VALUES(last_job_created_at)
        """, upsert_rows)

    conn.commit()
    cur.close()
    conn.close()
    print(f"✅ [SEO Metrics] Actualizados {len(upsert_rows)} segmentos en seo_category_metrics.")


if __name__ == "__main__":
    build_metrics()
