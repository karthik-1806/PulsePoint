import os
import json
import google.generativeai as genai

def generate_sustainability_suggestions(score_data: dict) -> dict:
    """Generates personalized fan and staff sustainability suggestions."""
    if not os.getenv("GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY") == "your_gemini_api_key_here":
         return {
             "fan_suggestions": [
                 "Taking the light rail instead of driving cuts your trip's footprint by ~70%.",
                 "Remember to use the designated recycling bins near the food concourse!"
             ],
             "staff_suggestions": [
                 "Add extra recycling stations near Gate C given predicted concession volume.",
                 "Ensure all stadium lights in Zone 2 are on energy-saving mode during daylight hours."
             ]
         }
         
    system_prompt = (
        "You are PulsePoint's Sustainability AI. "
        "Analyze the provided matchday green score, transport mix, and waste estimates. "
        "Generate actionable recommendations. "
        "Return a strict JSON object with exactly two keys: "
        "'fan_suggestions' (list of 2-3 strings tailored to attendees, e.g. promoting the light rail over driving) and "
        "'staff_suggestions' (list of 2-3 strings tailored to stadium operations, e.g. waste management). "
        "Keep them concise and encouraging."
    )
    
    try:
        model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=system_prompt)
        response = model.generate_content(
             json.dumps(score_data),
             generation_config=genai.types.GenerationConfig(
                 response_mime_type="application/json"
             )
        )
        return json.loads(response.text)
    except Exception as e:
        return {
            "fan_suggestions": [f"Error: {str(e)}"],
            "staff_suggestions": [f"Error: {str(e)}"]
        }
