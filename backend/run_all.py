import os
import time

print("🚀 INICIANDO SISTEMA DE AGREGACIÓN DE EMPLEO...")
print("===============================================")

# 1. Ejecutar el Scraper de Reddit (Internacional/Remoto)
print("\n[1/4] 🌎 Ejecutando Reddit Scraper (main.py)...")
exit_code = os.system("python3 main.py")
if exit_code != 0:
    print("⚠️ Advertencia: Reddit Scraper terminó con errores o no encontró ofertas.")

# 2. Ejecutar el Scraper de Tecnoempleo (Nacional España)
print("\n[2/4] 🇪🇸 Ejecutando Tecnoempleo Scraper (scraper_spain.py)...")
os.system("python3 scraper_spain.py")

# 3. Ejecutar el Scraper de Infoempleo (Nacional España - Alternativo)
print("\n[3/4] 🇪🇸 Ejecutando Infoempleo Scraper (scraper_infoempleo.py)...")
os.system("python3 scraper_infoempleo.py")

# 4. Enviar Alertas a Telegram
# (Este script revisa la BD en busca de ofertas creadas hace poco y las envía)
print("\n[4/4] 📲 Enviando notificaciones a Telegram (telegram_bot.py)...")
os.system("python3 telegram_bot.py")

print("\n===============================================")
print("✅ PROCESO COMPLETADO. El sistema descansa.")
