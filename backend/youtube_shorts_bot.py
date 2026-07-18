import os
import sys
import shutil
import requests
import psycopg2
import subprocess
from datetime import datetime
import time
from PIL import Image, ImageDraw, ImageFont
from logic.slug import get_job_slug

def draw_gradient(draw, width, height, color1, color2):
    for y in range(height):
        r = int(color1[0] + (color2[0] - color1[0]) * y / height)
        g = int(color1[1] + (color2[1] - color1[1]) * y / height)
        b = int(color1[2] + (color2[2] - color1[2]) * y / height)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

def wrap_text(text, font, max_width):
    words = text.split()
    lines = []
    current_line = []
    
    for word in words:
        current_line.append(word)
        line_str = " ".join(current_line)
        bbox = font.getbbox(line_str)
        width = bbox[2] - bbox[0]
        
        if width > max_width:
            if len(current_line) == 1:
                lines.append(line_str)
                current_line = []
            else:
                current_line.pop()
                lines.append(" ".join(current_line))
                current_line = [word]
                
    if current_line:
        lines.append(" ".join(current_line))
        
    return lines

def generate_shorts_card(title, company, location, salary=None, output_path="shorts_card.jpg"):
    """
    Genera una imagen vertical de 1080x1920 píxeles para formato Shorts (9:16).
    """
    width, height = 1080, 1920
    
    # 1. Crear lienzo de imagen
    img = Image.new("RGB", (width, height), color=(15, 23, 42))
    draw = ImageDraw.Draw(img)
    
    # 2. Dibujar gradiente vertical premium
    color_top = (10, 15, 30)      # #0a0f1e
    color_bottom = (30, 20, 55)   # #1e1437
    draw_gradient(draw, width, height, color_top, color_bottom)
    
    # 3. Dibujar resplandor radial en el centro
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    glow_center = (540, 960)
    for radius in range(600, 0, -15):
        alpha = int(22 * (1 - radius / 600))
        overlay_draw.ellipse(
            [glow_center[0] - radius, glow_center[1] - radius, glow_center[0] + radius, glow_center[1] + radius],
            fill=(99, 102, 241, alpha)
        )
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)
    
    # 4. Cargar fuentes
    font_dir = "/usr/share/fonts/truetype/noto"
    font_bold_path = os.path.join(font_dir, "NotoSans-Bold.ttf")
    font_reg_path = os.path.join(font_dir, "NotoSans-Regular.ttf")
    
    try:
        font_header = ImageFont.truetype(font_bold_path, 36)
        font_title = ImageFont.truetype(font_bold_path, 60)
        font_company = ImageFont.truetype(font_bold_path, 44)
        font_details = ImageFont.truetype(font_reg_path, 38)
        font_footer = ImageFont.truetype(font_bold_path, 34)
    except Exception as e:
        print(f"⚠️ No se pudieron cargar las fuentes NotoSans ({e}). Usando fuentes por defecto.")
        font_header = font_title = font_company = font_details = font_footer = ImageFont.load_default()
        
    # 5. Cabecera (centrada)
    text_header = "🚀  PORTAL TRABAJO IT"
    bbox_header = font_header.getbbox(text_header)
    w_h = bbox_header[2] - bbox_header[0]
    draw.text(((width - w_h) // 2, 250), text_header, fill=(251, 191, 36), font=font_header)
    
    # Línea decorativa
    draw.line([(150, 320), (930, 320)], fill=(99, 102, 241, 120), width=4)
    
    # 6. Título de la vacante (centrado y ajustado)
    y_cursor = 500
    title_lines = wrap_text(title, font_title, 800)
    for line in title_lines[:4]:
        bbox_l = font_title.getbbox(line)
        w_l = bbox_l[2] - bbox_l[0]
        h_l = bbox_l[3] - bbox_l[1] if (bbox_l[3] - bbox_l[1]) > 0 else 70
        draw.text(((width - w_l) // 2, y_cursor), line, fill=(255, 255, 255), font=font_title)
        y_cursor += h_l + 20
        
    # 7. Empresa
    y_cursor = max(y_cursor + 60, 950)
    company_text = f"🏢  {company}"
    bbox_c = font_company.getbbox(company_text)
    w_c = bbox_c[2] - bbox_c[0]
    draw.text(((width - w_c) // 2, y_cursor), company_text, fill=(243, 244, 246), font=font_company)
    
    # 8. Detalles (Ubicación y Salario)
    y_cursor += 120
    details_text = f"📍 {location}"
    bbox_d = font_details.getbbox(details_text)
    w_d = bbox_d[2] - bbox_d[0]
    draw.text(((width - w_d) // 2, y_cursor), details_text, fill=(156, 163, 175), font=font_details)
    
    if salary and salary != "Consultar" and salary.strip() != "":
        y_cursor += 70
        sal_text = f"💰 {salary}"
        bbox_s = font_details.getbbox(sal_text)
        w_s = bbox_s[2] - bbox_s[0]
        draw.text(((width - w_s) // 2, y_cursor), sal_text, fill=(52, 211, 153), font=font_details)
        
    # 9. Botón/Llamada a la acción inferior
    btn_x1, btn_y1 = 200, 1500
    btn_x2, btn_y2 = 880, 1600
    draw.rounded_rectangle([btn_x1, btn_y1, btn_x2, btn_y2], radius=15, fill=(79, 70, 229))
    
    btn_text = "Postularse en portalempleoit.es"
    bbox_btn = font_footer.getbbox(btn_text)
    btn_w = bbox_btn[2] - bbox_btn[0]
    btn_h = bbox_btn[3] - bbox_btn[1]
    
    text_x = btn_x1 + (btn_x2 - btn_x1 - btn_w) // 2
    text_y = btn_y1 + (btn_y2 - btn_y1 - btn_h) // 2 - 2
    draw.text((text_x, text_y), btn_text, fill=(255, 255, 255), font=font_footer)
    
    # 10. Guardar la imagen
    img.save(output_path, "JPEG", quality=85, optimize=True)
    print(f"📸 Tarjeta vertical Shorts generada en {output_path}")

def build_shorts_video(image_path, output_mp4):
    """
    Usa ffmpeg para combinar la imagen con audio silencioso
    y generar un video de 15 segundos compatible con YouTube Shorts.
    """
    print("🎬 Construyendo video con ffmpeg...")
    # Comando para generar video con audio silencioso
    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
        "-loop", "1", "-i", image_path,
        "-c:v", "libx264", "-t", "15",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-shortest",
        output_mp4
    ]
    
    try:
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=30)
        if res.returncode == 0:
            print(f"✅ Video Shorts construido con éxito: {output_mp4}")
            return True
        else:
            print(f"⚠️ Error al construir video con ffmpeg (Código {res.returncode}): {res.stderr}")
            return False
    except Exception as e:
        print(f"❌ Error ejecutando ffmpeg: {e}")
        return False

def get_youtube_access_token(client_id, client_secret, refresh_token):
    """
    Obtiene un access token de Google usando el refresh token.
    """
    url = "https://oauth2.googleapis.com/token"
    payload = {
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token"
    }
    try:
        res = requests.post(url, json=payload, timeout=15)
        if res.status_code == 200:
            return res.json().get("access_token")
        else:
            print(f"⚠️ Error al obtener access token de YouTube (Código {res.status_code}): {res.text}")
            return None
    except Exception as e:
        print(f"❌ Error conectando con el servidor de autenticación de Google: {e}")
        return None

def upload_video_to_youtube(access_token, video_path, title, description):
    """
    Sube un video a YouTube usando multipart upload de la API v3.
    """
    print(f"📤 Subiendo video a YouTube: {video_path}...")
    url = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    metadata = {
        "snippet": {
            "title": title[:100],
            "description": description[:5000],
            "tags": ["shorts", "empleoit", "empleotech", "programacion", "desarrollosoftware"],
            "categoryId": "22"  # People & Blogs
        },
        "status": {
            "privacyStatus": "public",
            "selfDeclaredMadeForKids": False
        }
    }
    
    try:
        # Preparar cuerpo multipart/related
        files = {
            'metadata': (None, requests.utils.to_key_val_list(metadata), 'application/json; charset=UTF-8'),
            'media': (os.path.basename(video_path), open(video_path, 'rb'), 'video/mp4')
        }
        
        # Enviar petición POST usando requests multipart
        # (requests construye el boundary multipart automáticamente si usamos files)
        # Nota: La API de Google requiere que los campos se envíen en un orden particular si no se usa multipart/related estricto, 
        # pero para simplificar, usaremos un flujo simplificado o multipart directo.
        
        # Flujo de multipart resumible o directo:
        # En la API de Google, para multipart simple:
        # Construimos el boundary multipart de forma manual para asegurar el tipo multipart/related exacto.
        import uuid
        boundary = f"boundary_{uuid.uuid4()}"
        
        headers["Content-Type"] = f"multipart/related; boundary={boundary}"
        
        # Construir cuerpo del mensaje
        metadata_json = requests.models.json.dumps(metadata)
        with open(video_path, 'rb') as f:
            video_bytes = f.read()
            
        body = (
            f"--{boundary}\r\n"
            f"Content-Type: application/json; charset=UTF-8\r\n\r\n"
            f"{metadata_json}\r\n"
            f"--{boundary}\r\n"
            f"Content-Type: video/mp4\r\n\r\n"
        ).encode('utf-8') + video_bytes + f"\r\n--{boundary}--\r\n".encode('utf-8')
        
        res = requests.post(url, data=body, headers=headers, timeout=120)
        
        if res.status_code in (200, 201):
            res_data = res.json()
            print(f"✅ ¡Video subido con éxito! ID del Video: {res_data.get('id')}")
            return res_data.get("id")
        else:
            print(f"⚠️ Error al subir video a la API de YouTube (Código {res.status_code}): {res.text}")
            return None
    except Exception as e:
        print(f"❌ Excepción durante la subida de video a YouTube: {e}")
        return None

def run_youtube_shorts_bot():
    print("===============================================")
    print("🤖 INICIANDO BOT DE YOUTUBE SHORTS")

    # 1. Configurar credenciales
    client_id = os.getenv("YOUTUBE_CLIENT_ID")
    client_secret = os.getenv("YOUTUBE_CLIENT_SECRET")
    refresh_token = os.getenv("YOUTUBE_REFRESH_TOKEN")
    db_url = os.getenv("DATABASE_URL")
    frontend_url = os.getenv("FRONTEND_URL", "https://portalempleoit.com")

    # 2. Verificar ffmpeg
    has_ffmpeg = shutil.which("ffmpeg") is not None
    if not has_ffmpeg:
        print("⚠️  No se encontró ffmpeg en el sistema. Omitiendo bot de YouTube Shorts de forma controlada.")
        print("===============================================")
        return

    if not client_id or not client_secret or not refresh_token:
        print("⚠️  Faltan credenciales de YouTube en las variables de entorno.")
        print("   Omitiendo la publicación automática en YouTube de forma controlada.")
        print("===============================================")
        return

    if not db_url:
        print("❌ Error: No se encontró la variable DATABASE_URL.")
        print("===============================================")
        return

    # 3. Conectar a Base de Datos y obtener ofertas no publicadas en YouTube
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        query = """
            SELECT id, title, company, location, salary, category 
            FROM jobs 
            WHERE is_active = TRUE AND last_youtube_posted_at IS NULL
            ORDER BY created_at DESC 
            LIMIT 5
        """
        cur.execute(query)
        jobs = cur.fetchall()
        
    except Exception as e:
        print(f"❌ Error consultando PostgreSQL/MySQL: {e}")
        print("===============================================")
        return

    if not jobs:
        print("💡 No hay ofertas nuevas sin publicar en YouTube Shorts. Saliendo.")
        cur.close()
        conn.close()
        print("===============================================")
        return

    # Publicar máximo 1 Shorts por ejecución para no exceder cuotas de API diarias (10.000 unidades)
    job = jobs[0]
    job_id, title, company, location, salary, category = job
    job_slug = get_job_slug(job_id, title, location, company)
    job_link = f"{frontend_url}/job/{job_slug}"

    print(f"📣 Seleccionada oferta para YouTube Shorts: {title} en {company}")

    # Paso 1: Generar la tarjeta de imagen vertical
    image_path = f"shorts_card_{job_id}.jpg"
    video_path = f"shorts_video_{job_id}.mp4"
    
    try:
        generate_shorts_card(
            title=title,
            company=company,
            location=location,
            salary=salary,
            output_path=image_path
        )
    except Exception as img_err:
        print(f"❌ Error generando la tarjeta de imagen: {img_err}")
        cur.close()
        conn.close()
        return

    # Paso 2: Crear el video con ffmpeg
    video_created = build_shorts_video(image_path, video_path)
    
    # Limpiar imagen temporal
    if os.path.exists(image_path):
        os.remove(image_path)
        
    if not video_created:
        print("❌ Error al construir el archivo de video.")
        cur.close()
        conn.close()
        return

    # Paso 3: Obtener access token de la API de YouTube
    access_token = get_youtube_access_token(client_id, client_secret, refresh_token)
    if not access_token:
        print("❌ Error al autenticar con la API de YouTube.")
        if os.path.exists(video_path):
            os.remove(video_path)
        cur.close()
        conn.close()
        return

    # Paso 4: Subir a YouTube
    video_title = f"Oferta de Empleo IT: {title} en {company} #shorts"[:100]
    
    salary_text = f" con salario {salary}" if (salary and salary != "Consultar" and salary.strip() != "") else ""
    video_description = (
        f"¿Buscas empleo como desarrollador en España? Se busca {title} en {company} ({location}){salary_text}.\n\n"
        f"👉 Aplica e inscríbete a la oferta completa aquí:\n"
        f"{job_link}?utm_source=youtube&utm_medium=social&utm_campaign=shorts_video\n\n"
        f"Acuérdate de suscribirte a nuestro canal para no perderte ninguna oferta de empleo IT destacada en España.\n\n"
        f"#shorts #empleotech #empleoit #trabajoit #desarrollosoftware #programacion"
    )
    
    youtube_video_id = upload_video_to_youtube(access_token, video_path, video_title, video_description)
    
    # Limpiar video temporal
    if os.path.exists(video_path):
        os.remove(video_path)

    # Paso 5: Actualizar la BD si se subió correctamente
    if youtube_video_id:
        try:
            cur.execute("UPDATE jobs SET last_youtube_posted_at = %s WHERE id = %s", (datetime.now(), job_id))
            conn.commit()
            print(f"💾 BD actualizada para oferta {job_id} (YouTube Shorts).")
        except Exception as db_err:
            print(f"⚠️ Error al actualizar last_youtube_posted_at en BD: {db_err}")

    cur.close()
    conn.close()
    print("===============================================")

if __name__ == "__main__":
    run_youtube_shorts_bot()
