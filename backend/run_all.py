import os
import sys
import time

print("🚀 INICIANDO SISTEMA DE AGREGACIÓN DE EMPLEO...")
print("===============================================")

# Detectar el ejecutable de Python a usar (preferir venv si existe)
python_bin = "venv/bin/python3" if os.path.exists("venv/bin/python3") else "python3"
print(f"⚙️ Usando ejecutable: {python_bin}")

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

print("\n===============================================")
print("✅ PROCESO COMPLETADO. El sistema descansa.")
