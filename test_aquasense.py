import sys
from backend.models import SensorReading, SystemSettings
from backend.prediction_engine import PredictionEngine
from backend.simulation_engine import SimulationEngine
from backend.database import init_db, get_latest_reading, get_reading_history, get_maintenance_events

def run_tests():
    print("Initializing test suite for AquaSense...")
    init_db()

    settings = SystemSettings()
    pred_engine = PredictionEngine(settings)
    sim_engine = SimulationEngine(settings)

    print("\n--- TEST 1: SCENARIO 1 (Healthy Purifier) ---")
    s1 = sim_engine.load_scenario(1)
    h1 = pred_engine.calculate_health(s1)
    p1 = pred_engine.run_prognostics(s1, get_reading_history(50))
    print(f"Scenario 1 Health Score: {h1.score} ({h1.status})")
    print(f"Scenario 1 Failure Risk: {p1.failure_risk}")
    print(f"Scenario 1 RUL: {p1.remaining_useful_life_days} Days")
    print(f"Scenario 1 Recommendations: {p1.recommendations}")
    assert h1.score >= 75.0, f"Expected health >= 75 for Scenario 1, got {h1.score}"
    assert h1.status == "Healthy", f"Expected 'Healthy', got {h1.status}"
    assert p1.failure_risk == "Low Risk", f"Expected 'Low Risk', got {p1.failure_risk}"
    print(">>> TEST 1 PASSED!")

    print("\n--- TEST 2: SCENARIO 2 (Filter Degradation) ---")
    s2 = sim_engine.load_scenario(2)
    h2 = pred_engine.calculate_health(s2)
    p2 = pred_engine.run_prognostics(s2, [])
    print(f"Scenario 2 Health Score: {h2.score} ({h2.status})")
    print(f"Scenario 2 Failure Risk: {p2.failure_risk}")
    print(f"Scenario 2 RUL: {p2.remaining_useful_life_days} Days")
    print(f"Scenario 2 Recommendations: {p2.recommendations}")
    assert h2.score < 75.0, f"Expected health < 75 for Scenario 2, got {h2.score}"
    assert p2.failure_risk in ["Moderate Risk", "High Risk"], f"Expected Moderate/High Risk, got {p2.failure_risk}"
    print(">>> TEST 2 PASSED!")

    print("\n--- TEST 3: SCENARIO 3 (Abnormal Performance) ---")
    s3 = sim_engine.load_scenario(3)
    h3 = pred_engine.calculate_health(s3)
    p3 = pred_engine.run_prognostics(s3, [])
    print(f"Scenario 3 Health Score: {h3.score} ({h3.status})")
    print(f"Scenario 3 Failure Risk: {p3.failure_risk}")
    print(f"Scenario 3 Recommendations: {p3.recommendations}")
    assert h3.score < 45.0, f"Expected health < 45 for Scenario 3, got {h3.score}"
    assert h3.status == "Critical", f"Expected 'Critical', got {h3.status}"
    assert p3.failure_risk == "High Risk", f"Expected 'High Risk', got {p3.failure_risk}"
    assert len(p3.recommendations) > 0, "Expected actionable alert recommendations for abnormal conditions"
    print(">>> TEST 3 PASSED!")

    print("\n--- TEST 4: SENSOR ANOMALY VALIDATION ---")
    bad_reading = SensorReading(
        input_tds=400.0,
        output_tds=12.0,
        turbidity=0.2,
        flow_rate=-0.5, # Impossible negative flow
        pressure_drop=0.3,
        cumulative_water=500.0,
        filter_age_days=10.0,
        daily_consumption=25.0,
        is_simulated=True
    )
    is_valid, issues = pred_engine.validate_reading(bad_reading)
    print(f"Invalid reading detected: is_valid={is_valid}, issues={issues}")
    assert not is_valid, "Expected sensor validation to catch negative flow rate"
    assert len(issues) > 0
    print(">>> TEST 4 PASSED!")

    print("\n--- TEST 5: SIMULATION STEP & PHYSICS TICK ---")
    initial_water = sim_engine.current_reading.cumulative_water
    stepped = sim_engine.step(delta_time_sec=3.0)
    print(f"Advanced simulation: Water increased from {initial_water} to {stepped.cumulative_water}")
    assert stepped.cumulative_water >= initial_water, "Cumulative water should advance or stay equal"
    print(">>> TEST 5 PASSED!")

    print("\n--- TEST 6: DATABASE TELEMETRY & MAINTENANCE LOGS ---")
    hist = get_reading_history(limit=10)
    assert len(hist) > 0, "Historical readings should exist"
    events = get_maintenance_events()
    assert len(events) > 0, "Maintenance events should exist"
    print(f"Fetched {len(hist)} history readings and {len(events)} maintenance records.")
    print(">>> TEST 6 PASSED!")

    print("\n=============================================")
    print("ALL 6 AQUASENSE ENGINE VERIFICATION TESTS PASSED!")
    print("=============================================")

if __name__ == "__main__":
    run_tests()
