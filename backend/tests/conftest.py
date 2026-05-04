import os
import pytest
import requests

BASE_URL = "https://a6522686-f800-45e0-acd7-ed01d9df0901.preview.emergentagent.com"


@pytest.fixture(scope="session")
def base_url() -> str:
    return BASE_URL


@pytest.fixture
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s
