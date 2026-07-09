import os
import sys
import time

print("🚀 INICIANDO SISTEMA DE AGREGACIÓN DE EMPLEO...")
print("===============================================")

# Detectar el ejecutable de Python a usar (preferir venv si existe)
python_bin = "venv/bin/python3" if os.path.exists("venv/bin/python3") else "python3"
print(f"⚙️ Usando ejecutable: {python_bin}")

# 0. Ejecutar Migraciones de Base de Datos
print("\n[0/5] 🛠️ Ejecutando Migraciones de Base de Datos...")
os.system(f"{python_bin} add_referred_by_column.py")
os.system(f"{python_bin} add_reactions_table.py")

# 1. Ejecutar el Scraper Internacional (WWR, Remotive, JobFluent, RemoteOK, WorkingNomads, Himalayas, Python.org)
print("\n[1/5] 🌎 Ejecutando Scrapers Internacionales (main.py)...")
exit_code = os.system(f"{python_bin} main.py")
if exit_code != 0:
    print("⚠️ Advertencia: Algún scraper internacional terminó con errores.")

# 2. Ejecutar el Scraper de Tecnoempleo (Nacional España - Scrapy)
print("\n[2/5] 🇪🇸 Ejecutando Tecnoempleo Scraper (scrapy crawl job_spider)...")
scrapy_bin = "venv/bin/scrapy" if os.path.exists("venv/bin/scrapy") else "scrapy"
exit_code = os.system(f"{scrapy_bin} crawl job_spider")
if exit_code != 0:
    print("⚠️ Advertencia: Tecnoempleo Scraper (Scrapy) terminó con errores.")

# 3. Ejecutar el Scraper de Stratos (Nacional España)
print("\n[3/5] 🇪🇸 Ejecutando Stratos Scraper (scraper_infoempleo.py)...")
exit_code = os.system(f"{python_bin} scraper_infoempleo.py")
if exit_code != 0:
    print("⚠️ Advertencia: Stratos Scraper terminó con errores.")

# 4. Enviar Alertas a Telegram
# (Revisa la BD en busca de ofertas creadas en las últimas 7 horas y las envía)
print("\n[4/5] 📲 Enviando notificaciones a Telegram (telegram_bot.py)...")
exit_code = os.system(f"{python_bin} telegram_bot.py")
if exit_code != 0:
    print("⚠️ Advertencia: Telegram bot terminó con errores.")

# 4.1. Enviar Digest Diario a Telegram
print("\n[4.1/7] 📊 Enviando digest diario a Telegram (telegram_digest.py)...")
exit_code = os.system(f"{python_bin} telegram_digest.py")
if exit_code != 0:
    print("⚠️ Advertencia: Telegram digest terminó con errores.")

# 4.5. Publicar en LinkedIn
print("\n[4.5/7] 💼 Publicando ofertas en LinkedIn (linkedin_bot.py)...")
exit_code = os.system(f"{python_bin} linkedin_bot.py")
if exit_code != 0:
    print("⚠️ Advertencia: LinkedIn bot terminó con errores.")

# 4.6. Publicar en Twitter (X) - OMITIDO POR PETICIÓN DEL USUARIO
# print("\n[4.6/7] 🐦 Publicando ofertas en Twitter/X (twitter_bot.py)...")
# exit_code = os.system(f"{python_bin} twitter_bot.py")
# if exit_code != 0:
#     print("⚠️ Advertencia: Twitter bot terminó con errores.")

# 4.7. Publicar en Mastodon
print("\n[4.7/7] 🐘 Publicando ofertas en Mastodon (mastodon_bot.py)...")
exit_code = os.system(f"{python_bin} mastodon_bot.py")
if exit_code != 0:
    print("⚠️ Advertencia: Mastodon bot terminó con errores.")

# 5. Indexar en Google
print("\n[5/7] 🔍 Enviando nuevas ofertas a Google Indexing API (index_new_jobs.py)...")
exit_code = os.system(f"{python_bin} index_new_jobs.py")
if exit_code != 0:
    print("⚠️ Advertencia: El script de indexación terminó con errores.")

