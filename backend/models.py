from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class SensorReading(BaseModel):
    id: Optional[int] = None
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    input_tds: float = Field(..., description="Input water Total Dissolved Solids (ppm)")
    output_tds: float = Field(..., description="Output water Total Dissolved Solids (ppm)")
    turbidity: float = Field(..., description="Turbidity in Nephelometric Turbidity Units (NTU)")
    flow_rate: float = Field(..., description="Purified water flow rate (L/min)")
    pressure_drop: float = Field(..., description="Pressure drop across filter assembly (bar)")
    cumulative_water: float = Field(..., description="Cumulative water processed since installation (L)")
    filter_age_days: float = Field(..., description="Operating age of current filter set (days)")
    daily_consumption: float = Field(..., description="Estimated current daily consumption (L/day)")
    is_simulated: bool = True

class HealthBreakdown(BaseModel):
    age_contribution: float
    water_usage_contribution: float
    flow_reduction_contribution: float
    pressure_contribution: float
    tds_contribution: float
    turbidity_contribution: float
    total_degradation: float

class HealthScore(BaseModel):
    score: float  # 0 to 100
    status: str   # "Healthy", "Attention Required", "Critical"
    score_change_24h: float
    breakdown: HealthBreakdown
    explanation: str

class TrajectoryPoint(BaseModel):
    day: int
    date: str
    health: float
    is_projected: bool

class PrognosticsResult(BaseModel):
    health_score: float
    health_status: str
    remaining_useful_life_days: int
    estimated_replacement_date: str
    confidence_level: str  # "High (Historical Fit)", "Moderate (Trend Heuristic)", "Prototype Baseline"
    degradation_rate_per_day: float
    failure_risk: str  # "Low Risk", "Moderate Risk", "High Risk"
    primary_failure_mode: str
    recommendations: List[str]
    trajectory: List[TrajectoryPoint]
    maintenance_threshold: float = 40.0

class FilterStage(BaseModel):
    id: str
    name: str
    stage_number: int
    technology: str
    health_score: float
    status: str
    estimated_usage_percent: float
    performance_indicator: str
    last_service_date: str
    typical_lifespan_days: int
    failure_symptoms: List[str]
    current_metrics: Dict[str, Any]

class MaintenanceEvent(BaseModel):
    id: Optional[int] = None
    created_at: str
    stage_id: Optional[str] = "all"
    stage_name: str
    title: str
    description: str
    priority: str  # "Low", "Medium", "High", "Critical"
    status: str    # "Pending", "In Progress", "Completed"
    completed_at: Optional[str] = None
    technician_notes: Optional[str] = ""

class SystemSettings(BaseModel):
    # Weights for filter health
    weight_age: float = 0.20
    weight_water: float = 0.25
    weight_flow: float = 0.25
    weight_pressure: float = 0.15
    weight_tds: float = 0.10
    weight_turbidity: float = 0.05
    # Baselines and thresholds
    baseline_flow_rate: float = 2.0     # L/min for brand new filter
    baseline_pressure_drop: float = 0.3 # bar
    baseline_input_tds: float = 500.0   # ppm
    max_acceptable_output_tds: float = 100.0 # ppm
    max_acceptable_turbidity: float = 1.0    # NTU
    max_rated_volume: float = 6000.0   # Rated filter capacity in Litres
    max_rated_days: float = 365.0      # Rated filter life in days (1 year)
    maintenance_threshold: float = 40.0 # Health score threshold triggering replacement alert
    simulation_interval_sec: float = 3.0
    auto_degradation_speed: float = 1.0 # Multiplier for simulated aging

