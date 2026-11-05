import sqlite3
import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from backend.models import SensorReading, MaintenanceEvent, SystemSettings

DB_FILE = os.path.join(os.path.dirname(__file__), "aquasense.db")

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sensor_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        input_tds REAL NOT NULL,
        output_tds REAL NOT NULL,
        turbidity REAL NOT NULL,
        flow_rate REAL NOT NULL,
        pressure_drop REAL NOT NULL,
        cumulative_water REAL NOT NULL,
        filter_age_days REAL NOT NULL,
        daily_consumption REAL NOT NULL,
        is_simulated INTEGER DEFAULT 1
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS health_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        health_score REAL NOT NULL,
        status TEXT NOT NULL,
        rul_days INTEGER NOT NULL,
        degradation_rate REAL NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS maintenance_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL,
        stage_id TEXT NOT NULL,
        stage_name TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        completed_at TEXT,
        technician_notes TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
    """)

    conn.commit()

    # Seed sample data if database is brand new
    cursor.execute("SELECT COUNT(*) as count FROM sensor_readings")
    row = cursor.fetchone()
    if row["count"] == 0:
        seed_sample_data(conn)

    conn.close()

def seed_sample_data(conn):
    cursor = conn.cursor()
    now = datetime.now()

    # Generate 30 days of realistic history
    # Start 30 days ago at day 10, up to day 40
    readings = []
    base_age = 45.0
    for i in range(30, -1, -1):
        dt = (now - timedelta(days=i)).replace(hour=14, minute=0, second=0)
        age = base_age - i
        # Gradual realistic degradation over time
        prog = (30 - i) / 30.0
        input_tds = 480.0 + (i % 7) * 4.5
        output_tds = 24.0 + (prog * 8.0) + (i % 3) * 0.8
        turbidity = 0.18 + (prog * 0.12)
        flow_rate = 1.95 - (prog * 0.25)
        pressure_drop = 0.32 + (prog * 0.14)
        cumulative_water = 800.0 + (30 - i) * 28.5
        daily_consumption = 28.0 + (i % 5) * 2.2

        cursor.execute("""
        INSERT INTO sensor_readings 
        (timestamp, input_tds, output_tds, turbidity, flow_rate, pressure_drop, cumulative_water, filter_age_days, daily_consumption, is_simulated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            dt.isoformat(),
            round(input_tds, 1),
            round(output_tds, 1),
            round(turbidity, 2),
            round(flow_rate, 2),
            round(pressure_drop, 2),
            round(cumulative_water, 1),
            round(age, 1),
            round(daily_consumption, 1),
            1
        ))

    # Add realistic maintenance events
    cursor.execute("""
    INSERT INTO maintenance_events (created_at, stage_id, stage_name, title, description, priority, status, completed_at, technician_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        (now - timedelta(days=45)).isoformat(),
        "stage_prefilter",
        "Pre-filtration (Spun Polypropylene)",
        "Scheduled Cartridge Refresh",
        "Routine pre-filter replacement at system commissioning.",
        "Low",
        "Completed",
        (now - timedelta(days=45)).isoformat(),
        "Replaced 5-micron spun polypropylene sediment sleeve. Inlet pressure verified."
    ))

    cursor.execute("""
    INSERT INTO maintenance_events (created_at, stage_id, stage_name, title, description, priority, status, completed_at, technician_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        (now - timedelta(days=12)).isoformat(),
        "stage_carbon",
        "Activated Carbon Filter",
        "Periodic Chlorine & VOC Verification",
        "Tested output post-carbon block for residual free chlorine.",
        "Medium",
        "Completed",
        (now - timedelta(days=12)).isoformat(),
        "Zero free chlorine breakthrough detected. Adsorption capacity nominal."
    ))

    cursor.execute("""
    INSERT INTO maintenance_events (created_at, stage_id, stage_name, title, description, priority, status, completed_at, technician_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        (now - timedelta(days=2)).isoformat(),
        "stage_ro",
        "RO Membrane Assembly",
        "Predictive Flow Rate Monitoring",
        "Prognostics detected slight 12% flow divergence from clean baseline.",
        "Medium",
        "Pending",
        None,
        "Keep under observation. Flushing cycle recommended during next service."
    ))

    conn.commit()

def save_reading(reading: SensorReading) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO sensor_readings 
    (timestamp, input_tds, output_tds, turbidity, flow_rate, pressure_drop, cumulative_water, filter_age_days, daily_consumption, is_simulated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        reading.timestamp,
        reading.input_tds,
        reading.output_tds,
        reading.turbidity,
        reading.flow_rate,
        reading.pressure_drop,
        reading.cumulative_water,
        reading.filter_age_days,
        reading.daily_consumption,
        1 if reading.is_simulated else 0
    ))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return new_id

def get_latest_reading() -> Optional[SensorReading]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sensor_readings ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if row:
        return SensorReading(
            id=row["id"],
            timestamp=row["timestamp"],
            input_tds=row["input_tds"],
            output_tds=row["output_tds"],
            turbidity=row["turbidity"],
            flow_rate=row["flow_rate"],
            pressure_drop=row["pressure_drop"],
            cumulative_water=row["cumulative_water"],
            filter_age_days=row["filter_age_days"],
            daily_consumption=row["daily_consumption"],
            is_simulated=bool(row["is_simulated"])
        )
    return None

def get_reading_history(limit: int = 50) -> List[SensorReading]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM (SELECT * FROM sensor_readings ORDER BY id DESC LIMIT ?) ORDER BY id ASC", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [
        SensorReading(
            id=r["id"],
            timestamp=r["timestamp"],
            input_tds=r["input_tds"],
            output_tds=r["output_tds"],
            turbidity=r["turbidity"],
            flow_rate=r["flow_rate"],
            pressure_drop=r["pressure_drop"],
            cumulative_water=r["cumulative_water"],
            filter_age_days=r["filter_age_days"],
            daily_consumption=r["daily_consumption"],
            is_simulated=bool(r["is_simulated"])
        )
        for r in rows
    ]

def get_maintenance_events() -> List[MaintenanceEvent]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM maintenance_events ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [
        MaintenanceEvent(
            id=r["id"],
            created_at=r["created_at"],
            stage_id=r["stage_id"],
            stage_name=r["stage_name"],
            title=r["title"],
            description=r["description"],
            priority=r["priority"],
            status=r["status"],
            completed_at=r["completed_at"],
            technician_notes=r["technician_notes"]
        )
        for r in rows
    ]

def add_maintenance_event(event: MaintenanceEvent) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO maintenance_events (created_at, stage_id, stage_name, title, description, priority, status, completed_at, technician_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        event.created_at,
        event.stage_id,
        event.stage_name,
        event.title,
        event.description,
        event.priority,
        event.status,
        event.completed_at,
        event.technician_notes
    ))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return new_id

def update_maintenance_status(event_id: int, status: str, notes: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now().isoformat() if status == "Completed" else None
    if notes is not None:
        cursor.execute("""
        UPDATE maintenance_events 
        SET status = ?, completed_at = ?, technician_notes = ?
        WHERE id = ?
        """, (status, now_str, notes, event_id))
    else:
        cursor.execute("""
        UPDATE maintenance_events 
        SET status = ?, completed_at = ?
        WHERE id = ?
        """, (status, now_str, event_id))
    conn.commit()
    conn.close()

def reset_database():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM sensor_readings")
    cursor.execute("DELETE FROM health_history")
    cursor.execute("DELETE FROM maintenance_events")
    seed_sample_data(conn)
    conn.commit()
    conn.close()

