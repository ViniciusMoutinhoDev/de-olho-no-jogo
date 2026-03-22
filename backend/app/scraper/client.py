from curl_cffi import requests
import logging

logger = logging.getLogger(__name__)

BASE_URL = "https://www.sofascore.com/api/v1"
IMAGE_URL = "https://api.sofascore.app/api/v1"
HEADERS = {"impersonate": "chrome110"}


def get(path: str, timeout: int = 10) -> dict | None:
    url = f"{BASE_URL}{path}"
    try:
        response = requests.get(url, impersonate="chrome110", timeout=timeout)
        if response.status_code == 200:
            return response.json()
        logger.warning(f"SofaScore {response.status_code}: {url}")
    except Exception as e:
        logger.error(f"Erro request {url}: {e}")
    return None


def team_image_url(team_id: int) -> str:
    return f"{IMAGE_URL}/team/{team_id}/image"
