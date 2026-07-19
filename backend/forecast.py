from typing import List, Dict


def simple_linear_regression(
    y_values: List[float], x_values: List[float] = None
) -> callable:
    """Returns a function that predicts y given x based on simple linear regression."""
    if not y_values:
        return lambda x: 0.0

    n = len(y_values)
    if n == 1:
        return lambda x: y_values[0]

    if not x_values:
        x_values = list(range(n))

    sum_x = sum(x_values)
    sum_y = sum(y_values)
    sum_xy = sum(x * y for x, y in zip(x_values, y_values))
    sum_xx = sum(x * x for x in x_values)

    denominator = n * sum_xx - sum_x**2
    if denominator == 0:
        return lambda x: y_values[-1]

    slope = (n * sum_xy - sum_x * sum_y) / denominator
    intercept = (sum_y - slope * sum_x) / n

    return lambda x: slope * x + intercept


def calculate_gate_forecasts(
    history: List["VenueSnapshot"],
) -> Dict[str, Dict[str, float]]:
    """
    Calculates 15m, 30m, and 60m forecasts for each gate's wait time based on recent history.
    Assumes history items are 5 seconds apart.
    """
    if not history:
        return {}

    forecasts = {}

    # We want to forecast for each gate.
    # First, gather historical series per gate
    gate_series = {}
    for snapshot in history:
        for gate in snapshot.gates:
            if gate.id not in gate_series:
                gate_series[gate.id] = []
            gate_series[gate.id].append(float(gate.wait_time_minutes))

    # Assuming history points are 1 "unit" apart (e.g. 5 seconds).
    # 15 minutes = 15 * 60 = 900 seconds = 180 units.
    # 30 minutes = 360 units.
    # 60 minutes = 720 units.

    current_x = len(history) - 1

    for gate_id, y_values in gate_series.items():
        predict = simple_linear_regression(y_values)

        # Calculate future values and clamp to 0-120 bounds
        val_15m = max(0.0, min(120.0, predict(current_x + 180)))
        val_30m = max(0.0, min(120.0, predict(current_x + 360)))
        val_60m = max(0.0, min(120.0, predict(current_x + 720)))

        forecasts[gate_id] = {
            "current": y_values[-1],
            "plus_15m": round(val_15m, 1),
            "plus_30m": round(val_30m, 1),
            "plus_60m": round(val_60m, 1),
        }

    return forecasts
