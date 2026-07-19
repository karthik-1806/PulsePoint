import math
from typing import Optional

from models import VolunteerRoster

# Simple Euclidean coordinates mapping for Lumen Field zones/gates
LOCATION_COORDS = {
    "GATE_1": (50, 50),
    "GATE_2": (100, 50),
    "GATE_3": (150, 50),
    "GATE_4": (200, 50),
    "GATE_5": (250, 50),
    "GATE_6": (300, 50),
    "GATE_7": (350, 50),
    "GATE_8": (400, 50),
    "ZONE_01": (100, 100),
    "ZONE_02": (200, 100),
    "ZONE_03": (300, 100),
    "ZONE_04": (100, 150),
    "ZONE_05": (200, 150),
    "ZONE_06": (300, 150),
    "ZONE_07": (100, 200),
    "ZONE_08": (200, 200),
    "ZONE_09": (300, 200),
    "ZONE_10": (100, 250),
    "ZONE_11": (200, 250),
    "ZONE_12": (300, 250),
}


def calculate_distance(loc1: str, loc2: str) -> float:
    """Calculates Euclidean distance between two known locations. Defaults to max if unknown."""
    coord1 = LOCATION_COORDS.get(loc1)
    coord2 = LOCATION_COORDS.get(loc2)
    if not coord1 or not coord2:
        return 999.0
    return math.sqrt((coord1[0] - coord2[0]) ** 2 + (coord1[1] - coord2[1]) ** 2)


def find_best_volunteer(
    incident_location: str, incident_desc: str, roster: VolunteerRoster
) -> Optional[dict]:
    """
    Deterministic matching: finds nearest volunteer, heavily weighting skill matches based
    on keywords in the incident description.
    """
    best_volunteer = None
    best_score = float("inf")  # Lower score is better

    desc_lower = incident_desc.lower()

    for vol in roster.volunteers:
        if not vol.assigned_zone_id:
            continue

        dist = calculate_distance(incident_location, vol.assigned_zone_id)

        # Skill weighting
        skill_penalty = 0
        if "medical" in desc_lower or "injured" in desc_lower or "hurt" in desc_lower:
            if "First Aid" in vol.skills:
                skill_penalty -= 200  # Heavy preference for medical skills

        if "lost" in desc_lower or "where" in desc_lower:
            if "Wayfinding" in vol.skills:
                skill_penalty -= 100

        if "spanish" in desc_lower or "español" in desc_lower:
            if "Language: Spanish" in vol.skills:
                skill_penalty -= 150

        # Final score = distance - skill_bonus
        score = dist + skill_penalty

        if score < best_score:
            best_score = score
            best_volunteer = vol

    if best_volunteer:
        return {
            "volunteer_id": best_volunteer.id,
            "name": best_volunteer.name,
            "skills": best_volunteer.skills,
            "current_location": best_volunteer.assigned_zone_id,
            "match_score": round(best_score, 2),
        }
    return None
