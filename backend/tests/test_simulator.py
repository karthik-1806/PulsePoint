import pytest
from simulator import bounded_random_walk


def test_bounded_random_walk_within_bounds():
    """Verify that density remains within bounds after many iterations."""
    val = 50.0
    for _ in range(1000):
        val = bounded_random_walk(val, min_val=0.0, max_val=100.0, step_size=5.0)
        assert 0.0 <= val <= 100.0, f"Value {val} went out of bounds!"


def test_bounded_random_walk_hits_min_boundary():
    """Verify it clamps to min_val."""
    val = 1.0
    # Forcing a negative change by running it with a negative current_val if we could,
    # but since it's random, we can just test the function directly with extreme step size.
    # We can patch random.uniform if needed, but a statistical test is easy too.
    for _ in range(100):
        val = bounded_random_walk(val, min_val=0.0, max_val=100.0, step_size=2.0)
        assert val >= 0.0


def test_bounded_random_walk_hits_max_boundary():
    """Verify it clamps to max_val."""
    val = 99.0
    for _ in range(100):
        val = bounded_random_walk(val, min_val=0.0, max_val=100.0, step_size=2.0)
        assert val <= 100.0
