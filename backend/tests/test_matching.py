from matching import find_best_volunteer
from models import Volunteer, VolunteerRoster


def test_matching_skill_weighting():
    """Verify that deterministic matching heavily weights the correct skills."""
    roster = VolunteerRoster(
        volunteers=[
            Volunteer(
                id="1", name="Alice", skills=["Wayfinding"], assigned_zone_id="ZONE_01"
            ),
            Volunteer(
                id="2",
                name="Bob",
                skills=["First Aid", "Language: Spanish"],
                assigned_zone_id="ZONE_05",
            ),
        ]
    )

    # Incident indicating a medical need
    incident_desc = "Fan injured their knee and needs medical attention."

    # Even if Alice is closer (say, at ZONE_01 and the incident is at ZONE_01),
    # Bob should win because of the heavy -200 penalty for First Aid.
    # Let's place the incident at ZONE_01.
    match = find_best_volunteer("ZONE_01", incident_desc, roster)

    assert match is not None
    assert match["name"] == "Bob", "Bob should be chosen due to medical skills"


def test_matching_distance():
    """Verify that without skill bonuses, distance is the deciding factor."""
    roster = VolunteerRoster(
        volunteers=[
            Volunteer(
                id="1", name="Alice", skills=["General"], assigned_zone_id="ZONE_01"
            ),
            Volunteer(
                id="2", name="Charlie", skills=["General"], assigned_zone_id="ZONE_10"
            ),
        ]
    )

    incident_desc = "Spilled drink, need cleanup."

    match = find_best_volunteer("ZONE_10", incident_desc, roster)

    assert match is not None
    assert match["name"] == "Charlie", "Charlie should be chosen due to proximity"
