import os
import smtplib
import time
import psycopg2
import base64
import html
import hmac
import hashlib
import urllib.parse
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from dotenv import load_dotenv
from logic.slug import get_job_slug
from logic.privacy import mask_email
from logic.legal import get_legal_footer_identity
from logic.tracking import build_track_click_url, build_track_open_url, replace_placeholder_tracking_links

load_dotenv()

def generate_unsubscribe_link(email: str) -> str:
    base_url = os.getenv("FRONTEND_URL", "https://portalempleoit.com")
    secret = os.getenv("UNSUBSCRIBE_SECRET") or os.getenv("CRON_SECRET")
    if not secret:
        raise ValueError("❌ Error crítico: Ni UNSUBSCRIBE_SECRET ni CRON_SECRET están definidos en el entorno.")
    token = hmac.new(secret.encode(), email.strip().lower().encode(), hashlib.sha256).hexdigest()
    return f"{base_url}/api/unsubscribe?email={urllib.parse.quote(email.strip().lower())}&token={token}"

def encrypt_referral_code(email: str) -> str:
    """Cifra el correo para generar un enlace de referido opaco AES-256-GCM y prevenir filtración de PII."""
    secret = os.getenv("MAGIC_LINK_SECRET") or os.getenv("CRON_SECRET")
    if not secret:
        return ""
    try:
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        key = hashlib.sha256(secret.encode()).digest()
        aesgcm = AESGCM(key)
        iv = os.urandom(12)
        clean_email = email.strip().lower().encode('utf-8')
        enc = aesgcm.encrypt(iv, clean_email, None)
        tag = enc[-16:]
        ct = enc[:-16]
        return f"ref_{iv.hex()}_{tag.hex()}_{ct.hex()}"
    except Exception as e:
        print(f"Error encrypting referral code: {e}")
        return ""

def get_custom_udemy_link(tech_keywords):
    base_udemy = "https://trk.udemy.com/9VMAEj"
    if not tech_keywords:
        return f"{base_udemy}?subid=newsletter_general"
    
    techs = tech_keywords.lower()
    if any(k in techs for k in ['react', 'frontend', 'javascript', 'typescript', 'next', 'vue', 'angular']):
        return f"{base_udemy}?subid=newsletter_react&redirect=https%3A%2F%2Fwww.udemy.com%2Fcourse%2Freact-the-complete-guide-incl-redux%2F"
    elif any(k in techs for k in ['python', 'data', 'machine', 'learning', 'ai', 'sql']):
        return f"{base_udemy}?subid=newsletter_python&redirect=https%3A%2F%2Fwww.udemy.com%2Fcourse%2Fcomplete-python-bootcamp%2F"
    elif any(k in techs for k in ['java', 'spring', 'csharp', 'php', 'backend', 'node']):
        return f"{base_udemy}?subid=newsletter_backend&redirect=https%3A%2F%2Fwww.udemy.com%2Fcourse%2Fthe-complete-web-development-bootcamp%2F"
    elif any(k in techs for k in ['cloud', 'devops', 'aws', 'docker', 'kubernetes']):
        return f"{base_udemy}?subid=newsletter_devops&redirect=https%3A%2F%2Fwww.udemy.com%2Fcourse%2Fdecodingdevops%2F"
    
    return f"{base_udemy}?subid=newsletter_general"

