import random
import math
from datetime import datetime, timedelta
from typing import Dict, Any, List
from backend.models import SensorReading, FilterStage, SystemSettings
from backend.database import save_reading, get_latest_reading

class SimulationEngine:
    def __init__(self, settings: SystemSettings = None):
        self.settings = settings or SystemSettings()
        self.is_running = False
        self.scenario_name = "Custom / Standard"
        
        # Current active state
        latest = get_latest_reading()
        if latest:
            self.current_reading = latest
        else:
            self.current_reading = SensorReading(
                input_tds=480.0,
                output_tds=28.0,
                turbidity=0.22,
                flow_rate=1.85,
                pressure_drop=0.35,
                cumulative_water=950.0,
                filter_age_days=35.0,
                daily_consumption=28.0,
                is_simulated=True
            )

    def load_scenario(self, scenario_id: int) -> SensorReading:
        """
        Loads one of the 3 required competition evaluation scenarios:
        SCENARIO 1 – Healthy Purifier:
            - Low filter age
            - Moderate water consumption
            - Normal flow
            - Normal pressure
            - Good operating conditions
            -> High filter health, Low failure risk, Normal monitoring recommendation

        SCENARIO 2 – Filter Degradation:
            - Increased filter age
            - Increased cumulative water processed
            - Gradually reduced flow rate
            - Increased pressure drop
            -> Declining filter health, Increasing failure risk, Predictive maintenance recommendation

        SCENARIO 3 – Abnormal Performance:
            - Simulate an unusually low flow rate
            - Increased turbidity / high output TDS
            - Abnormal readings
            -> Critical alerts, Clear explanation of detected abnormalities, Immediate inspection recommendation
        """
        now_str = datetime.now().isoformat()
        if scenario_id == 1:
            self.scenario_name = "Scenario 1: Healthy Purifier"
            self.current_reading = SensorReading(
                timestamp=now_str,
                input_tds=420.0,
                output_tds=22.0,
                turbidity=0.15,
                flow_rate=1.92,
                pressure_drop=0.32,
                cumulative_water=450.0,
                filter_age_days=18.0,
                daily_consumption=25.0,
                is_simulated=True
            )
        elif scenario_id == 2:
            self.scenario_name = "Scenario 2: Filter Degradation"
            self.current_reading = SensorReading(
                timestamp=now_str,
                input_tds=530.0,
                output_tds=68.0,
                turbidity=0.65,
                flow_rate=1.18,
                pressure_drop=0.88,
                cumulative_water=4850.0,
                filter_age_days=210.0,
                daily_consumption=29.0,
                is_simulated=True
            )
        elif scenario_id == 3:
            self.scenario_name = "Scenario 3: Abnormal Performance"
            self.current_reading = SensorReading(
                timestamp=now_str,
                input_tds=690.0,
                output_tds=142.0,
                turbidity=2.95,
                flow_rate=0.58,
                pressure_drop=1.52,
                cumulative_water=6200.0,
                filter_age_days=265.0,
                daily_consumption=34.0,
                is_simulated=True
            )
        else:
            self.scenario_name = "Custom / Standard"

        save_reading(self.current_reading)
        return self.current_reading

    def step(self, delta_time_sec: float = 3.0) -> SensorReading:
        """
        Advances the simulation by one time interval with realistic sensor jitter and gradual aging physics.
        """
        r = self.current_reading

        # Physics progression
        # e.g., 3 seconds of simulation represents 0.05 L of water processed
        aging_mult = self.settings.auto_degradation_speed
        water_delta = (r.flow_rate / 60.0) * delta_time_sec * aging_mult * 0.8
        new_cum_water = r.cumulative_water + max(0.01, water_delta)
        # Small aging advancement
        new_age = r.filter_age_days + (delta_time_sec / 86400.0) * aging_mult * 5.0

        # Natural sensor noise (+/- 1-2%)
        noise_flow = random.uniform(-0.02, 0.02)
        noise_tds_in = random.uniform(-3.0, 3.0)
        noise_tds_out = random.uniform(-0.8, 0.8)
        noise_turb = random.uniform(-0.01, 0.01)
        noise_press = random.uniform(-0.01, 0.01)

        # Gradual clogging drift proportional to cumulative water
        clogging_drift = (new_cum_water / max(self.settings.max_rated_volume, 1.0)) * 0.0005 * aging_mult
        new_flow = max(0.3, r.flow_rate - clogging_drift + noise_flow)
        new_press = min(3.0, r.pressure_drop + (clogging_drift * 0.8) + noise_press)
        new_in_tds = max(100.0, min(1200.0, r.input_tds + noise_tds_in))
        
        # Output TDS rises slightly as membrane ages
        base_rejection = max(0.70, 0.96 - (new_cum_water / self.settings.max_rated_volume) * 0.15)
        ideal_out_tds = new_in_tds * (1.0 - base_rejection)
        new_out_tds = max(10.0, min(new_in_tds * 0.9, ideal_out_tds + noise_tds_out))
        new_turb = max(0.05, min(5.0, r.turbidity + noise_turb))

        self.current_reading = SensorReading(
            timestamp=datetime.now().isoformat(),
            input_tds=round(new_in_tds, 1),
            output_tds=round(new_out_tds, 1),
            turbidity=round(new_turb, 2),
            flow_rate=round(new_flow, 2),
            pressure_drop=round(new_press, 2),
            cumulative_water=round(new_cum_water, 1),
            filter_age_days=round(new_age, 1),
            daily_consumption=r.daily_consumption,
            is_simulated=True
        )

        save_reading(self.current_reading)
        return self.current_reading

    def update_manual_reading(self, partial_reading: Dict[str, Any]) -> SensorReading:
        """
        Allows evaluator/user to manually alter sensor parameters on the fly.
        """
        r_dict = self.current_reading.model_dump()
        r_dict.update(partial_reading)
        r_dict["timestamp"] = datetime.now().isoformat()
        r_dict["is_simulated"] = True
        self.current_reading = SensorReading(**r_dict)
        save_reading(self.current_reading)
        return self.current_reading

    def get_stages_status(self, overall_health: float) -> List[FilterStage]:
        """
        Returns conceptual multi-stage health metrics based on current readings:
        1. Pre-filtration
        2. Sediment filtration
        3. Carbon filtration
        4. RO membrane
        5. UF filtration
        6. UV purification
        7. Alkaliser / mineral enhancement
        """
        r = self.current_reading
        age = r.filter_age_days
        cum_l = r.cumulative_water

        # 1. Pre-filtration (sediment sleeve) - wears first
        pre_usage = min(100.0, (cum_l / 3000.0) * 100.0)
        pre_health = max(15.0, 100.0 - (pre_usage * 0.75) - (r.turbidity * 8.0))

        # 2. Sediment filtration
        sed_usage = min(100.0, (cum_l / 4000.0) * 100.0)
        sed_health = max(20.0, 100.0 - (sed_usage * 0.7) - ((r.pressure_drop - 0.3) * 25.0))

        # 3. Carbon block (chemical adsorption / chlorine removal)
        carb_usage = min(100.0, (cum_l / 4500.0) * 100.0)
        carb_health = max(25.0, 100.0 - (carb_usage * 0.65) - (age / 365.0 * 25.0))

        # 4. RO Membrane (core desalting / salt rejection)
        ro_rejection = ((r.input_tds - r.output_tds) / max(r.input_tds, 1.0)) * 100.0
        ro_usage = min(100.0, (cum_l / self.settings.max_rated_volume) * 100.0)
        ro_health = max(10.0, min(100.0, (ro_rejection * 0.7) + (30.0 - (ro_usage * 0.3))))

        # 5. UF Membrane (ultrafiltration for colloidal & cyst removal)
        uf_usage = min(100.0, (cum_l / 5000.0) * 100.0)
        uf_health = max(30.0, 100.0 - (uf_usage * 0.5) - (r.turbidity * 12.0))

        # 6. UV Purification (germicidal disinfection chamber)
        uv_hours = age * 24.0
        uv_usage = min(100.0, (uv_hours / 8000.0) * 100.0)
        uv_health = max(40.0, 100.0 - (uv_usage * 0.6))

        # 7. Post-RO Alkaliser / Remineralisation cartridge
        alk_usage = min(100.0, (cum_l / 3500.0) * 100.0)
        alk_health = max(25.0, 100.0 - (alk_usage * 0.8))

        def calc_status(h: float) -> str:
            if h >= 75: return "Healthy"
            if h >= 45: return "Attention Required"
            return "Critical"

        stages = [
            FilterStage(
                id="stage_prefilter",
                name="Pre-filtration (Sediment Spun 5µm)",
                stage_number=1,
                technology="Depth Spun Polypropylene",
                health_score=round(pre_health, 1),
                status=calc_status(pre_health),
                estimated_usage_percent=round(pre_usage, 1),
                performance_indicator=f"Inlet turbidity capture: {r.turbidity:.2f} NTU load",
                last_service_date="45 days ago",
                typical_lifespan_days=90,
                failure_symptoms=[
                    "Brownish cartridge discoloration visible in housing",
                    "Rapid upstream pressure build-up",
                    "Visible particulate bypass into second stage"
                ],
                current_metrics={"Turbidity": f"{r.turbidity:.2f} NTU", "Operating Days": f"{age:.0f} d"}
            ),
            FilterStage(
                id="stage_sediment",
                name="Sediment Filter (Fine 1µm)",
                stage_number=2,
                technology="Melt-blown Polymeric Matrix",
                health_score=round(sed_health, 1),
                status=calc_status(sed_health),
                estimated_usage_percent=round(sed_usage, 1),
                performance_indicator=f"Differential pressure drop: {r.pressure_drop:.2f} bar",
                last_service_date="120 days ago",
                typical_lifespan_days=180,
                failure_symptoms=[
                    "High pressure drop exceeding 0.7 bar",
                    "Reduced feed rate to booster pump",
                    "Acoustic cavitation in downstream pump"
                ],
                current_metrics={"Delta Pressure": f"{r.pressure_drop:.2f} bar", "Usage": f"{sed_usage:.1f}%"}
            ),
            FilterStage(
                id="stage_carbon",
                name="Activated Carbon Block",
                stage_number=3,
                technology="Acid-washed Coconut Shell Charcoal",
                health_score=round(carb_health, 1),
                status=calc_status(carb_health),
                estimated_usage_percent=round(carb_usage, 1),
                performance_indicator="Adsorption bed capacity: ~78% active micropores",
                last_service_date="180 days ago",
                typical_lifespan_days=240,
                failure_symptoms=[
                    "Chlorine breakthrough or pungent chemical odor",
                    "Trihalomethane (THM) passage into RO membrane",
                    "Organic fouling of downstream polyamide membrane"
                ],
                current_metrics={"Chlorine Adsorption": "Nominal", "Estimated Lifespan": "240 days"}
            ),
            FilterStage(
                id="stage_ro",
                name="Reverse Osmosis (RO) Membrane",
                stage_number=4,
                technology="Thin-Film Composite (TFC) Polyamide",
                health_score=round(ro_health, 1),
                status=calc_status(ro_health),
                estimated_usage_percent=round(ro_usage, 1),
                performance_indicator=f"Salt rejection efficiency: {ro_rejection:.1f}% (In: {r.input_tds:.0f} ppm -> Out: {r.output_tds:.0f} ppm)",
                last_service_date="210 days ago",
                typical_lifespan_days=365,
                failure_symptoms=[
                    "Sharp decrease in permeate flux (flow rate < 1.0 L/min)",
                    "Salt passage exceeding 100 ppm output TDS",
                    "Mineral scale deposition (calcium carbonate / silica)"
                ],
                current_metrics={"Salt Rejection": f"{ro_rejection:.1f}%", "Flux Flow": f"{r.flow_rate:.2f} L/min"}
            ),
            FilterStage(
                id="stage_uf",
                name="Ultrafiltration (UF) Stage",
                stage_number=5,
                technology="Hollow Fiber Membrane (0.01µm)",
                health_score=round(uf_health, 1),
                status=calc_status(uf_health),
                estimated_usage_percent=round(uf_usage, 1),
                performance_indicator="Colloidal and macromolecule barrier status: Active",
                last_service_date="210 days ago",
                typical_lifespan_days=365,
                failure_symptoms=[
                    "Hollow fiber rupture causing particulate spikes",
                    "Biofilm accumulation inside fiber lumen",
                    "Severe flow constriction"
                ],
                current_metrics={"Pore Cutoff": "0.01 µm", "Integrity Check": "Pass"}
            ),
            FilterStage(
                id="stage_uv",
                name="UV In-Tank / In-Line Steriliser",
                stage_number=6,
                technology="Cold-Cathode Germicidal UV-C (254nm LED)",
                health_score=round(uv_health, 1),
                status=calc_status(uv_health),
                estimated_usage_percent=round(uv_usage, 1),
                performance_indicator=f"UV-C radiation output: ~{max(70.0, 100.0 - uv_usage * 0.3):.0f}% intensity",
                last_service_date="300 days ago",
                typical_lifespan_days=450,
                failure_symptoms=[
                    "UV emitter irradiance drop below 16 mJ/cm²",
                    "Quartz sleeve solarisation or iron oxide fouling",
                    "Disinfection ballast failure alert"
                ],
                current_metrics={"Wavelength": "254 nm UV-C", "Operating Run": f"{uv_hours:.0f} hrs"}
            ),
            FilterStage(
                id="stage_alkaliser",
                name="Post-RO Alkaliser & Mineraliser",
                stage_number=7,
                technology="Bioceramic Beads & Calcite/Corosex Bed",
                health_score=round(alk_health, 1),
                status=calc_status(alk_health),
                estimated_usage_percent=round(alk_usage, 1),
                performance_indicator="Mineral elution & pH buffering: pH ~7.6, Mg²⁺/Ca²⁺ enrichment",
                last_service_date="150 days ago",
                typical_lifespan_days=240,
                failure_symptoms=[
                    "Depletion of calcite bed resulting in acidic permeate",
                    "Loss of essential mineral enrichment",
                    "Flat or metallic taste in purified water"
                ],
                current_metrics={"Target pH": "7.5 - 8.2", "Active Cartridge": f"{alk_usage:.1f}% depleted"}
            )
        ]
        return stages

