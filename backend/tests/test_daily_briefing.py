import pytest
import json
from unittest.mock import patch, MagicMock
from ops_agent import generate_daily_briefing, DailyBriefingResponse

MOCK_VENUE_DATA = json.dumps({
    "gates": {
        "Gate A": {"density": 40},
        "Gate B": {"density": 85}
    },
    "weather": {"condition": "Rain", "temperature": 60},
    "parking": {"P1": 95, "P2": 40},
    "incidents": [{"id": 1, "status": "OPEN"}]
})

@patch("ops_agent.genai.GenerativeModel")
def test_generate_daily_briefing_success(mock_model_class):
    # Mock the Gemini model and its generate_content response
    mock_model = MagicMock()
    mock_model_class.return_value = mock_model
    
    # Mock valid JSON response
    mock_response = MagicMock()
    mock_response.text = json.dumps({
        "generated_at": "2024-01-01T12:00:00Z",
        "items": [
            {"type": "footfall", "message": "Gate B is busy."},
            {"type": "weather", "message": "It is raining."}
        ]
    })
    mock_model.generate_content.return_value = mock_response

    # Force os.getenv to return a dummy key so it bypasses the fallback check
    with patch("os.getenv", return_value="dummy_key"):
        result = generate_daily_briefing(MOCK_VENUE_DATA)

    assert "generated_at" in result
    assert len(result["items"]) == 2
    assert result["items"][0]["type"] == "footfall"
    assert result["items"][0]["message"] == "Gate B is busy."

@patch("ops_agent.genai.GenerativeModel")
def test_generate_daily_briefing_fallback_on_failure(mock_model_class):
    # Mock the Gemini model to raise an Exception (e.g. timeout)
    mock_model = MagicMock()
    mock_model_class.return_value = mock_model
    mock_model.generate_content.side_effect = Exception("API Timeout")

    with patch("os.getenv", return_value="dummy_key"):
        result = generate_daily_briefing(MOCK_VENUE_DATA)

    # It should gracefully handle the exception and return the deterministic fallback
    assert "generated_at" in result
    
    # Check that fallback items were generated
    types = [item["type"] for item in result["items"]]
    assert "footfall" in types
    assert "weather" in types
    assert "parking" in types
    assert "staffing" in types
    assert "incident" in types
    
    # Validate specific fallback logic from the mock data
    footfall_item = next(item for item in result["items"] if item["type"] == "footfall")
    assert "Gate B" in footfall_item["message"]
    
    weather_item = next(item for item in result["items"] if item["type"] == "weather")
    assert "Rain" in weather_item["message"]
