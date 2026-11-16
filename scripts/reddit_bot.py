import os
import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def post_to_reddit(title: str, url: str) -> bool:
    """Reddit PRAW integration is not implemented yet."""
    required_vars = [
        "REDDIT_CLIENT_ID",
        "REDDIT_CLIENT_SECRET",
        "REDDIT_USERNAME",
        "REDDIT_PASSWORD",
        "REDDIT_USER_AGENT",
    ]
    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        logger.error(f"Missing Reddit credentials: {missing}")
        return False
    raise NotImplementedError("Reddit PRAW posting integration is not implemented yet.")

def run_reddit_bot():
    title = os.getenv("REDDIT_POST_TITLE", "Oferta IT del día – Portal Empleo IT")
    url = os.getenv("REDDIT_POST_URL", "https://portalempleoit.com")
    try:
        success = post_to_reddit(title, url)
    except NotImplementedError as exc:
        logger.error(str(exc))
        sys.exit(1)
    if not success:
        logger.error("Failed to publish Reddit post")
        sys.exit(1)

if __name__ == "__main__":
    run_reddit_bot()
