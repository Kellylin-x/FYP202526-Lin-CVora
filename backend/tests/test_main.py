import pytest
from fastapi.testclient import TestClient
from main import app


client = TestClient(app)


def test_health_check():
    """Test that the application is running and responds to requests."""
    response = client.get("/")
    assert response.status_code == 200


def test_app_is_running():
    """Test that app instance exists and is a FastAPI app."""
    assert app is not None
    assert hasattr(app, "routes")
