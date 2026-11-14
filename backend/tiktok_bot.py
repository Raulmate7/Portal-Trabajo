import os
import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def upload_to_tiktok(video_path: str, title: str, description: str) -> bool:
    """Deshabilitado por defecto hasta configurar TIKTOK_ACCESS_TOKEN y ENABLE_TIKTOK_BOT=true (FUNC-022)."""
    if os.getenv("ENABLE_TIKTOK_BOT", "false").lower() != "true":
        logger.info("TikTok Bot deshabilitado (ENABLE_TIKTOK_BOT != true). Omitiendo ejecución.")
        return False
    access_token = os.getenv("TIKTOK_ACCESS_TOKEN")
    if not access_token:
        logger.warning("Falta TIKTOK_ACCESS_TOKEN; no es posible publicar en TikTok Content Posting API.")
        return False
    if not os.path.isfile(video_path):
        logger.error(f"Video file not found: {video_path}")
        return False
    logger.warning("Integración TikTok Content Posting API requiere flujo OAuth2 FILE_UPLOAD configurado.")
    return False


def run_tiktok_bot():
    if os.getenv("ENABLE_TIKTOK_BOT", "false").lower() != "true":
        logger.info("TikTok Bot omitido de forma controlada (ENABLE_TIKTOK_BOT=false).")
        return
    video_path = os.getenv('TIKTOK_VIDEO_PATH', 'output/shorts/video.mp4')
    title = os.getenv('TIKTOK_TITLE', 'Oferta IT del día')
    description = os.getenv('TIKTOK_DESCRIPTION', 'Descubre las mejores ofertas de empleo tech en España.')
    success = upload_to_tiktok(video_path, title, description)
    if success:
        logger.info('Uploaded video to TikTok successfully')
    else:
        logger.warning('TikTok upload skipped or failed')

if __name__ == '__main__':
    run_tiktok_bot()
