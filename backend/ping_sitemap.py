import urllib.request
import urllib.parse

import os

def ping_google_sitemap():
    frontend_url = os.getenv("FRONTEND_URL", "https://portalempleoit.es")
    sitemap_url = f"{frontend_url}/sitemap.xml"
    google_ping_url = f"https://www.google.com/ping?sitemap={urllib.parse.quote(sitemap_url)}"
    
    print(f"📡 Enviando ping del sitemap a Google: {sitemap_url}")
    try:
        req = urllib.request.Request(google_ping_url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req)
        if response.getcode() == 200:
            print("✅ Google Search Console notificado con éxito.")
        else:
            print(f"⚠️ Google devolvió un código inesperado: {response.getcode()}")
    except Exception as e:
        print(f"❌ Error al notificar a Google: {e}")

if __name__ == "__main__":
    ping_google_sitemap()
