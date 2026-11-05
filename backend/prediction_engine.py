import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
import numpy as np
from sklearn.linear_model import LinearRegression

from backend.models import (
    SensorReading,
    HealthBreakdown,
    HealthScore,
    PrognosticsResult,
    TrajectoryPoint,
    SystemSettings,
)

class PredictionEngine:
    def __init__(self, settings: SystemSettings = None):
        self.settings = settings or SystemSettings()

    def update_settings(self, new_settings: SystemSettings):
        self.settings = new_settings

    def validate_reading(self, reading: SensorReading) -> Tuple[bool, List[str]]:
        """
        Safety check: Detect missing, physically impossible, or abnormal out-of-range sensor readings.
        """
        issues = []
        if reading.input_tds < 0 or reading.input_tds > 3000:
            issues.append(f"Input TDS ({reading.input_tds} ppm) out of physical bounds [0, 3000 ppm]")
        if reading.output_tds < 0 or reading.output_tds > reading.input_tds * 1.2:
            issues.append(f"Output TDS ({reading.output_tds} ppm) is invalid relative to input ({reading.input_tds} ppm)")
        if reading.turbidity < 0 or reading.turbidity > 50:
            issues.append(f"Turbidity ({reading.turbidity} NTU) out of valid range [0, 50 NTU]")
        if reading.flow_rate < 0 or reading.flow_rate > 10.0:
            issues.append(f"Flow rate ({reading.flow_rate} L/min) is invalid or sensor disconnected")
        if reading.pressure_drop < 0 or reading.pressure_drop > 5.0:
            issues.append(f"Pressure drop ({reading.pressure_drop} bar) out of valid operating range")
        if reading.cumulative_water < 0:
            issues.append("Cumulative water volume cannot be negative")
        if reading.filter_age_days < 0:
            issues.append("Filter operating age cannot be negative")

        is_valid = len(issues) == 0
        return is_valid, issues

    def calculate_health(self, reading: SensorReading) -> HealthScore:
        """
        Transparent Filter Health Calculation Engine (0-100).
        Degradation Score =
            Age Contribution +
            Water Usage Contribution +
            Flow Reduction Contribution +
            Pressure Contribution +
            Water Quality (TDS) Contribution +
            Turbidity Contribution.
        Filter Health = 100 - Degradation Score.
        """
        s = self.settings

        # 1. Age Contribution: normalized by max rated days (e.g. 365 days)
        age_ratio = min(max(reading.filter_age_days / max(s.max_rated_days, 1.0), 0.0), 1.5)
        age_contrib = age_ratio * 100.0 * s.weight_age

        # 2. Cumulative Water Usage Contribution: normalized by max rated volume (e.g. 6000 L)
        usage_ratio = min(max(reading.cumulative_water / max(s.max_rated_volume, 1.0), 0.0), 1.5)
        water_contrib = usage_ratio * 100.0 * s.weight_water

        # 3. Flow Reduction Contribution: baseline flow vs current flow
        # If flow dropped from 2.0 L/min to 0.8 L/min, reduction is (2.0 - 0.8)/2.0 = 60%
        if s.baseline_flow_rate > 0:
            flow_reduction_ratio = max(0.0, (s.baseline_flow_rate - reading.flow_rate) / s.baseline_flow_rate)
        else:
            flow_reduction_ratio = 0.0
        flow_reduction_ratio = min(flow_reduction_ratio, 1.0)
        # Non-linear penalty if flow is choked
        flow_contrib = (flow_reduction_ratio ** 1.1) * 100.0 * s.weight_flow

        # 4. Pressure Drop Contribution: baseline is ~0.3 bar, higher pressure indicates membrane clogging
        # Ratio based on increase over baseline, normalized to e.g. 1.8 bar delta
        pressure_delta = max(0.0, reading.pressure_drop - s.baseline_pressure_drop)
        pressure_ratio = min(max(pressure_delta / 1.5, 0.0), 1.5)
        pressure_contrib = pressure_ratio * 100.0 * s.weight_pressure

        # 5. TDS Performance Proxy Contribution:
        # Rejection efficiency = (Input - Output) / Input. Lower rejection or higher output TDS increases degradation.
        if reading.input_tds > 10:
            rejection_efficiency = max(0.0, (reading.input_tds - reading.output_tds) / reading.input_tds)
            tds_penalty_ratio = max(0.0, (0.95 - rejection_efficiency) / 0.5) # drops below 95% rejection
        else:
            tds_penalty_ratio = 0.0
        tds_output_ratio = max(0.0, (reading.output_tds - 30.0) / max(s.max_acceptable_output_tds - 30.0, 1.0))
        tds_combined_ratio = min(max((tds_penalty_ratio * 0.6 + tds_output_ratio * 0.4), 0.0), 1.5)
        tds_contrib = tds_combined_ratio * 100.0 * s.weight_tds

        # 6. Turbidity Contribution:
        turbidity_ratio = min(max(reading.turbidity / max(s.max_acceptable_turbidity, 0.1), 0.0), 2.0)
        turbidity_contrib = turbidity_ratio * 100.0 * s.weight_turbidity

        # Total degradation
        total_degradation = age_contrib + water_contrib + flow_contrib + pressure_contrib + tds_contrib + turbidity_contrib
        raw_health = 100.0 - total_degradation
        health = round(min(max(raw_health, 0.0), 100.0), 1)

        breakdown = HealthBreakdown(
            age_contribution=round(age_contrib, 2),
            water_usage_contribution=round(water_contrib, 2),
            flow_reduction_contribution=round(flow_contrib, 2),
            pressure_contribution=round(pressure_contrib, 2),
            tds_contribution=round(tds_contrib, 2),
            turbidity_contribution=round(turbidity_contrib, 2),
            total_degradation=round(total_degradation, 2)
        )

        if health >= 75.0:
            status = "Healthy"
            explanation = "Purifier filter assembly is operating within optimal nominal parameters."
        elif health >= 45.0:
            status = "Attention Required"
            explanation = "Moderate degradation observed. Flow reduction or operating age suggests planned servicing soon."
        else:
            status = "Critical"
            explanation = "Significant filter degradation or fouling detected. Immediate filter inspection/replacement advised."

        # Synthetic 24h change estimate (indicative)
        score_change_24h = -0.3 if health > 75 else (-0.8 if health > 45 else -1.8)

        return HealthScore(
            score=health,
            status=status,
            score_change_24h=score_change_24h,
            breakdown=breakdown,
            explanation=explanation
        )

    def run_prognostics(self, current_reading: SensorReading, history: List[SensorReading]) -> PrognosticsResult:
        """
        Failure Prognostics Engine:
        - Analyzes historical degradation rate via linear regression on time series
        - Estimates Remaining Useful Life (RUL) in days before hitting maintenance threshold
        - Risk classification: Low, Moderate, High
        - Generates actionable root-cause recommendations
        - Generates projection trajectory for visualization
        """
        current_health_obj = self.calculate_health(current_reading)
        current_health = current_health_obj.score
        threshold = self.settings.maintenance_threshold

        # Historical health array
        valid_history = [r for r in history if r.filter_age_days <= current_reading.filter_age_days]
        if not valid_history:
            valid_history = [current_reading]

        historical_ages = []
        historical_scores = []
        for r in valid_history:
            h = self.calculate_health(r).score
            historical_ages.append(r.filter_age_days)
            historical_scores.append(h)

        # Baseline or Regression Degradation Rate Calculation
        rate_per_day = 0.25 # baseline fallback
        confidence_level = "Prototype Baseline"

        if len(historical_ages) >= 5:
            X = np.array(historical_ages).reshape(-1, 1)
            y = np.array(historical_scores)
            reg = LinearRegression().fit(X, y)
            slope = reg.coef_[0]
            # Degradation rate is negative slope of health over days
            if slope < -0.01:
                rate_per_day = abs(float(slope))
                confidence_level = "High (Historical Fit)"
            else:
                # Mild degradation observed
                rate_per_day = max(0.12, abs(float(slope)))
                confidence_level = "Moderate (Trend Heuristic)"
        elif current_reading.filter_age_days > 10:
            # Simple two-point estimate from installation
            drop = max(1.0, 100.0 - current_health)
            rate_per_day = round(drop / current_reading.filter_age_days, 3)
            confidence_level = "Moderate (Trend Heuristic)"

        # Ensure rate_per_day is sensible
        rate_per_day = max(0.05, min(rate_per_day, 4.0))

        # Remaining useful life (days until crossing threshold)
        if current_health <= threshold:
            rul_days = 0
        else:
            rul_days = int(math.ceil((current_health - threshold) / rate_per_day))

        # Replacement date
        replacement_date = (datetime.now() + timedelta(days=rul_days)).strftime("%d %b %Y")

        # Failure Risk Classification
        if current_health >= 75 and rul_days > 60:
            failure_risk = "Low Risk"
        elif current_health >= 45 or (rul_days > 20 and current_health > 35):
            failure_risk = "Moderate Risk"
        else:
            failure_risk = "High Risk"

        # Identify Primary Failure Mode and Recommendations
        breakdown = current_health_obj.breakdown
        contributions = [
            ("Flow Reduction / Membrane Fouling", breakdown.flow_reduction_contribution),
            ("Differential Pressure Rise / Clogging", breakdown.pressure_contribution),
            ("Rated Volumetric Usage Exceeded", breakdown.water_usage_contribution),
            ("Operating Lifespan Elapsed", breakdown.age_contribution),
            ("Membrane Rejection Deterioration (TDS)", breakdown.tds_contribution),
            ("Particulate Influx / Pre-filter Silt", breakdown.turbidity_contribution),
        ]
        contributions.sort(key=lambda x: x[1], reverse=True)
        primary_failure_mode = contributions[0][0]

        recommendations = []
        flow_pct_drop = ((self.settings.baseline_flow_rate - current_reading.flow_rate) / self.settings.baseline_flow_rate) * 100
        if flow_pct_drop > 25:
            recommendations.append(
                f"Flow rate has declined by {flow_pct_drop:.1f}% compared with baseline ({self.settings.baseline_flow_rate} L/min). Possible filter restriction or particulate fouling detected. Inspect pre-filter and RO membrane."
            )
        if current_reading.pressure_drop > 0.8:
            recommendations.append(
                f"Pressure drop across filter assembly is elevated ({current_reading.pressure_drop:.2f} bar vs {self.settings.baseline_pressure_drop} bar nominal). Sediment filter cake resistance increasing."
            )
        if current_reading.output_tds > self.settings.max_acceptable_output_tds:
            recommendations.append(
                f"Output TDS is {current_reading.output_tds:.0f} ppm (exceeds target limit of {self.settings.max_acceptable_output_tds:.0f} ppm). Reverse Osmosis membrane salt passage detected. Check booster pump and membrane seal."
            )
        if current_reading.turbidity > self.settings.max_acceptable_turbidity:
            recommendations.append(
                f"Permeate turbidity is {current_reading.turbidity:.2f} NTU. Inspect UF membrane integrity and sediment stage seals."
            )

        if not recommendations:
            if rul_days > 90:
                recommendations.append("Continue normal operation and periodic monitoring. All physical indices are within normal bounds.")
            elif rul_days > 30:
                recommendations.append("Operating parameters are normal. Plan preventive filter replacement within the next 4–6 weeks.")
            else:
                recommendations.append("Filter approaching end-of-life based on cumulative water processed. Schedule service technician visit.")

        # Generate Trajectory Points (Historical + Projected)
        trajectory: List[TrajectoryPoint] = []
        now = datetime.now()

        # 1. Historical points (up to 15 points sampled)
        step_days = max(1, int(current_reading.filter_age_days / 10))
        for d in range(0, int(current_reading.filter_age_days) + 1, step_days):
            t_date = (now - timedelta(days=(current_reading.filter_age_days - d))).strftime("%d %b")
            # Reconstruct health trajectory realistically
            sim_score = max(current_health, 100.0 - (100.0 - current_health) * (d / max(current_reading.filter_age_days, 1.0)) ** 1.1)
            trajectory.append(TrajectoryPoint(
                day=d,
                date=t_date,
                health=round(sim_score, 1),
                is_projected=False
            ))

        # Ensure current point is explicitly in trajectory
        if not any(tp.day == int(current_reading.filter_age_days) for tp in trajectory):
            trajectory.append(TrajectoryPoint(
                day=int(current_reading.filter_age_days),
                date=now.strftime("%d %b"),
                health=round(current_health, 1),
                is_projected=False
            ))

        # 2. Projected points into future (project up to RUL + 30 days or down to health = 15)
        proj_days = max(rul_days + 20, 45)
        proj_step = max(1, proj_days // 10)
        curr_day = int(current_reading.filter_age_days)

        for forward in range(proj_step, proj_days + 1, proj_step):
            future_day = curr_day + forward
            proj_date = (now + timedelta(days=forward)).strftime("%d %b")
            proj_health = max(10.0, current_health - (forward * rate_per_day))
            trajectory.append(TrajectoryPoint(
                day=future_day,
                date=proj_date,
                health=round(proj_health, 1),
                is_projected=True
            ))

        return PrognosticsResult(
            health_score=current_health,
            health_status=current_health_obj.status,
            remaining_useful_life_days=rul_days,
            estimated_replacement_date=replacement_date,
            confidence_level=confidence_level,
            degradation_rate_per_day=round(rate_per_day, 3),
            failure_risk=failure_risk,
            primary_failure_mode=primary_failure_mode,
            recommendations=recommendations,
            trajectory=trajectory,
            maintenance_threshold=threshold
        )

