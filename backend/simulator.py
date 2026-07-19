import asyncio
import random
from state import venue_state


def bounded_random_walk(
    current_val: float,
    min_val: float = 0.0,
    max_val: float = 100.0,
    step_size: float = 2.0,
) -> float:
    """
    Applies a random walk to the current value, keeping it within the bounds.
    """
    change = random.uniform(-step_size, step_size)
    new_val = current_val + change
    return max(min_val, min(max_val, new_val))


async def run_simulator():
    """
    Background task that updates the venue state every 5 seconds and broadcasts it.
    """
    while True:
        if venue_state.snapshot:
            # Update gate wait times
            for gate in venue_state.snapshot.gates:
                gate.wait_time_minutes = int(
                    bounded_random_walk(
                        gate.wait_time_minutes, min_val=0, max_val=120, step_size=2
                    )
                )

            # Update zone densities
            for zone in venue_state.snapshot.zones:
                zone.density_percent = bounded_random_walk(zone.density_percent)

            # Update sensor densities
            for sensor in venue_state.snapshot.sensors:
                sensor.density_percent = bounded_random_walk(sensor.density_percent)

            # Record state to history queue for forecasting
            await venue_state.record_history()

            # Broadcast updated state to all connected websocket clients
            await venue_state.broadcast()

        await asyncio.sleep(5)
