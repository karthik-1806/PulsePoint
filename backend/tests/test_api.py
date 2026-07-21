from fastapi.testclient import TestClient

from auth import create_access_token
from main import app

client = TestClient(app)


def test_fan_agent_endpoint():
    """Test the fan agent endpoint logic."""
    response = client.post(
        "/fan-agent", json={"query": "hello", "language": "English", "step_free": False}
    )
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert "route" in data


def test_login_endpoint():
    """Test JWT minting on login."""
    response = client.post("/login", json={"role": "commander"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_ops_agent_incident_unauthenticated():
    """Verify unauthorized users cannot hit ops-agent routes."""
    response = client.post(
        "/ops-agent/incident", json={"description": "Test", "location": "ZONE_01"}
    )
    assert response.status_code == 401


def test_ops_agent_incident_authenticated():
    """Verify authorized users can hit ops-agent routes."""
    token = create_access_token(data={"sub": "test", "role": "volunteer"})
    response = client.post(
        "/ops-agent/incident",
        json={"description": "Test", "location": "ZONE_01"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


def test_forecast_role_restriction():
    """Verify volunteer cannot access forecast."""
    token = create_access_token(data={"sub": "test", "role": "volunteer"})
    response = client.get("/forecast", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


def test_forecast_commander_access():
    """Verify commander can access forecast."""
    token = create_access_token(data={"sub": "test", "role": "commander"})
    response = client.get("/forecast", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
