from datetime import datetime, timedelta
import random
from models import (
    Gate, GateStatus, Zone, Sensor, TransitLine, WeatherSnapshot,
    Volunteer, VolunteerRoster, FixtureSchedule, VenueSnapshot
)

def generate_mock_venue_snapshot() -> VenueSnapshot:
    """Generates realistic mock data for Lumen Field."""
    
    # 1. Gates (8 gates)
    gates = [
        Gate(id=f"GATE_{i}", name=f"Gate {i}", status=random.choice(list(GateStatus)), wait_time_minutes=random.randint(0, 30))
        for i in range(1, 9)
    ]
    
    # 2. Zones (12 concourse zones)
    zones = [
        Zone(id=f"ZONE_{i:02d}", name=f"Concourse Zone {i}", density_percent=random.uniform(10.0, 80.0))
        for i in range(1, 13)
    ]
    
    # 3. Sensors (20 crowd-density sensors)
    sensors = []
    for i in range(1, 21):
        zone_id = random.choice(zones).id
        sensors.append(
            Sensor(id=f"SENS_{i:03d}", zone_id=zone_id, density_percent=random.uniform(5.0, 95.0))
        )
        
    # 4. Transit Lines (3 lines)
    transit = [
        TransitLine(id="TL_LR", type="light_rail", status="On Time", next_arrival_minutes=5),
        TransitLine(id="TL_BUS", type="bus", status="Delayed", next_arrival_minutes=12),
        TransitLine(id="TL_FRY", type="ferry", status="On Time", next_arrival_minutes=45),
    ]
    
    # 5. Weather
    weather = WeatherSnapshot(
        temperature_f=68.5,
        condition="Partly Cloudy",
        wind_speed_mph=5.2
    )
    
    # 6. Volunteer Roster (20 people)
    skills_pool = ["First Aid", "Wayfinding", "Ticketing", "Crowd Control", "Language: Spanish"]
    volunteers = []
    for i in range(1, 21):
        assigned_zone = random.choice(zones).id if random.random() > 0.2 else None
        volunteers.append(
            Volunteer(
                id=f"VOL_{i:03d}",
                name=f"Volunteer {i}",
                skills=random.sample(skills_pool, k=random.randint(1, 3)),
                assigned_zone_id=assigned_zone
            )
        )
    roster = VolunteerRoster(volunteers=volunteers)
    
    # 7. Fixture Schedule (1 upcoming)
    fixture = FixtureSchedule(
        home_team="USA",
        away_team="Spain",
        kickoff_time=datetime.utcnow() + timedelta(hours=3),
        match_status="Scheduled"
    )
    
    return VenueSnapshot(
        gates=gates,
        zones=zones,
        sensors=sensors,
        transit=transit,
        weather=weather,
        incidents=[],
        roster=roster,
        fixture=fixture
    )
