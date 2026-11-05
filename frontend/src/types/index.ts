export interface SensorReading {
  id?: number;
  timestamp: string;
  input_tds: number;      // ppm
  output_tds: number;     // ppm
  turbidity: number;      // NTU
  flow_rate: number;      // L/min
  pressure_drop: number;  // bar
  cumulative_water: number; // L
  filter_age_days: number;  // days
  daily_consumption: number;// L/day
  is_simulated: boolean;
}

export interface HealthBreakdown {
  age_contribution: number;
  water_usage_contribution: number;
  flow_reduction_contribution: number;
  pressure_contribution: number;
  tds_contribution: number;
  turbidity_contribution: number;
  total_degradation: number;
}

export interface HealthScore {
  score: number;
  status: 'Healthy' | 'Attention Required' | 'Critical';
  score_change_24h: number;
  breakdown: HealthBreakdown;
  explanation: string;
}

export interface TrajectoryPoint {
  day: number;
  date: string;
  health: number;
  is_projected: boolean;
}

export interface PrognosticsResult {
  health_score: number;
  health_status: 'Healthy' | 'Attention Required' | 'Critical';
  remaining_useful_life_days: number;
  estimated_replacement_date: string;
  confidence_level: string;
  degradation_rate_per_day: number;
  failure_risk: 'Low Risk' | 'Moderate Risk' | 'High Risk';
  primary_failure_mode: string;
  recommendations: string[];
  trajectory: TrajectoryPoint[];
  maintenance_threshold: number;
}

export interface FilterStage {
  id: string;
  name: string;
  stage_number: number;
  technology: string;
  health_score: number;
  status: 'Healthy' | 'Attention Required' | 'Critical';
  estimated_usage_percent: number;
  performance_indicator: string;
  last_service_date: string;
  typical_lifespan_days: number;
  failure_symptoms: string[];
  current_metrics: Record<string, string>;
}

export interface MaintenanceEvent {
  id?: number;
  created_at: string;
  stage_id?: string;
  stage_name: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'In Progress' | 'Completed';
  completed_at?: string | null;
  technician_notes?: string;
}

export interface SystemSettings {
  weight_age: number;
  weight_water: number;
  weight_flow: number;
  weight_pressure: number;
  weight_tds: number;
  weight_turbidity: number;
  baseline_flow_rate: number;
  baseline_pressure_drop: number;
  baseline_input_tds: number;
  max_acceptable_output_tds: number;
  max_acceptable_turbidity: number;
  max_rated_volume: number;
  max_rated_days: number;
  maintenance_threshold: number;
  simulation_interval_sec: number;
  auto_degradation_speed: number;
}

export interface SystemStatus {
  device_id: string;
  device_name: string;
  status: string;
  simulation_mode: string;
  is_simulated: boolean;
  is_running: boolean;
  last_updated: string;
  sensor_validity: 'Valid' | 'Sensor Warning';
  sensor_issues: string[];
  server_time: string;
}

