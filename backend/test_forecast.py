import json
import urllib.request
from unittest.mock import patch, MagicMock
import pytest

def create_mock_response(data):
    """Create a mock response object with proper chaining"""
    mock_resp = MagicMock()
    mock_resp.read.return_value.decode.return_value = json.dumps(data)
    return mock_resp

def test_forecast():
    """Test forecast endpoint"""
    login_response = {"access_token": "test_token_123"}
    forecast_response = {"forecast": "data"}
    
    with patch('urllib.request.urlopen') as mock_urlopen:
        mock_urlopen.side_effect = [
            create_mock_response(login_response),
            create_mock_response(forecast_response)
        ]
        
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
