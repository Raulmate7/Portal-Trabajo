import os
from PIL import Image, ImageDraw, ImageFont

def draw_gradient(draw, width, height, color1, color2):
    """Dibuja un gradiente vertical de color1 a color2."""
    for y in range(height):
        r = int(color1[0] + (color2[0] - color1[0]) * y / height)
        g = int(color1[1] + (color2[1] - color1[1]) * y / height)
        b = int(color1[2] + (color2[2] - color1[2]) * y / height)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

def wrap_text(text, font, max_width):
    """Divide el texto en líneas para que se ajuste al ancho máximo en píxeles."""
    words = text.split()
    lines = []
    current_line = []
    
    for word in words:
        current_line.append(word)
        line_str = " ".join(current_line)
        # Usamos font.getbbox para obtener el ancho
        bbox = font.getbbox(line_str)
        width = bbox[2] - bbox[0]
        
        if width > max_width:
            if len(current_line) == 1:
                # La palabra es más larga que max_width, la añadimos igualmente y cortamos
                lines.append(line_str)
                current_line = []
            else:
                current_line.pop()
                lines.append(" ".join(current_line))
                current_line = [word]
                
    if current_line:
        lines.append(" ".join(current_line))
        
    return lines

def generate_job_card(title, company, location, salary=None, output_path="card.jpg"):
    """
    Genera una imagen de tarjeta de oferta de 1200x630 píxeles.
    """
    width, height = 1200, 630
    
    # 1. Crear lienzo de imagen base (RGB)
    img = Image.new("RGB", (width, height), color=(15, 23, 42))
    draw = ImageDraw.Draw(img)
    
    # 2. Dibujar gradiente premium (de azul cobalto oscuro a púrpura profundo)
    color_top = (10, 15, 30)      # #0a0f1e
    color_bottom = (30, 20, 55)   # #1e1437
    draw_gradient(draw, width, height, color_top, color_bottom)
    
    # 3. Dibujar efecto de resplandor radial en la esquina superior derecha (capa con transparencia)
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    
    # Dibujamos círculos concéntricos semi-transparentes para el brillo
    glow_center = (1000, 100)
    for radius in range(400, 0, -10):
        alpha = int(18 * (1 - radius / 400)) # Max 18 de opacidad en el centro
        overlay_draw.ellipse(
            [glow_center[0] - radius, glow_center[1] - radius, glow_center[0] + radius, glow_center[1] + radius],
            fill=(99, 102, 241, alpha) # Color índigo (#6366f1) con opacidad
        )
    
    # Combinar el fondo y el resplandor
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)
    
    # 4. Configurar fuentes
    font_dir = "/usr/share/fonts/truetype/noto"
    font_bold_path = os.path.join(font_dir, "NotoSans-Bold.ttf")
    font_reg_path = os.path.join(font_dir, "NotoSans-Regular.ttf")
    
    # Cargar fuentes o usar default si fallan
    try:
        font_header = ImageFont.truetype(font_bold_path, 28)
        font_title = ImageFont.truetype(font_bold_path, 48)
        font_company = ImageFont.truetype(font_bold_path, 34)
        font_details = ImageFont.truetype(font_reg_path, 28)
        font_footer = ImageFont.truetype(font_bold_path, 26)
    except Exception as e:
        print(f"⚠️ No se pudieron cargar las fuentes NotoSans ({e}). Usando fuente por defecto.")
        # Fallback a default font (los tamaños son fijos en default font de PIL)
        font_header = ImageFont.load_default()
        font_title = ImageFont.load_default()
        font_company = ImageFont.load_default()
        font_details = ImageFont.load_default()
        font_footer = ImageFont.load_default()
        
    # 5. Dibujar cabecera (Portal Trabajo IT + línea acento)
    accent_color = (251, 191, 36) # Amber/Gold (#fbbf24)
    text_header = "🚀  PORTAL TRABAJO IT  |  EMPLEO TECNOLÓGICO"
    draw.text((80, 70), text_header, fill=accent_color, font=font_header)
    
    # Línea decorativa delgada
    draw.line([(80, 120), (1120, 120)], fill=(99, 102, 241, 100), width=2)
    
    # 6. Dibujar Título del Puesto (ajuste automático)
    max_text_width = 1040
    title_lines = wrap_text(title, font_title, max_text_width)
    
    # Dibujar las líneas del título
    y_cursor = 170
    for line in title_lines[:3]: # Limitamos a 3 líneas
        draw.text((80, y_cursor), line, fill=(255, 255, 255), font=font_title)
        bbox = font_title.getbbox(line)
        line_height = bbox[3] - bbox[1] if (bbox[3] - bbox[1]) > 0 else 55
        y_cursor += line_height + 10
        
    # 7. Dibujar Empresa (desplazado dinámicamente)
    y_cursor = max(y_cursor + 15, 330)
    company_text = f"🏢  {company}"
    draw.text((80, y_cursor), company_text, fill=(243, 244, 246), font=font_company)
    
    # 8. Dibujar Detalles (Ubicación y Salario)
    y_cursor += 65
    details_text = f"📍 {location}"
    if salary and salary != "Consultar" and salary.strip() != "":
        details_text += f"   •   💰 {salary}"
        
    draw.text((80, y_cursor), details_text, fill=(156, 163, 175), font=font_details)
    
    # 9. Dibujar botón / llamada a la acción en el pie de página
    # Fondo del botón
    btn_x1, btn_y1 = 80, 515
    btn_x2, btn_y2 = 480, 568
    # Dibujar rectángulo redondeado
    draw.rounded_rectangle([btn_x1, btn_y1, btn_x2, btn_y2], radius=8, fill=(79, 70, 229)) # Indigo-600
    
    # Texto del botón
    btn_text = "Postularse en portalempleoit.es"
    # Centrar texto en el botón
    bbox_btn = font_footer.getbbox(btn_text)
    btn_w = bbox_btn[2] - bbox_btn[0]
    btn_h = bbox_btn[3] - bbox_btn[1]
    
    text_x = btn_x1 + (btn_x2 - btn_x1 - btn_w) // 2
    text_y = btn_y1 + (btn_y2 - btn_y1 - btn_h) // 2 - 2
    draw.text((text_x, text_y), btn_text, fill=(255, 255, 255), font=font_footer)
    
    # 10. Guardar la imagen
    img.save(output_path, "JPEG", quality=85, optimize=True)
    print(f"📸 Tarjeta generada con éxito y guardada en {output_path}")

if __name__ == "__main__":
    # Test rápido de generación
    generate_job_card(
        title="Senior React Developer (Teletrabajo 100%) con inglés fluido",
        company="Stark Industries Europe",
        location="Remoto (España)",
        salary="45.000€ - 55.000€ brutos/año",
        output_path="test_card.png"
    )
