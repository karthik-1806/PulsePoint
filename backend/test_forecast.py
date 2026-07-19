import json
import urllib.request
from unittest.mock import patch, MagicMock
import pytest

@pytest.fixture
def mock_responses():
    """Mock the API responses"""
    login_response = {"access_token": "test_token_123"}
    forecast_response = {"forecast": "data"}
    return login_response, forecast_response

def test_forecast(mock_responses):
    """Test forecast endpoint"""
    login_response, forecast_response = mock_responses
    
    with patch('urllib.request.urlopen') as mock_urlopen:
        # Mock the login response
        mock_login = MagicMock()
        mock_login.read.return_value = json.dumps(login_response).encode()
        
        # Mock the forecast response
        mock_forecast = MagicMock()
        mock_forecast.read.return_value = json.dumps(forecast_response).encode()
        
        # Configure mock to return different responses
        mock_urlopen.side_effect = [mock_login, mock_forecast]
        
        # Now run your test logic
        token = json.loads(
            urllib.request.urlopen(
                urllib.request.Request(
                    "http://localhost:8000/login",
                    data=b'{"role":"commander"}',
                    headers={"Content-Type": "application/json"},
                )
            )
            .read()
            .decode()
        )["access_token"]
        
        assert token == "test_token_123"
        
        result = urllib.request.urlopen(
            urllib.request.Request(
                "http://localhost:8000/forecast", 
                headers={"Authorization": "Bearer " + token}
            )
        ).read().decode()
        
        assert result == json.dumps(forecast_response)
