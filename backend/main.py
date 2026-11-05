import io
import os
import csv
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
from pydantic import BaseModel

from backend.models import (
    SensorReading,
    HealthScore,
    PrognosticsResult,
    FilterStage,
    MaintenanceEvent,
    SystemSettings,
)
from backend.database import (
    init_db,
    save_reading,
    get_latest_reading,
    get_reading_history,
    get_maintenance_events,
    add_maintenance_event,
    update_maintenance_status,
    reset_database,
)
from backend.prediction_engine import PredictionEngine
from backend.simulation_engine import SimulationEngine

app = FastAPI(
    title="AquaSense API - Intelligent Predictive Filter Health Monitoring System",
    description="Prognostics of filter failure using data analytics for Atomberg atomQUEST 2026",
    version="1.0.0"
)

# CORS configuration for local React Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
init_db()
system_settings = SystemSettings()
prediction_engine = PredictionEngine(system_settings)
simulation_engine = SimulationEngine(system_settings)

@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/api/status")
def get_system_status():
    latest = simulation_engine.current_reading
    valid, issues = prediction_engine.validate_reading(latest)
    return {
        "device_id": "ATMB-AQUASENSE-001",
        "device_name": "Atomberg Multi-Stage Smart RO+UF+UV",
        "status": "Online",
        "simulation_mode": simulation_engine.scenario_name,
        "is_simulated": True,
        "is_running": simulation_engine.is_running,
        "last_updated": latest.timestamp,
        "sensor_validity": "Valid" if valid else "Sensor Warning",
        "sensor_issues": issues,
        "server_time": datetime.now().isoformat()
    }

@app.get("/api/readings/current")
def get_current_reading():
    reading = simulation_engine.current_reading
    valid, issues = prediction_engine.validate_reading(reading)
    health = prediction_engine.calculate_health(reading)
    history = get_reading_history(limit=50)
    prognostics = prediction_engine.run_prognostics(reading, history)

    return {
        "reading": reading,
        "health": health,
        "prognostics": prognostics,
        "valid": valid,
        "sensor_issues": issues
    }

@app.post("/api/readings")
def update_manual_reading(partial: Dict[str, Any]):
    new_reading = simulation_engine.update_manual_reading(partial)
    valid, issues = prediction_engine.validate_reading(new_reading)
    health = prediction_engine.calculate_health(new_reading)
    return {
        "reading": new_reading,
        "health": health,
        "valid": valid,
        "sensor_issues": issues
    }

@app.get("/api/readings/history")
def get_history(limit: int = Query(50, ge=5, le=200)):
    return get_reading_history(limit=limit)

@app.get("/api/health")
def get_health():
    reading = simulation_engine.current_reading
    return prediction_engine.calculate_health(reading)

@app.get("/api/prognostics")
def get_prognostics():
    reading = simulation_engine.current_reading
    history = get_reading_history(limit=50)
    return prediction_engine.run_prognostics(reading, history)

@app.get("/api/stages")
def get_stages():
    reading = simulation_engine.current_reading
    health = prediction_engine.calculate_health(reading)
    return simulation_engine.get_stages_status(health.score)

@app.get("/api/maintenance")
def get_maintenance():
    return get_maintenance_events()

class MaintenanceCreateRequest(BaseModel):
    stage_id: Optional[str] = "all"
    stage_name: str
    title: str
    description: str
    priority: str = "Medium"
    technician_notes: Optional[str] = ""

@app.post("/api/maintenance")
def create_maintenance_record(req: MaintenanceCreateRequest):
    event = MaintenanceEvent(
        created_at=datetime.now().isoformat(),
        stage_id=req.stage_id,
        stage_name=req.stage_name,
        title=req.title,
        description=req.description,
        priority=req.priority,
        status="Pending",
        technician_notes=req.technician_notes
    )
    new_id = add_maintenance_event(event)
    return {"id": new_id, "status": "created"}

class MaintenanceUpdateRequest(BaseModel):
    status: str
    technician_notes: Optional[str] = None

@app.patch("/api/maintenance/{event_id}")
def update_maintenance_record(event_id: int, req: MaintenanceUpdateRequest):
    update_maintenance_status(event_id, req.status, req.technician_notes)
    return {"id": event_id, "status": req.status}

@app.post("/api/simulation/scenario/{scenario_id}")
def load_scenario(scenario_id: int):
    if scenario_id not in [1, 2, 3]:
        raise HTTPException(status_code=400, detail="Invalid scenario ID. Choose 1, 2, or 3.")
    reading = simulation_engine.load_scenario(scenario_id)
    health = prediction_engine.calculate_health(reading)
    history = get_reading_history(limit=50)
    prognostics = prediction_engine.run_prognostics(reading, history)
    return {
        "scenario": simulation_engine.scenario_name,
        "reading": reading,
        "health": health,
        "prognostics": prognostics
    }

@app.post("/api/simulation/step")
def step_simulation():
    reading = simulation_engine.step()
    health = prediction_engine.calculate_health(reading)
    history = get_reading_history(limit=50)
    prognostics = prediction_engine.run_prognostics(reading, history)
    return {
        "reading": reading,
        "health": health,
        "prognostics": prognostics
    }

@app.post("/api/simulation/start")
def start_simulation():
    simulation_engine.is_running = True
    return {"status": "started", "is_running": True}

@app.post("/api/simulation/pause")
def pause_simulation():
    simulation_engine.is_running = False
    return {"status": "paused", "is_running": False}

@app.post("/api/simulation/reset")
def reset_sim():
    simulation_engine.load_scenario(1)
    return {"status": "reset", "reading": simulation_engine.current_reading}

@app.get("/api/settings")
def get_settings():
    return prediction_engine.settings

@app.post("/api/settings")
def save_settings(new_settings: SystemSettings):
    prediction_engine.update_settings(new_settings)
    simulation_engine.settings = new_settings
    return {"status": "updated", "settings": prediction_engine.settings}

@app.post("/api/database/reset")
def reset_db_endpoint():
    reset_database()
    simulation_engine.load_scenario(1)
    return {"status": "database reset to default sample data"}

@app.get("/api/export/csv")
def export_csv():
    history = get_reading_history(limit=200)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Record_ID", "Timestamp", "Input_TDS_ppm", "Output_TDS_ppm", "Turbidity_NTU",
        "Flow_Rate_Lpm", "Pressure_Drop_bar", "Cumulative_Water_L", "Filter_Age_Days",
        "Daily_Consumption_L", "Calculated_Health_Score", "Health_Status", "Data_Provenance"
    ])
    for r in history:
        h = prediction_engine.calculate_health(r)
        writer.writerow([
            r.id, r.timestamp, r.input_tds, r.output_tds, r.turbidity,
            r.flow_rate, r.pressure_drop, r.cumulative_water, r.filter_age_days,
            r.daily_consumption, h.score, h.status, "SIMULATED DATA"
        ])
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=aquasense_historical_telemetry_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )

# Static files and Single Page Application (SPA) serving
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="API route not found")
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Index file not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
