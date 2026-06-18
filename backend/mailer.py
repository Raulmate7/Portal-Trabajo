import os
import smtplib
import psycopg2
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from dotenv import load_dotenv
from logic.slug import get_job_slug

load_dotenv()

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
            import urllib.parse
            base_url = os.getenv("FRONTEND_URL", "https://portalempleoit.com")
            original_job_link = f"{base_url}/job/{get_job_slug(job_id, title, location, company)}?utm_source=newsletter&utm_medium=email&utm_campaign=resumen_semanal&utm_term={urllib.parse.quote(cat)}&utm_content={job_id}"
            job_link = f"{base_url}/api/track-click?email=##EMAIL##&campaign=##CAMPAIGN##&redirect={urllib.parse.quote(original_job_link)}"

            standard_jobs_html += f"""
                <div style="margin-bottom: 16px; padding: 12px 16px; background-color: #f9fafb; border-left: 4px solid {color}; border-radius: 0 8px 8px 0; border-top: 1px solid #f3f4f6; border-right: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6;">
                    <h3 style="color: #1e1b4b; margin: 0 0 4px; font-size: 14px; font-weight: bold; line-height: 1.4;">{title}</h3>
                    <p style="margin: 0 0 10px; color: #4b5563; font-size: 12px;">🏢 {company} &nbsp;|&nbsp; 📍 {location}</p>
                    <a href="{job_link}" style="display: inline-block; background-color: {color}; color: white; padding: 6px 14px; text-decoration: none; border-radius: 6px; font-size: 11px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        Ver Oferta →
                    </a>
                </div>
            """

    # Enlaces fijos
    base_url = os.getenv("FRONTEND_URL", "https://portalempleoit.com")
    CV_LINK = f"{base_url}/recursos?utm_source=newsletter&utm_medium=email&utm_campaign=resumen_semanal"

    # 4. OBTENER SUSCRIPTORES CON SUS PREFERENCIAS
    cur.execute("SELECT email, tech_keywords FROM subscribers WHERE email IS NOT NULL")
    subscribers = cur.fetchall()

    if not subscribers:
        print("⚠️ No hay suscriptores en la base de datos.")
        print("===============================================")
        conn.close()
        return

    print(f"👥 Se encontraron {len(subscribers)} suscriptores. Iniciando envíos personalizados...")

    # 5. INICIAR SESIÓN EN GMAIL
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASSWORD"))
        print("✅ Login correcto en Gmail SMTP.")
    except Exception as e:
        print(f"❌ ERROR DE LOGIN SMTP (Revisa tu .env): {e}")
        conn.close()
        return

    # 6. BUCLE DE ENVÍO PERSONALIZADO
    success_count = 0
    error_count = 0
    campaign_name = f"weekly_newsletter_{datetime.now().strftime('%Y-%m-%d')}"

    for (email, tech_keywords) in subscribers:
        try:
            base64_email = base64.b64encode(email.encode('utf-8')).decode('utf-8')
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
                tech_label = tech_keywords.replace(',', ', ').upper()
                recommended_html = f"""
                    <h2 style="color: #92400e; border-bottom: 2px solid #fbbf2440; padding-bottom: 6px; margin-top: 20px; margin-bottom: 14px; font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                        ⭐ Recomendadas para tu perfil ({tech_label})
                    </h2>
                """
                for job in recommended_jobs:
                    job_id, title, company, location, url_source, job_cat = job
                    job_cat = job_cat or 'Otros'
                    import urllib.parse
                    original_job_link = f"{base_url}/job/{get_job_slug(job_id, title, location, company)}?utm_source=newsletter&utm_medium=email&utm_campaign=resumen_semanal&utm_term={urllib.parse.quote(job_cat)}&utm_content={job_id}"
                    job_link = f"{base_url}/api/track-click?email=##EMAIL##&campaign=##CAMPAIGN##&redirect={urllib.parse.quote(original_job_link)}"
                    
                    recommended_html += f"""
                        <div style="margin-bottom: 16px; padding: 12px 16px; background-color: #fffbeb; border-left: 4px solid #fbbf24; border-radius: 0 8px 8px 0; border-top: 1px solid #fef3c7; border-right: 1px solid #fef3c7; border-bottom: 1px solid #fef3c7;">
                            <h3 style="color: #78350f; margin: 0 0 4px; font-size: 14px; font-weight: bold; line-height: 1.4;">{title}</h3>
                            <p style="margin: 0 0 10px; color: #b45309; font-size: 12px;">🏢 {company} &nbsp;|&nbsp; 📍 {location}</p>
                            <a href="{job_link}" style="display: inline-block; background-color: #f59e0b; color: white; padding: 6px 14px; text-decoration: none; border-radius: 6px; font-size: 11px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                Ver Oferta →
                            </a>
                        </div>
                    """
            # 6.2. Combinar el HTML personalizado con el estándar y reemplazar placeholders de tracking
            final_jobs_html = (recommended_html + standard_jobs_html).replace("##EMAIL##", email).replace("##CAMPAIGN##", campaign_name)
            
            # Generar enlaces con tracking para los CTAs generales del correo
            import urllib.parse
            user_udemy_link = get_custom_udemy_link(tech_keywords)
            bootcamp_track = f"{base_url}/api/track-click?email={email}&campaign={campaign_name}&redirect={urllib.parse.quote(user_udemy_link)}"
            cv_track = f"{base_url}/api/track-click?email={email}&campaign={campaign_name}&redirect={urllib.parse.quote(CV_LINK)}"
            
            talento_premium_orig = f"{base_url}/talento-premium?utm_source=newsletter&utm_medium=email&utm_campaign=resumen_semanal"
            talento_premium_track = f"{base_url}/api/track-click?email={email}&campaign={campaign_name}&redirect={urllib.parse.quote(talento_premium_orig)}"
            
            blog_orig = f"{base_url}/blog/guia-salarios-programadores-espana-2026?utm_source=newsletter&utm_medium=email&utm_campaign=resumen_semanal"
            blog_track = f"{base_url}/api/track-click?email={email}&campaign={campaign_name}&redirect={urllib.parse.quote(blog_orig)}"
            
            salarios_orig = f"{base_url}/salarios?utm_source=newsletter&utm_medium=email&utm_campaign=resumen_semanal"
            salarios_track = f"{base_url}/api/track-click?email={email}&campaign={campaign_name}&redirect={urllib.parse.quote(salarios_orig)}"
            
            visit_web_orig = f"{base_url}?utm_source=newsletter&utm_medium=email&utm_campaign=resumen_semanal"
            visit_web_track = f"{base_url}/api/track-click?email={email}&campaign={campaign_name}&redirect={urllib.parse.quote(visit_web_orig)}"

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

                        <!-- Footer -->
                        <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="color: #4b5563; font-size: 12px; margin: 0 0 12px 0; font-weight: 500; line-height: 1.5;">
                                📢 ¿Te gusta este newsletter? Invita a tus compañeros de profesión usando tu enlace personal:<br>
                                <a href="{base_url}/ref/{base64_email}" style="color: #4f46e5; text-decoration: underline; font-weight: bold;">{base_url}/ref/{base64_email}</a><br>
                                ¡Si se suscriben 3 amigos, obtendréis beneficios premium!
                            </p>
                            <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                                Enviado automáticamente cada lunes por Portal Trabajo IT.<br>
                                <a href="{visit_web_track}" style="color: #6366f1;">Visitar la web</a> · 
                                <a href="{base_url}/api/unsubscribe?email={email}" style="color: #9ca3af; text-decoration: underline;">Cancelar suscripción</a>
                            </p>
                        </div>
                    </div>
                    <!-- Pixel de Tracking Invisible -->
                    <img src="{base_url}/api/track-open?email={email}&campaign={campaign_name}" width="1" height="1" style="display:none;" />
                </body>
            </html>
            """
            
            # 6.4. Enviar el correo
            msg = MIMEMultipart()
            msg['From'] = f"Portal Trabajo IT <{os.getenv('EMAIL_USER')}>"
            msg['To'] = email
            msg['Subject'] = f"📅 Resumen Semanal: {total_included} Ofertas de Programación"
            msg.attach(MIMEText(email_body, 'html'))
            
            server.send_message(msg)
            print(f"  ✅ Enviado resumen semanal a: {email}")
            success_count += 1
            
        except Exception as e:
            print(f"  ⚠️ Error enviando resumen semanal a {email}: {e}")
            error_count += 1

    server.quit()
    cur.close()
    conn.close()
    print(f"🎉 Envío completado: {success_count} enviados, {error_count} fallidos.")
    print("===============================================")

if __name__ == "__main__":
    send_newsletter()
