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

# 2. Ejecutar el Scraper de Tecnoempleo (Nacional España)
print("\n[2/5] 🇪🇸 Ejecutando Tecnoempleo Scraper (scraper_spain.py)...")
exit_code = os.system(f"{python_bin} scraper_spain.py")
if exit_code != 0:
    print("⚠️ Advertencia: Tecnoempleo Scraper terminó con errores.")

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
print("\n[5/5] 🔍 Enviando nuevas ofertas a Google Indexing API (index_new_jobs.py)...")
exit_code = os.system(f"{python_bin} index_new_jobs.py")
if exit_code != 0:
    print("⚠️ Advertencia: El script de indexación terminó con errores.")

print("\n===============================================")
print("✅ PROCESO COMPLETADO. El sistema descansa.")
