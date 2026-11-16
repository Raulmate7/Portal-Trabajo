import os
import sys
import logging
from atproto import Client, models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_bluesky_bot():
    """Deprecated duplicate script; use backend/bluesky_bot.py instead."""
    logger.error(
        'scripts/bluesky_bot.py is deprecated and disabled to avoid duplicate/hardcoded posts. '
        'Use backend/bluesky_bot.py instead.'
    )
    sys.exit(1)


if __name__ == '__main__':
    run_bluesky_bot()
