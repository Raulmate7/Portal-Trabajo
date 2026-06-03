import os
import time

print("🚀 INICIANDO SISTEMA DE AGREGACIÓN DE EMPLEO...")
print("===============================================")

# 1. Ejecutar el Scraper Internacional (WWR, Remotive, JobFluent, RemoteOK, WorkingNomads)
print("\n[1/4] 🌎 Ejecutando Scrapers Internacionales (main.py)...")
exit_code = os.system("python3 main.py")
if exit_code != 0:
    print("⚠️ Advertencia: Algún scraper internacional terminó con errores.")

# 2. Ejecutar el Scraper de Tecnoempleo (Nacional España)
print("\n[2/4] 🇪🇸 Ejecutando Tecnoempleo Scraper (scraper_spain.py)...")
exit_code = os.system("python3 scraper_spain.py")
if exit_code != 0:
    print("⚠️ Advertencia: Tecnoempleo Scraper terminó con errores.")

# 3. Ejecutar el Scraper de Stratos (Nacional España — alternativo)
print("\n[3/4] 🇪🇸 Ejecutando Stratos Scraper (scraper_infoempleo.py)...")
exit_code = os.system("python3 scraper_infoempleo.py")
if exit_code != 0:
    print("⚠️ Advertencia: Stratos Scraper terminó con errores.")

# 4. Enviar Alertas a Telegram
# (Revisa la BD en busca de ofertas creadas en las últimas 7 horas y las envía)
print("\n[4/5] 📲 Enviando notificaciones a Telegram (telegram_bot.py)...")
exit_code = os.system("python3 telegram_bot.py")
if exit_code != 0:
    print("⚠️ Advertencia: Telegram bot terminó con errores.")

# 5. Indexar en Google
print("\n[5/5] 🔍 Enviando nuevas ofertas a Google Indexing API (index_new_jobs.py)...")
exit_code = os.system("python3 index_new_jobs.py")
if exit_code != 0:
    print("⚠️ Advertencia: El script de indexación terminó con errores.")

print("\n===============================================")
print("✅ PROCESO COMPLETADO. El sistema descansa.")
