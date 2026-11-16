import os
import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def upload_to_tiktok(video_path: str, title: str, description: str) -> bool:
    """TikTok Content Posting API integration is not implemented yet."""
    if not os.path.isfile(video_path):
        logger.error(f"Video file not found: {video_path}")
        return False
    raise NotImplementedError("TikTok Content Posting API integration is not implemented yet.")

def run_tiktok_bot():
    video_path = os.getenv('TIKTOK_VIDEO_PATH', 'output/shorts/video.mp4')
    title = os.getenv('TIKTOK_TITLE', 'Oferta IT del día')
    description = os.getenv('TIKTOK_DESCRIPTION', 'Descubre las mejores ofertas de empleo tech en España.')
    try:
        success = upload_to_tiktok(video_path, title, description)
    except NotImplementedError as exc:
        logger.error(str(exc))
        sys.exit(1)
    if not success:
        logger.error('Failed to upload video to TikTok')
        sys.exit(1)

if __name__ == '__main__':
    run_tiktok_bot()