def send_newsletter():
    print("===============================================")
    print("🚀 PREPARANDO ENVÍO DE NEWSLETTER SEMANAL...")

    # 1. CONEXIÓN A BASE DE DATOS
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
    except Exception as e:
        print(f"❌ Error crítico conectando a BD: {e}")
        return

    # 2. BUSCAR OFERTAS (Últimos 7 días para el resumen semanal)
    search_window = datetime.now() - timedelta(days=7)
    
    cur.execute("""
        SELECT id, title, company, location, url_source, category 
        FROM jobs 
        WHERE created_at > %s AND is_active = TRUE
        ORDER BY created_at DESC
    """, (search_window,))
    
    all_jobs = cur.fetchall()

    if not all_jobs:
        print("💤 No hay ofertas nuevas esta semana. Fin del proceso.")
        print("===============================================")
        conn.close()
        return

    # --- INICIO RUNDOWN SEMANAL (TENDENCIAS MERCADO IT) ---
    # A. Top 3 tecnologías demandadas (por conteo de coincidencias en título de la última semana)
    tech_counts = {
        'React': 0, 'Node.js': 0, 'Python': 0, 'Java': 0, 'TypeScript': 0,
        'Angular': 0, 'Vue.js': 0, 'PHP': 0, 'DevOps/Cloud': 0
    }
    for job in all_jobs:
        title = (job[1] or '').lower()
        if 'react' in title: tech_counts['React'] += 1
        if 'node' in title: tech_counts['Node.js'] += 1
        if 'python' in title: tech_counts['Python'] += 1
        if 'java' in title and 'javascript' not in title: tech_counts['Java'] += 1
        if 'typescript' in title: tech_counts['TypeScript'] += 1
        if 'angular' in title: tech_counts['Angular'] += 1
        if 'vue' in title: tech_counts['Vue.js'] += 1
        if 'php' in title: tech_counts['PHP'] += 1
        if 'devops' in title or 'aws' in title or 'cloud' in title: tech_counts['DevOps/Cloud'] += 1
    
    top_techs = sorted([(k, v) for k, v in tech_counts.items() if v > 0], key=lambda x: x[1], reverse=True)[:3]

    # B. Empresa más contratante de la semana
    company_counts = {}
    for job in all_jobs:
        comp = job[2]
        if comp and comp.strip():
            company_counts[comp] = company_counts.get(comp, 0) + 1
    top_company_row = sorted(company_counts.items(), key=lambda x: x[1], reverse=True)
    top_company_name = top_company_row[0][0] if top_company_row else None
    top_company_count = top_company_row[0][1] if top_company_row else 0

    # C. Oferta con mejor salario de la semana
    cur.execute("""
        SELECT title, company, salary
        FROM jobs
        WHERE created_at > %s AND is_active = TRUE AND salary IS NOT NULL AND salary != '' AND salary != 'Consultar'
    """, (search_window,))
    salary_rows = cur.fetchall()
    
    top_salary_job = None
    max_salary_val = 0
    for s_title, s_company, salary_str in salary_rows:
        try:
            import re
            clean_str = salary_str.replace('.', '').replace(' ', '')
            numbers = re.findall(r'\d+', clean_str)
            if numbers:
                val = max(int(n) for n in numbers)
                if val > 0 and val < 5000:
                    val = val * 12 # Mensual a anual
                if val > max_salary_val and val <= 180000:
                    max_salary_val = val
                    top_salary_job = (s_title, s_company, salary_str)
        except Exception:
            continue

    # Construir el bloque HTML del Rundown Semanal
    rundown_html = ""
    if top_techs or top_company_name or top_salary_job:
        rundown_html = """
        <div style="margin-bottom: 24px; padding: 20px; background-color: #faf5ff; border: 1px dashed #c084fc; border-radius: 12px;">
            <h3 style="color: #6b21a8; margin: 0 0 12px 0; font-size: 15px; font-weight: 850; text-transform: uppercase; letter-spacing: 0.5px;">
                📊 El Rundown Semanal del Mercado IT
            </h3>
            <ul style="margin: 0; padding: 0; list-style: none; font-size: 13px; color: #581c87; line-height: 1.6;">
        """
        if top_techs:
            tech_items = [f"<strong>{t[0]}</strong> ({t[1]} ofertas)" for t in top_techs]
            rundown_html += f"""
                <li style="margin-bottom: 8px;">
                    🚀 <strong>Tecnologías más demandadas:</strong> {', '.join(tech_items)}.
                </li>
            """
        if top_company_name:
            top_company_name_esc = html.escape(str(top_company_name))
            rundown_html += f"""
                <li style="margin-bottom: 8px;">
                    🏢 <strong>Líder de contratación:</strong> <strong>{top_company_name_esc}</strong> ha publicado {top_company_count} ofertas de empleo esta semana.
                </li>
            """
        if top_salary_job:
            top_salary_esc = html.escape(str(top_salary_job[2]))
            top_pos_esc = html.escape(str(top_salary_job[0]))
            top_comp_esc = html.escape(str(top_salary_job[1]))
            rundown_html += f"""
                <li style="margin-bottom: 0;">
                    💰 <strong>Sueldo top de la semana:</strong> {top_salary_esc} para la posición <em>{top_pos_esc}</em> en <strong>{top_comp_esc}</strong>.
                </li>
            """
        rundown_html += """
            </ul>
        </div>
        """
    # --- FIN RUNDOWN SEMANAL ---

    # Buscar ofertas destacadas pro o enterprise activas (sponsors de la semana)
    cur.execute("""
        SELECT id, title, company, location, url_source, category, plan 
        FROM jobs 
        WHERE is_active = TRUE AND is_featured = TRUE 
          AND (featured_expires_at IS NULL OR featured_expires_at > NOW())
          AND plan IN ('destacado_pro', 'destacado_enterprise', 'destacado_premium')
        ORDER BY created_at DESC 
        LIMIT 3
    """)
    featured_jobs = cur.fetchall()
    print(f"⭐ Encontradas {len(featured_jobs)} ofertas patrocinadas/destacadas para el boletín.")

    # Clasificar ofertas por categorías para el bloque estándar (máximo 6 por categoría)
    jobs_by_cat = {
        'Backend': [],
        'Frontend': [],
        'Data & AI': [],
        'Cloud & DevOps': [],
        'Mobile': [],
        'Otros': []
    }
    
    for job in all_jobs:
        cat = job[5] or 'Otros'
        if cat not in jobs_by_cat:
            cat = 'Otros'
        if len(jobs_by_cat[cat]) < 6:
            jobs_by_cat[cat].append(job)

    # Contar total de ofertas a incluir en la parte estándar
    total_included = sum(len(jobs) for jobs in jobs_by_cat.values())
    if total_included == 0:
        print("💤 No hay ofertas en las categorías principales. Fin del proceso.")
        print("===============================================")
        conn.close()
        return

    # Mapeo de emojis para cada categoría
    cat_emojis = {
        'Backend': '💻',
        'Frontend': '🎨',
        'Data & AI': '📊',
        'Cloud & DevOps': '☁️',
        'Mobile': '📱',
        'Otros': '💼'
    }

    # Mapeo de colores para las líneas de categoría
    cat_colors = {
        'Backend': '#3b82f6', # Azul
        'Frontend': '#10b981', # Esmeralda
        'Data & AI': '#8b5cf6', # Violeta
        'Cloud & DevOps': '#f97316', # Naranja
        'Mobile': '#ec4899', # Rosa
        'Otros': '#6b7280' # Gris
    }

    # 3. PREPARAR HTML ESTÁNDAR (COMÚN)
    standard_jobs_html = ""
    for cat, jobs in jobs_by_cat.items():
        if not jobs:
            continue
            
        emoji = cat_emojis.get(cat, '💼')
        color = cat_colors.get(cat, '#4F46E5')
        
        standard_jobs_html += f"""
            <h2 style="color: #1f2937; border-bottom: 2px solid {color}30; padding-bottom: 6px; margin-top: 28px; margin-bottom: 14px; font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                {emoji} {cat}
            </h2>
        """
        
        for job in jobs:
            job_id, title, company, location, url_source, _ = job
            base_url = os.getenv("FRONTEND_URL", "https://portalempleoit.com")
            title_esc = html.escape(str(title or ''))
            company_esc = html.escape(str(company or ''))
            location_esc = html.escape(str(location or ''))
            original_job_link = f"{base_url}/job/{get_job_slug(job_id, title, location, company)}?utm_source=newsletter&utm_medium=email&utm_campaign=resumen_semanal&utm_term={urllib.parse.quote(cat)}&utm_content={job_id}"
            job_link = f"{base_url}/api/track-click?email=##EMAIL##&campaign=##CAMPAIGN##&redirect={urllib.parse.quote(original_job_link)}"

            standard_jobs_html += f"""
                <div style="margin-bottom: 16px; padding: 12px 16px; background-color: #f9fafb; border-left: 4px solid {color}; border-radius: 0 8px 8px 0; border-top: 1px solid #f3f4f6; border-right: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6;">
                    <h3 style="color: #1e1b4b; margin: 0 0 4px; font-size: 14px; font-weight: bold; line-height: 1.4;">{title_esc}</h3>
                    <p style="margin: 0 0 10px; color: #4b5563; font-size: 12px;">🏢 {company_esc} &nbsp;|&nbsp; 📍 {location_esc}</p>
                    <a href="{job_link}" style="display: inline-block; background-color: {color}; color: white; padding: 6px 14px; text-decoration: none; border-radius: 6px; font-size: 11px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        Ver Oferta →
                    </a>
                </div>
            """

    # Enlaces fijos
    base_url = os.getenv("FRONTEND_URL", "https://portalempleoit.com")
    CV_LINK = f"{base_url}/recursos?utm_source=newsletter&utm_medium=email&utm_campaign=resumen_semanal"

    # 4. OBTENER SUSCRIPTORES CON SUS PREFERENCIAS (LEG-010: exigir frequency='weekly', is_active=TRUE y marketing_accepted=TRUE)
    cur.execute("""
        SELECT email, tech_keywords 
        FROM subscribers 
        WHERE email IS NOT NULL 
          AND email NOT LIKE '%@deleted.local'
          AND frequency = 'weekly'
          AND COALESCE(is_active, TRUE) = TRUE
          AND COALESCE(marketing_accepted, FALSE) = TRUE
    """)
    subscribers = cur.fetchall()

    if not subscribers:
        print("⚠️ No hay suscriptores en la base de datos.")
        print("===============================================")
        conn.close()
        return

    print(f"👥 Se encontraron {len(subscribers)} suscriptores. Iniciando envíos personalizados...")

    # 5. SEC-062: INICIAR SESIÓN SMTP CON HELPER DE RECONEXIÓN POR MICRO-LOTES Y BACKOFF
    def open_smtp_session():
        smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        if smtp_port == 465:
            srv = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=30)
        else:
            srv = smtplib.SMTP(smtp_host, smtp_port, timeout=30)
            srv.starttls()
        srv.login(os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASSWORD"))
        return srv, smtp_host, smtp_port

    try:
        server, smtp_host, smtp_port = open_smtp_session()
        print(f"✅ Login correcto en servidor SMTP ({smtp_host}:{smtp_port}).")
    except Exception as e:
        print(f"❌ ERROR DE LOGIN SMTP (Revisa tu .env): {e}")
        conn.close()
        return

    # 6. BUCLE DE ENVÍO PERSONALIZADO (reconexión cada 50 correos + backoff exponencial)
    success_count = 0
    error_count = 0
    sent_in_batch = 0
    campaign_name = f"weekly_newsletter_{datetime.now().strftime('%Y-%m-%d')}"

    for (email, tech_keywords) in subscribers:
        try:
            encrypted_ref = encrypt_referral_code(email)
            referral_url = f"{base_url}/ref/{encrypted_ref}" if encrypted_ref else f"{base_url}/referidos"
            unsubscribe_link = generate_unsubscribe_link(email)
            # 6.1. Buscar ofertas personalizadas (en memoria) para este suscriptor
            recommended_jobs = []
            recommended_html = ""
            
            if tech_keywords and tech_keywords.strip():
                keywords = [k.strip().lower() for k in tech_keywords.split(',') if k.strip()]
                for job in all_jobs:
                    job_title = (job[1] or "").lower()
                    if any(kw in job_title for kw in keywords):
                        recommended_jobs.append(job)
                        if len(recommended_jobs) >= 3: # Limitamos a 3 recomendaciones destacadas
                            break
            
            if recommended_jobs:
                tech_label = html.escape(tech_keywords.replace(',', ', ').upper())
                recommended_html = f"""
                    <h2 style="color: #92400e; border-bottom: 2px solid #fbbf2440; padding-bottom: 6px; margin-top: 20px; margin-bottom: 14px; font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                        ⭐ Recomendadas para tu perfil ({tech_label})
                    </h2>
                """
                for job in recommended_jobs:
                    job_id, title, company, location, url_source, job_cat = job
                    job_cat = job_cat or 'Otros'
                    title_esc = html.escape(str(title or ''))
                    company_esc = html.escape(str(company or ''))
                    location_esc = html.escape(str(location or ''))
                    original_job_link = f"{base_url}/job/{get_job_slug(job_id, title, location, company)}?utm_source=newsletter&utm_medium=email&utm_campaign=resumen_semanal&utm_term={urllib.parse.quote(job_cat)}&utm_content={job_id}"
                    job_link = f"{base_url}/api/track-click?email=##EMAIL##&campaign=##CAMPAIGN##&redirect={urllib.parse.quote(original_job_link)}"
                    
                    recommended_html += f"""
                        <div style="margin-bottom: 16px; padding: 12px 16px; background-color: #fffbeb; border-left: 4px solid #fbbf24; border-radius: 0 8px 8px 0; border-top: 1px solid #fef3c7; border-right: 1px solid #fef3c7; border-bottom: 1px solid #fef3c7;">
                            <h3 style="color: #78350f; margin: 0 0 4px; font-size: 14px; font-weight: bold; line-height: 1.4;">{title_esc}</h3>
                            <p style="margin: 0 0 10px; color: #b45309; font-size: 12px;">🏢 {company_esc} &nbsp;|&nbsp; 📍 {location_esc}</p>
                            <a href="{job_link}" style="display: inline-block; background-color: #f59e0b; color: white; padding: 6px 14px; text-decoration: none; border-radius: 6px; font-size: 11px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                Ver Oferta →
                            </a>
                        </div>
                    """
            # 6.1.5 Generar bloque de ofertas patrocinadas/destacadas (sponsors de la semana)
            featured_html = ""
            if featured_jobs:
                featured_html = """
                    <h2 style="color: #4338ca; border-bottom: 2px solid #4338ca40; padding-bottom: 6px; margin-top: 10px; margin-bottom: 14px; font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                        ⭐ Patrocinador de la Semana
                    </h2>
                """
                for f_job in featured_jobs:
                    fj_id, fj_title, fj_company, fj_location, fj_url, fj_cat, fj_plan = f_job
                    fj_cat = fj_cat or 'Otros'
                    title_esc = html.escape(str(fj_title or ''))
                    company_esc = html.escape(str(fj_company or ''))
                    location_esc = html.escape(str(fj_location or ''))
                    original_fj_link = f"{base_url}/job/{get_job_slug(fj_id, fj_title, fj_location, fj_company)}?utm_source=newsletter&utm_medium=email&utm_campaign=resumen_semanal&utm_term={urllib.parse.quote(fj_cat)}&utm_content={fj_id}"
                    fj_link = f"{base_url}/api/track-click?email=##EMAIL##&campaign=##CAMPAIGN##&redirect={urllib.parse.quote(original_fj_link)}"
                    
                    featured_html += f"""
                        <div style="margin-bottom: 16px; padding: 16px; background-color: #f5f3ff; border: 2px solid #c7d2fe; border-left: 6px solid #6366f1; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.05);">
                            <span style="display: inline-block; background-color: #6366f1; color: white; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">DESTACADO</span>
                            <h3 style="color: #1e1b4b; margin: 0 0 4px; font-size: 15px; font-weight: 800; line-height: 1.4;">{title_esc}</h3>
                            <p style="margin: 0 0 10px; color: #4338ca; font-size: 12px; font-weight: 600;">🏢 {company_esc} &nbsp;|&nbsp; 📍 {location_esc}</p>
                            <a href="{fj_link}" style="display: inline-block; background-color: #4338ca; color: white; padding: 8px 18px; text-decoration: none; border-radius: 6px; font-size: 11px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                Ver Oferta Destacada →
                            </a>
                        </div>
                    """

            # 6.2. Combinar el HTML patrocinado, el personalizado con el estándar y firmar enlaces de tracking (SEC-042/043)
            final_jobs_html = replace_placeholder_tracking_links(
                featured_html + recommended_html + standard_jobs_html,
                base_url,
                email,
                campaign_name,
            )

            # Generar enlaces opacos firmados HMAC para los CTAs generales del correo
            user_udemy_link = get_custom_udemy_link(tech_keywords)
            bootcamp_track = build_track_click_url(base_url, email, campaign_name, user_udemy_link)
            cv_track = build_track_click_url(base_url, email, campaign_name, CV_LINK)

            talento_premium_orig = f"{base_url}/talento-premium?utm_source=newsletter&utm_medium=email&utm_campaign=resumen_semanal"
            talento_premium_track = build_track_click_url(base_url, email, campaign_name, talento_premium_orig)

            blog_orig = f"{base_url}/blog/guia-salarios-programadores-espana-2026?utm_source=newsletter&utm_medium=email&utm_campaign=resumen_semanal"
            blog_track = build_track_click_url(base_url, email, campaign_name, blog_orig)

            salarios_orig = f"{base_url}/salarios?utm_source=newsletter&utm_medium=email&utm_campaign=resumen_semanal"
            salarios_track = build_track_click_url(base_url, email, campaign_name, salarios_orig)

            visit_web_orig = f"{base_url}?utm_source=newsletter&utm_medium=email&utm_campaign=resumen_semanal"
            visit_web_track = build_track_click_url(base_url, email, campaign_name, visit_web_orig)
            open_pixel_url = build_track_open_url(base_url, email, campaign_name)

            # 6.3. Generar cuerpo HTML con pixel de tracking
            email_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; padding: 20px; color: #333; background-color: #f9fafb;">
                    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
                        
                        <!-- Cabecera -->
                        <div style="background: linear-gradient(135deg, #312e81, #4338ca); color: white; padding: 30px; text-align: center;">
                            <h1 style="margin: 0; font-size: 24px;">🔥 Resumen Semanal de Empleo IT</h1>
                            <p style="color: #c7d2fe; margin: 8px 0 0;">Las mejores ofertas de los últimos 7 días</p>
                        </div>

                        <div style="padding: 24px;">
                            {rundown_html}
                            {final_jobs_html}

                            <!-- Banner Bootcamp (Afiliado) -->
                            <div style="margin: 24px 0; padding: 20px; background: linear-gradient(135deg, #312e81, #581c87); border-radius: 12px; text-align: center;">
                                <p style="color: #c7d2fe; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">Recomendación Premium</p>
                                <h3 style="color: white; margin: 0 0 8px; font-size: 18px;">🚀 Bootcamp Fullstack Developer</h3>
                                <p style="color: #c7d2fe; font-size: 13px; margin: 0 0 16px;">Acelera tu carrera tech. Aprende haciendo proyectos reales.</p>
                                <a href="{bootcamp_track}" style="display: inline-block; background: linear-gradient(90deg, #fbbf24, #f59e0b); color: #1f2937; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                                    Ver Bootcamp Completo →
                                </a>
                            </div>

                            <!-- Banner CV (Afiliado) -->
                            <div style="margin: 16px 0; padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; display: flex; align-items: center;">
                                <div>
                                    <h4 style="margin: 0 0 4px; color: #166534; font-size: 14px;">📄 ¿Tu CV no pasa los filtros ATS?</h4>
                                    <p style="margin: 0; color: #15803d; font-size: 12px;">Usa plantillas profesionales optimizadas para recruiters.</p>
                                    <a href="{cv_track}" style="color: #4f46e5; font-size: 13px; font-weight: bold; text-decoration: none;">Mejorar mi CV →</a>
                                </div>
                            </div>

                            <!-- CTA Talento Premium -->
                            <div style="margin: 24px 0; padding: 20px; background: #fffbeb; border: 2px solid #fbbf24; border-radius: 12px; text-align: center;">
                                <h3 style="margin: 0 0 8px; color: #92400e;">⭐ ¿Eres Senior (+3 años)?</h3>
                                <p style="color: #78350f; font-size: 13px; margin: 0 0 12px;">Accede a ofertas exclusivas con salarios +45K de forma confidencial.</p>
                                <a href="{talento_premium_track}" style="display: inline-block; background: linear-gradient(90deg, #fbbf24, #f59e0b); color: #1f2937; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                                    Registrarme en Talento Premium
                                </a>
                            </div>

                            <!-- Artículo del Blog de la Semana -->
                            <div style="margin: 24px 0; padding: 20px; background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 12px;">
                                <p style="color: #6366f1; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px; font-weight: bold;">📖 Artículo de la semana</p>
                                <h3 style="margin: 0 0 8px; color: #312e81; font-size: 16px;">Guía de salarios para programadores en España (2026)</h3>
                                <p style="color: #4338ca; font-size: 13px; margin: 0 0 12px;">¿Cuánto deberías cobrar? Analizamos las tendencias salariales para perfiles Junior, Mid y Senior en las principales ciudades.</p>
                                <a href="{blog_track}" style="color: #4f46e5; font-size: 13px; font-weight: bold; text-decoration: none;">Leer artículo completo →</a>
                            </div>

                            <!-- Calculadora de Salarios CTA -->
                            <div style="margin: 16px 0; padding: 16px; background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 10px; text-align: center;">
                                <h4 style="margin: 0 0 4px; color: #581c87; font-size: 14px;">💰 ¿Cuánto cobran los programadores en España?</h4>
                                <p style="margin: 0 0 10px; color: #7c3aed; font-size: 12px;">Usa nuestra calculadora con datos reales de miles de ofertas.</p>
                                <a href="{salarios_track}" style="display: inline-block; background: #7c3aed; color: white; padding: 8px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px;">
                                    Calcular mi salario →
                                </a>
                            </div>
                        </div>

                        <!-- Footer Legal conforme a LSSI Art. 10 y 21 / RGPD Art. 13 -->
                        <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="color: #4b5563; font-size: 12px; margin: 0 0 12px 0; font-weight: 500; line-height: 1.5;">
                                📢 ¿Te gusta este newsletter? Invita a tus compañeros de profesión usando tu enlace personal:<br>
                                <a href="{referral_url}" style="color: #4f46e5; text-decoration: underline; font-weight: bold;">{referral_url}</a><br>
                                ¡Si se suscriben 3 amigos, obtendréis beneficios premium!
                            </p>
                            <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; line-height: 1.5; text-align: center;">
                                <p style="margin: 0 0 4px 0;">
                                    {get_legal_footer_identity()}<br>
                                    Recibes este correo porque te suscribiste a las alertas de empleo en portalempleoit.com.
                                </p>
                                <p style="margin: 0;">
                                    <a href="{visit_web_track}" style="color: #6366f1; text-decoration: none;">portalempleoit.com</a> · 
                                    <a href="{base_url}/privacy" style="color: #6b7280; text-decoration: underline;">Política de Privacidad</a> · 
                                    <a href="{unsubscribe_link}" style="color: #ef4444; text-decoration: underline; font-weight: bold;">Darme de baja en 1 clic</a>
                                </p>
                                <p style="margin: 4px 0 0 0; color: #9ca3af; font-size: 9px;">
                                    Este correo incluye métricas técnicas de entrega (baliza transparente de 1x1 px y enlaces de redirección para depuración de listas inactivas, Art. 22.2 LSSI). Puedes evitar el seguimiento desactivando la descarga de imágenes en tu cliente de correo o ejerciendo tus derechos RGPD en contacto@portalempleoit.com.
                                </p>
                            </div>
                        </div>
                    </div>
                    <!-- Pixel de Tracking Invisible -->
                    <img src="{open_pixel_url}" width="1" height="1" style="display:none;" />
                </body>
            </html>
            """
            
            # 6.4. Generar asunto dinámico personalizado por tecnología de interés
            if tech_keywords and tech_keywords.strip():
                primary_tech = tech_keywords.split(',')[0].strip().upper()
                subject_line = f"🔥 [{primary_tech} JOBS] {total_included} nuevas vacantes IT esta semana"
            else:
                subject_line = f"📅 Resumen Semanal: {total_included} Ofertas de Programación e IT"

            msg = MIMEMultipart()
            msg['From'] = f"Portal Trabajo IT <{os.getenv('EMAIL_USER')}>"
            msg['To'] = email
            msg['Subject'] = subject_line
            # Cabeceras obligatorias RFC 8058 / Google & Yahoo One-Click Unsubscribe (HTTPS + mailto)
            msg['List-Unsubscribe'] = f"<{unsubscribe_link}>, <mailto:contacto@portalempleoit.com?subject=unsubscribe>"
            msg['List-Unsubscribe-Post'] = "List-Unsubscribe=One-Click"
            msg.attach(MIMEText(email_body, 'html'))
            
            if sent_in_batch >= 50:
                try:
                    server.quit()
                except Exception:
                    pass
                server, _, _ = open_smtp_session()
                sent_in_batch = 0

            delivered = False
            for attempt in range(3):
                try:
                    server.send_message(msg)
                    delivered = True
                    break
                except smtplib.SMTPRecipientsRefused as bounce_err:
                    print(f"  🚫 Rebote duro (hard bounce) para {mask_email(email)}: {bounce_err}")
                    error_count += 1
                    break
                except (smtplib.SMTPServerDisconnected, smtplib.SMTPException, OSError) as smtp_err:
                    if attempt == 2:
                        raise smtp_err
                    wait_s = 2 ** attempt
                    time.sleep(wait_s)
                    try:
                        server.quit()
                    except Exception:
                        pass
                    server, _, _ = open_smtp_session()
                    sent_in_batch = 0

            if delivered:
                print(f"  ✅ Enviado resumen semanal a: {mask_email(email)}")
                success_count += 1
                sent_in_batch += 1
            
        except Exception as e:
            print(f"  ⚠️ Error enviando resumen semanal a {mask_email(email)}: {e}")
            error_count += 1

    try:
        server.quit()
    except Exception:
        pass
    cur.close()
    conn.close()
    print(f"🎉 Envío completado: {success_count} enviados, {error_count} fallidos.")
    print("===============================================")

if __name__ == "__main__":
    send_newsletter()
