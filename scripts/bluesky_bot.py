import os
import sys
import logging
from atproto import Client, models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_bluesky_bot():
    handle = os.getenv('BLUESKY_HANDLE')
    password = os.getenv('BLUESKY_PASSWORD')
    if not handle or not password:
        logger.error('Missing BLUESKY_HANDLE or BLUESKY_PASSWORD environment variables')
        return
    try:
        client = Client(base_url='https://bsky.social')
        client.login(handle, password)
        # Example: post a simple message about a random tech interview
        tech = 'React'
        message = f"💡 Consejo de entrevista: prepararse con preguntas de {tech} mejora tus posibilidades. #EntrevistaTech"
        client.send_post(models.Post(text=message))
        logger.info('Posted to Bluesky successfully')
    except Exception as e:
        logger.exception(f'Error posting to Bluesky: {e}')


if __name__ == '__main__':
    run_bluesky_bot()