# 5.5 Ping a Google Sitemap
print("\n[5.5/7] 📡 Avisando a Google del nuevo Sitemap (ping_sitemap.py)...")
os.system(f"{python_bin} ping_sitemap.py")

# 6. Desactivar y Desindexar ofertas expiradas (>30 días)
print("\n[6/7] 🧹 Limpiando y desindexando ofertas expiradas (deactivate_expired_jobs.py)...")
exit_code = os.system(f"{python_bin} deactivate_expired_jobs.py")
if exit_code != 0:
    print("⚠️ Advertencia: El script de limpieza de expirados terminó con errores.")

# 7. Enviar Alertas Personalizadas por Email
print("\n[7/7] 📧 Enviando alertas personalizadas de empleo (send_custom_alerts.py)...")
exit_code = os.system(f"{python_bin} send_custom_alerts.py")
if exit_code != 0:
    print("⚠️ Advertencia: Las alertas personalizadas terminaron con errores.")

# 7.1. Procesar Onboarding de Email (2 pasos)
print("\n[7.1/7] 📧 Procesando Onboarding de Email (send_welcome_onboarding.py)...")
exit_code = os.system(f"{python_bin} send_welcome_onboarding.py")
if exit_code != 0:
    print("⚠️ Advertencia: El script de onboarding terminó con errores.")

# 7.1.1. Procesar Reactivación y Limpieza de Email (Suscriptores Inactivos)
print("\n[7.1.1/7] 📧 Procesando Reactivación y Limpieza (send_reactivation.py)...")
exit_code = os.system(f"{python_bin} send_reactivation.py")
if exit_code != 0:
    print("⚠️ Advertencia: El script de reactivación terminó con errores.")

# 7.2. Enviar Alertas de Ofertas Destacadas al Instante
print("\n[7.2/7] 🚨 Enviando alertas de ofertas destacadas (send_instant_featured_alerts.py)...")
exit_code = os.system(f"{python_bin} send_instant_featured_alerts.py")
if exit_code != 0:
    print("⚠️ Advertencia: El script de alertas destacadas terminó con errores.")

# 7.3. Enviar Notificaciones Push
print("\n[7.3/7] 🔔 Enviando notificaciones push (send_push_notifications.py)...")
exit_code = os.system(f"{python_bin} send_push_notifications.py")
if exit_code != 0:
    print("⚠️ Advertencia: El script de notificaciones push terminó con errores.")

# 7.4. Generar Artículo de Blog Semanal (Gemini + SEO)
print("\n[7.4/7] ✍️ Comprobando y generando post de blog semanal (generate_weekly_article.py)...")
exit_code = os.system(f"{python_bin} generate_weekly_article.py")
if exit_code != 0:
    print("⚠️ Advertencia: El script de generación de blog semanal terminó con errores o no está configurado.")

# 7.5. Generar Artículo de Tendencias Semanal desde la BD
print("\n[7.5/9] 📈 Generando artículo de tendencias de empleo tech (generate_trends_post.py)...")
exit_code = os.system(f"{python_bin} generate_trends_post.py")
if exit_code != 0:
    print("⚠️ Advertencia: El script de tendencias semanales terminó con errores.")

# 7.6. Enviar Recordatorios de Racha (Usuarios a punto de perder su racha diaria)
print("\n[7.6/9] 🔥 Enviando recordatorios de racha (send_streak_reminder.py)...")
exit_code = os.system(f"{python_bin} send_streak_reminder.py")
if exit_code != 0:
    print("⚠️ Advertencia: El script de recordatorios de racha terminó con errores.")

# 7.7. Enviar Recordatorios de Ofertas Guardadas (48h después de guardar)
print("\n[7.7/9] ⭐ Enviando recordatorios de ofertas guardadas (send_saved_jobs_reminder.py)...")
exit_code = os.system(f"{python_bin} send_saved_jobs_reminder.py")
if exit_code != 0:
    print("⚠️ Advertencia: El script de recordatorios de ofertas guardadas terminó con errores.")

print("\n===============================================")
print("✅ PROCESO COMPLETADO. El sistema descansa.")
