from typing import Dict, Any

# -------------------------------------------------------------------------
# SUSTAINABILITY CONSTANTS & EMISSION FACTORS
# Sources:
# - EPA (US Environmental Protection Agency) GHG Emission Factors Hub
# - DEFRA (UK Dept for Environment, Food & Rural Affairs) transport factors
#
# Values are approximations for kg CO2e per passenger-mile.
# -------------------------------------------------------------------------
EMISSION_FACTORS = {
    "light_rail": 0.04,  # Efficient electrified public transit
    "bus": 0.08,         # Standard diesel/hybrid city bus
    "ferry": 0.15,       # Passenger ferry
    "car": 0.34          # Average passenger vehicle (single occupancy assumed for worst-case)
}

# Static assumptions for Lumen Field demo
ATTENDANCE = 68000
AVG_TRIP_DISTANCE_MILES = 15.0
WASTE_LBS_PER_PERSON = 1.5

def calculate_green_score(transit_lines: list) -> Dict[str, Any]:
    """
    Calculates a Green Matchday Score based on the current transit snapshot.
    Assumes a hypothetical distribution based on whether transit is 'On Time' or 'Delayed'.
    """
    
    # Baseline worst-case scenario: Everyone drives
    baseline_emissions = ATTENDANCE * AVG_TRIP_DISTANCE_MILES * EMISSION_FACTORS["car"]
    
    # Calculate a mock current distribution based on transit status
    # In a real app, this might come from ticket/turnstile data or surveys.
    distribution = {
        "light_rail": 0.10,
        "bus": 0.05,
        "ferry": 0.02,
        "car": 0.83
    }
    
    # If a line is on time, we assume higher usage in this dynamic model.
    total_transit_bump = 0.0
    for line in transit_lines:
        if line.status == "On Time":
            bump = 0.05
            distribution[line.type] += bump
            total_transit_bump += bump
            
    # Subtract the bump from car usage to balance to 1.0
    distribution["car"] -= total_transit_bump
    
    # Calculate current estimated emissions
    current_emissions = 0.0
    for t_type, ratio in distribution.items():
        pax = ATTENDANCE * ratio
        current_emissions += pax * AVG_TRIP_DISTANCE_MILES * EMISSION_FACTORS[t_type]
        
    # Waste Calculation
    total_waste_lbs = ATTENDANCE * WASTE_LBS_PER_PERSON
    
    # Score 0-100 based on improvement over baseline
    # Let's say a 50% reduction from worst-case is a perfect 100 score.
    reduction_ratio = (baseline_emissions - current_emissions) / baseline_emissions
    score = min(100.0, max(0.0, (reduction_ratio / 0.5) * 100.0))
    
    return {
        "green_score": round(score),
        "estimated_emissions_kg": round(current_emissions),
        "baseline_emissions_kg": round(baseline_emissions),
        "estimated_waste_lbs": round(total_waste_lbs),
        "transport_mix": {k: round(v * 100) for k, v in distribution.items()}
    }
