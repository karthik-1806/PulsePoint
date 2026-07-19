from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

class GateStatus(str, Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    RESTRICTED = "RESTRICTED"

class Gate(BaseModel):
    id: str = Field(..., description="Unique identifier for the gate (e.g., 'GATE_A')")
    name: str = Field(..., description="Human-readable name of the gate")
    status: GateStatus = Field(..., description="Current operational status of the gate")
    wait_time_minutes: int = Field(0, description="Estimated wait time in minutes")

class Zone(BaseModel):
    id: str = Field(..., description="Unique identifier for the zone")
    name: str = Field(..., description="Name of the concourse zone")
    density_percent: float = Field(0.0, description="Current crowd density (0.0 to 100.0)")

class Sensor(BaseModel):
    id: str = Field(..., description="Unique identifier for the sensor")
    zone_id: str = Field(..., description="ID of the zone this sensor monitors")
    density_percent: float = Field(0.0, description="Crowd density reading (0.0 to 100.0)")
    active: bool = Field(True, description="Whether the sensor is online")

class TransitLine(BaseModel):
    id: str = Field(..., description="Unique identifier for the transit line")
    type: str = Field(..., description="Type of transit (e.g., 'light_rail', 'bus', 'ferry')")
    status: str = Field(..., description="Current operational status (e.g., 'On Time', 'Delayed')")
    next_arrival_minutes: Optional[int] = Field(None, description="Minutes until next arrival")

class WeatherSnapshot(BaseModel):
    temperature_f: float = Field(..., description="Temperature in Fahrenheit")
    condition: str = Field(..., description="Weather condition (e.g., 'Sunny', 'Raining')")
    wind_speed_mph: float = Field(0.0, description="Wind speed in MPH")

class IncidentSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class Incident(BaseModel):
    id: str = Field(..., description="Unique identifier for the incident")
    zone_id: str = Field(..., description="Location of the incident")
    description: str = Field(..., description="Description of the incident")
    severity: IncidentSeverity = Field(..., description="Severity level")
    resolved: bool = Field(False, description="Whether the incident has been resolved")
    reported_at: datetime = Field(default_factory=datetime.utcnow)

class Volunteer(BaseModel):
    id: str = Field(..., description="Unique ID for the volunteer")
    name: str = Field(..., description="Name of the volunteer")
    skills: List[str] = Field(default_factory=list, description="List of relevant skills")
    assigned_zone_id: Optional[str] = Field(None, description="Zone they are currently assigned to")

class VolunteerRoster(BaseModel):
    volunteers: List[Volunteer] = Field(default_factory=list, description="All volunteers on shift")

class FixtureSchedule(BaseModel):
    home_team: str = Field(..., description="Name of the home team")
    away_team: str = Field(..., description="Name of the away team")
    kickoff_time: datetime = Field(..., description="Scheduled kickoff time")
    match_status: str = Field(..., description="Current status of the match (e.g., 'Scheduled', 'In Progress')")

class VenueSnapshot(BaseModel):
    """Aggregated snapshot of the entire venue's state."""
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    gates: List[Gate] = Field(default_factory=list)
    zones: List[Zone] = Field(default_factory=list)
    sensors: List[Sensor] = Field(default_factory=list)
    transit: List[TransitLine] = Field(default_factory=list)
    weather: WeatherSnapshot
    incidents: List[Incident] = Field(default_factory=list)
    roster: VolunteerRoster = Field(default_factory=VolunteerRoster)
    fixture: FixtureSchedule
