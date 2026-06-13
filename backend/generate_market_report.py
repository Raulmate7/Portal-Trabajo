import os
import sys
import psycopg2
from dotenv import load_dotenv

# Añadimos el directorio actual al path para importar el parseador de salarios
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from logic.salary_parser import parse_salary

load_dotenv()

def get_db_connection():
    return psycopg2.connect(os.getenv("DATABASE_URL"))

def main():
    print("🔌 Conectando a la Base de Datos para compilar estadísticas...")
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # 1. Total ofertas activas
        cur.execute("SELECT COUNT(*) FROM jobs WHERE is_active = TRUE")
        total_active_jobs = cur.fetchone()[0]
        print(f"Total ofertas activas encontradas: {total_active_jobs}")

        # 2. Ranking de Tecnologías
        TECHS = [
            ('React', '%React%'),
            ('Angular', '%Angular%'),
            ('Vue', '%Vue%'),
            ('NodeJS', '%Node%'),
            ('Python', '%Python%'),
            ('Java', '%Java%'),
            ('PHP', '%PHP%'),
            ('C#', '%C#%'),
            ('Go', '%Go%'),
            ('JavaScript', '%JavaScript%'),
            ('TypeScript', '%TypeScript%'),
            ('AWS', '%AWS%'),
            ('Docker', '%Docker%'),
            ('Kubernetes', '%Kubernetes%'),
            ('Flutter', '%Flutter%'),
            ('Kotlin', '%Kotlin%'),
            ('Swift', '%Swift%'),
            ('SQL', '%SQL%'),
            ('Rust', '%Rust%'),
            ('Scala', '%Scala%'),
            ('Elixir', '%Elixir%'),
            ('Terraform', '%Terraform%'),
            ('COBOL', '%COBOL%')
        ]
        
        tech_counts = []
        for tech_name, pattern in TECHS:
            cur.execute("SELECT COUNT(*) FROM jobs WHERE is_active = TRUE AND (title ILIKE %s OR description_snippet ILIKE %s)", (pattern, pattern))
            count = cur.fetchone()[0]
            tech_counts.append((tech_name, count))
            
        tech_counts.sort(key=lambda x: x[1], reverse=True)
        print("Ranking de tecnologías calculado.")

        # 3. Salarios medios por tecnología
        cur.execute("SELECT title, description_snippet, salary, salary_min, salary_max, location FROM jobs WHERE is_active = TRUE AND salary IS NOT NULL AND salary != 'Consultar' AND salary != ''")
        jobs_with_salary = cur.fetchall()
        
        tech_salaries = {t[0]: [] for t in TECHS}
        for title, snippet, salary_str, s_min, s_max, location in jobs_with_salary:
            val = None
            if s_min is not None and s_max is not None:
                val = (float(s_min) + float(s_max)) / 2
            else:
                p_min, p_max, _ = parse_salary(salary_str)
                if p_min is not None and p_max is not None:
                    val = (p_min + p_max) / 2
            
            if val is not None and val >= 15000 and val <= 150000:
                text = f"{title} {snippet or ''}".lower()
                for tech_name, pattern in TECHS:
                    clean_pat = pattern.replace('%', '').lower()
                    if clean_pat == 'c#':
                        if 'c#' in text or 'csharp' in text:
                            tech_salaries[tech_name].append(val)
                    elif clean_pat == 'node':
                        if 'node' in text:
                            tech_salaries[tech_name].append(val)
                    else:
                        if clean_pat in text:
                            tech_salaries[tech_name].append(val)
                            
        tech_salary_stats = []
        for tech_name, salaries in tech_salaries.items():
            if len(salaries) >= 3:
                avg_sal = round(sum(salaries) / len(salaries))
                salaries.sort()
                med_sal = round(salaries[len(salaries) // 2])
                min_sal = round(salaries[0])
                max_sal = round(salaries[-1])
                tech_salary_stats.append((tech_name, len(salaries), avg_sal, med_sal, min_sal, max_sal))
        
        tech_salary_stats.sort(key=lambda x: x[2], reverse=True)
        print("Salarios por tecnología calculados.")

        # 4. Distribución de Modalidades
        cur.execute("SELECT title, description_snippet, location FROM jobs WHERE is_active = TRUE")
        all_jobs = cur.fetchall()
        
        remote_cnt = 0
        hybrid_cnt = 0
        onsite_cnt = 0
        
        for title, snippet, location in all_jobs:
            loc_lower = (location or '').lower()
            snip_lower = (snippet or '').lower()
            
            if any(h in loc_lower or h in snip_lower for h in ['híbrido', 'hibrido', 'hybrid', 'semipresencial', 'semi-presencial']):
                hybrid_cnt += 1
            elif any(r in loc_lower or r in snip_lower for r in ['remoto', 'remote', 'worldwide', 'teletrabajo']):
                remote_cnt += 1
            else:
                onsite_cnt += 1
                
        total_loc = len(all_jobs)
        remote_pct = round((remote_cnt / total_loc) * 100, 2) if total_loc > 0 else 0
        hybrid_pct = round((hybrid_cnt / total_loc) * 100, 2) if total_loc > 0 else 0
        onsite_pct = round((onsite_cnt / total_loc) * 100, 2) if total_loc > 0 else 0
        print("Distribución de modalidades calculada.")

        # 5. Salarios por Ciudad
        CITIES = [
            ('Madrid', '%madrid%'),
            ('Barcelona', '%barcelona%'),
            ('Valencia', '%valencia%'),
            ('Sevilla', '%sevilla%'),
            ('Bilbao', '%bilbao%'),
            ('Málaga', '%malaga%'),
            ('Remoto', 'remoto')
        ]
        
        city_salary_stats = []
        for city_name, pattern in CITIES:
            city_salaries = []
            for title, snippet, salary_str, s_min, s_max, location in jobs_with_salary:
                loc_lower = (location or '').lower()
                is_match = False
                if city_name == 'Remoto':
                    is_match = any(r in loc_lower for r in ['remoto', 'remote', 'worldwide', 'teletrabajo'])
                else:
                    clean_pat = pattern.replace('%', '').lower()
                    is_match = clean_pat in loc_lower
                
                if is_match:
                    val = None
                    if s_min is not None and s_max is not None:
                        val = (float(s_min) + float(s_max)) / 2
                    else:
                        p_min, p_max, _ = parse_salary(salary_str)
                        if p_min is not None and p_max is not None:
                            val = (p_min + p_max) / 2
                    if val is not None and val >= 15000 and val <= 150000:
                        city_salaries.append(val)
            
            if len(city_salaries) >= 3:
                avg_sal = round(sum(city_salaries) / len(city_salaries))
                city_salaries.sort()
                med_sal = round(city_salaries[len(city_salaries) // 2])
                city_salary_stats.append((city_name, len(city_salaries), avg_sal, med_sal))
        
        city_salary_stats.sort(key=lambda x: x[2], reverse=True)
        print("Salarios por ciudad calculados.")

        # 6. Escribir el informe a Markdown
        marketing_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'marketing')
        os.makedirs(marketing_dir, exist_ok=True)
        report_path = os.path.join(marketing_dir, 'informe_mercado_it.md')
        
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("# 📊 Informe del Mercado Laboral IT en España — Junio 2026\n\n")
            f.write(f"*Informe dinámico y automatizado basado en el análisis de **{total_active_jobs}** ofertas de empleo tecnológicas activas.*\n\n")
            f.write("---\n\n")
            
            # 6.1 Ranking
            f.write("## 📈 1. Las Tecnologías más Demandadas\n")
            f.write("A continuación se detallan las tecnologías más requeridas en las ofertas de empleo activas (título o descripción):\n\n")
            f.write("| Puesto / Tecnología | Ofertas Activas | Porcentaje sobre Total |\n")
            f.write("|---|:---:|:---:|\n")
            for idx, (tech, cnt) in enumerate(tech_counts, 1):
                pct = round((cnt / total_active_jobs) * 100, 2) if total_active_jobs > 0 else 0
                f.write(f"| **{idx}. {tech}** | {cnt} | {pct}% |\n")
            f.write("\n")
            
            # 6.2 Salarios Tech
            f.write("## 💰 2. Salarios Medios por Stack Tecnológico\n")
            f.write("Estadísticas de retribución bruta anual estimadas en base a ofertas con rangos salariales transparentes visibles:\n\n")
            f.write("| Tecnología | Muestra de Ofertas | Salario Medio | Mediana Salarial | Rango Mín/Máx Detectado |\n")
            f.write("|---|:---:|:---:|:---:|:---:|\n")
            for tech, cnt, avg_sal, med_sal, min_sal, max_sal in tech_salary_stats:
                f.write(f"| **{tech}** | {cnt} | {avg_sal.toLocaleString if hasattr(avg_sal, 'toLocaleString') else f'{avg_sal:,}€'.replace(',', '.')} | {med_sal.toLocaleString if hasattr(med_sal, 'toLocaleString') else f'{med_sal:,}€'.replace(',', '.')} | {min_sal:,}€ - {max_sal:,}€ |\n".replace(',', '.'))
            f.write("\n")
            
            # 6.3 Modalidades
            f.write("## 🏢 3. Distribución de Modalidades de Trabajo\n")
            f.write("El reparto porcentual del mercado laboral IT actual respecto al teletrabajo, presencialidad e híbrido:\n\n")
            f.write("| Modalidad | Ofertas Activas | Porcentaje |\n")
            f.write("|---|:---:|:---:|\n")
            f.write(f"| 🏠 **Remoto / Teletrabajo** | {remote_cnt} | {remote_pct}% |\n")
            f.write(f"| 🤝 **Híbrido / Semipresencial** | {hybrid_cnt} | {hybrid_pct}% |\n")
            f.write(f"| 🏢 **Presencial (Oficina)** | {onsite_cnt} | {onsite_pct}% |\n")
            f.write("\n")
            
            # 6.4 Salarios Ciudad
            f.write("## 📍 4. Salario Medio por Localidad IT Principal\n")
            f.write("Diferencias de retribución bruta anual estimada según el centro de trabajo principal en España:\n\n")
            f.write("| Localidad / Ciudad | Ofertas con Salario | Salario Medio | Mediana Salarial |\n")
            f.write("|---|:---:|:---:|:---:|\n")
            for city, cnt, avg_sal, med_sal in city_salary_stats:
                f.write(f"| **{city}** | {cnt} | {avg_sal:,}€ | {med_sal:,}€ |\n".replace(',', '.'))
            f.write("\n")
            
            f.write("---\n")
            f.write("*Informe generado automáticamente a partir de datos en vivo agregados en el Portal de Empleo IT.*\n")
            
        print(f"✨ ¡Informe guardado con éxito en {report_path}!")

    except Exception as e:
        print(f"❌ Error durante el análisis: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    main()
