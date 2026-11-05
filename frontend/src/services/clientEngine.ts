import {
  SensorReading,
  HealthScore,
  HealthBreakdown,
  PrognosticsResult,
  TrajectoryPoint,
  FilterStage,
  MaintenanceEvent,
  SystemSettings,
  SystemStatus,
} from '../types';

export const defaultSettings: SystemSettings = {
  weight_age: 0.20,
  weight_water: 0.25,
  weight_flow: 0.25,
  weight_pressure: 0.15,
  weight_tds: 0.10,
  weight_turbidity: 0.05,
  baseline_flow_rate: 2.0,
  baseline_pressure_drop: 0.3,
  baseline_input_tds: 500.0,
  max_acceptable_output_tds: 100.0,
  max_acceptable_turbidity: 1.0,
  max_rated_volume: 6000.0,
  max_rated_days: 365.0,
  maintenance_threshold: 40.0,
  simulation_interval_sec: 3.0,
  auto_degradation_speed: 1.0,
};

export class ClientEngine {
  private settings: SystemSettings = defaultSettings;
  private currentReading: SensorReading;
  private history: SensorReading[] = [];
  private maintenanceEvents: MaintenanceEvent[] = [];
  public isRunning: boolean = false;
  public scenarioName: string = 'Custom / Standard';

  constructor() {
    this.currentReading = {
      timestamp: new Date().toISOString(),
      input_tds: 480.0,
      output_tds: 28.0,
      turbidity: 0.22,
      flow_rate: 1.85,
      pressure_drop: 0.35,
      cumulative_water: 950.0,
      filter_age_days: 35.0,
      daily_consumption: 28.0,
      is_simulated: true,
    };
    this.seedHistory();
    this.seedMaintenance();
  }

  private seedHistory() {
    const now = new Date();
    this.history = [];
    const baseAge = 45.0;

    for (let i = 30; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const prog = (30 - i) / 30.0;
      const reading: SensorReading = {
        id: 31 - i,
        timestamp: d.toISOString(),
        input_tds: +(480.0 + (i % 7) * 4.5).toFixed(1),
        output_tds: +(24.0 + (prog * 8.0) + (i % 3) * 0.8).toFixed(1),
        turbidity: +(0.18 + (prog * 0.12)).toFixed(2),
        flow_rate: +(1.95 - (prog * 0.25)).toFixed(2),
        pressure_drop: +(0.32 + (prog * 0.14)).toFixed(2),
        cumulative_water: +(800.0 + (30 - i) * 28.5).toFixed(1),
        filter_age_days: +(baseAge - i).toFixed(1),
        daily_consumption: +(28.0 + (i % 5) * 2.2).toFixed(1),
        is_simulated: true,
      };
      this.history.push(reading);
    }
  }

  private seedMaintenance() {
    const now = new Date();
    this.maintenanceEvents = [
      {
        id: 1,
        created_at: new Date(now.getTime() - 45 * 86400000).toISOString(),
        stage_id: 'stage_prefilter',
        stage_name: 'Pre-filtration (Spun Polypropylene)',
        title: 'Scheduled Cartridge Refresh',
        description: 'Routine pre-filter replacement at system commissioning.',
        priority: 'Low',
        status: 'Completed',
        completed_at: new Date(now.getTime() - 45 * 86400000).toISOString(),
        technician_notes: 'Replaced 5-micron spun polypropylene sediment sleeve. Inlet pressure nominal.',
      },
      {
        id: 2,
        created_at: new Date(now.getTime() - 12 * 86400000).toISOString(),
        stage_id: 'stage_carbon',
        stage_name: 'Activated Carbon Filter',
        title: 'Periodic Chlorine & VOC Verification',
        description: 'Tested output post-carbon block for residual free chlorine.',
        priority: 'Medium',
        status: 'Completed',
        completed_at: new Date(now.getTime() - 12 * 86400000).toISOString(),
        technician_notes: 'Zero free chlorine breakthrough detected. Adsorption capacity nominal.',
      },
      {
        id: 3,
        created_at: new Date(now.getTime() - 2 * 86400000).toISOString(),
        stage_id: 'stage_ro',
        stage_name: 'RO Membrane Assembly',
        title: 'Predictive Flow Rate Monitoring',
        description: 'Prognostics detected slight 12% flow divergence from clean baseline.',
        priority: 'Medium',
        status: 'Pending',
        completed_at: null,
        technician_notes: 'Keep under observation. Flushing cycle recommended during next service.',
      },
    ];
  }

  public getSettings(): SystemSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: SystemSettings) {
    this.settings = { ...newSettings };
  }

  public validateReading(reading: SensorReading): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    if (reading.input_tds < 0 || reading.input_tds > 3000) {
      issues.push(`Input TDS (${reading.input_tds} ppm) out of physical bounds [0, 3000 ppm]`);
    }
    if (reading.output_tds < 0 || reading.output_tds > reading.input_tds * 1.2) {
      issues.push(`Output TDS (${reading.output_tds} ppm) is invalid relative to input (${reading.input_tds} ppm)`);
    }
    if (reading.turbidity < 0 || reading.turbidity > 50) {
      issues.push(`Turbidity (${reading.turbidity} NTU) out of valid range [0, 50 NTU]`);
    }
    if (reading.flow_rate < 0 || reading.flow_rate > 10.0) {
      issues.push(`Flow rate (${reading.flow_rate} L/min) is invalid or sensor disconnected`);
    }
    if (reading.pressure_drop < 0 || reading.pressure_drop > 5.0) {
      issues.push(`Pressure drop (${reading.pressure_drop} bar) out of valid operating range`);
    }
    if (reading.cumulative_water < 0) {
      issues.push('Cumulative water volume cannot be negative');
    }
    if (reading.filter_age_days < 0) {
      issues.push('Filter operating age cannot be negative');
    }
    return { isValid: issues.length === 0, issues };
  }

  public calculateHealth(reading: SensorReading): HealthScore {
    const s = this.settings;

    // 1. Age Contribution
    const ageRatio = Math.min(Math.max(reading.filter_age_days / Math.max(s.max_rated_days, 1), 0), 1.5);
    const ageContrib = ageRatio * 100.0 * s.weight_age;

    // 2. Water Usage Contribution
    const usageRatio = Math.min(Math.max(reading.cumulative_water / Math.max(s.max_rated_volume, 1), 0), 1.5);
    const waterContrib = usageRatio * 100.0 * s.weight_water;

    // 3. Flow Reduction Contribution
    let flowReductionRatio = 0;
    if (s.baseline_flow_rate > 0) {
      flowReductionRatio = Math.max(0, (s.baseline_flow_rate - reading.flow_rate) / s.baseline_flow_rate);
    }
    flowReductionRatio = Math.min(flowReductionRatio, 1.0);
    const flowContrib = Math.pow(flowReductionRatio, 1.1) * 100.0 * s.weight_flow;

    // 4. Pressure Drop Contribution
    const pressureDelta = Math.max(0, reading.pressure_drop - s.baseline_pressure_drop);
    const pressureRatio = Math.min(Math.max(pressureDelta / 1.5, 0), 1.5);
    const pressureContrib = pressureRatio * 100.0 * s.weight_pressure;

    // 5. Water Quality (TDS) Contribution
    let tdsPenaltyRatio = 0;
    if (reading.input_tds > 10) {
      const rejectionEfficiency = Math.max(0, (reading.input_tds - reading.output_tds) / reading.input_tds);
      tdsPenaltyRatio = Math.max(0, (0.95 - rejectionEfficiency) / 0.5);
    }
    const tdsOutputRatio = Math.max(0, (reading.output_tds - 30.0) / Math.max(s.max_acceptable_output_tds - 30.0, 1.0));
    const tdsCombinedRatio = Math.min(Math.max(tdsPenaltyRatio * 0.6 + tdsOutputRatio * 0.4, 0), 1.5);
    const tdsContrib = tdsCombinedRatio * 100.0 * s.weight_tds;

    // 6. Turbidity Contribution
    const turbidityRatio = Math.min(Math.max(reading.turbidity / Math.max(s.max_acceptable_turbidity, 0.1), 0), 2.0);
    const turbidityContrib = turbidityRatio * 100.0 * s.weight_turbidity;

    const totalDegradation = ageContrib + waterContrib + flowContrib + pressureContrib + tdsContrib + turbidityContrib;
    const rawHealth = 100.0 - totalDegradation;
    const health = +Math.min(Math.max(rawHealth, 0), 100).toFixed(1);

    const breakdown: HealthBreakdown = {
      age_contribution: +ageContrib.toFixed(2),
      water_usage_contribution: +waterContrib.toFixed(2),
      flow_reduction_contribution: +flowContrib.toFixed(2),
      pressure_contribution: +pressureContrib.toFixed(2),
      tds_contribution: +tdsContrib.toFixed(2),
      turbidity_contribution: +turbidityContrib.toFixed(2),
      total_degradation: +totalDegradation.toFixed(2),
    };

    let status: 'Healthy' | 'Attention Required' | 'Critical' = 'Healthy';
    let explanation = 'Purifier filter assembly is operating within optimal nominal parameters.';
    if (health < 45.0) {
      status = 'Critical';
      explanation = 'Significant filter degradation or fouling detected. Immediate filter inspection/replacement advised.';
    } else if (health < 75.0) {
      status = 'Attention Required';
      explanation = 'Moderate degradation observed. Flow reduction or operating age suggests planned servicing soon.';
    }

    const scoreChange24h = health >= 75 ? -0.3 : (health >= 45 ? -0.8 : -1.8);

    return {
      score: health,
      status,
      score_change_24h: scoreChange24h,
      breakdown,
      explanation,
    };
  }

  public runPrognostics(reading: SensorReading): PrognosticsResult {
    const healthObj = this.calculateHealth(reading);
    const currentHealth = healthObj.score;
    const threshold = this.settings.maintenance_threshold;

    // Degradation rate estimation
    let ratePerDay = 0.25;
    let confidenceLevel = 'Prototype Baseline';

    if (this.history.length >= 5) {
      // Linear slope calculation
      const n = this.history.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
      for (const h of this.history) {
        const x = h.filter_age_days;
        const y = this.calculateHealth(h).score;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
      }
      const denom = (n * sumX2 - sumX * sumX);
      if (denom !== 0) {
        const slope = (n * sumXY - sumX * sumY) / denom;
        if (slope < -0.01) {
          ratePerDay = Math.abs(slope);
          confidenceLevel = 'High (Historical Fit)';
        } else {
          ratePerDay = Math.max(0.12, Math.abs(slope));
          confidenceLevel = 'Moderate (Trend Heuristic)';
        }
      }
    } else if (reading.filter_age_days > 10) {
      const drop = Math.max(1.0, 100.0 - currentHealth);
      ratePerDay = +(drop / reading.filter_age_days).toFixed(3);
      confidenceLevel = 'Moderate (Trend Heuristic)';
    }

    ratePerDay = Math.max(0.05, Math.min(ratePerDay, 4.0));

    let rulDays = 0;
    if (currentHealth > threshold) {
      rulDays = Math.ceil((currentHealth - threshold) / ratePerDay);
    }

    const now = new Date();
    const replacementDateObj = new Date(now.getTime() + rulDays * 86400000);
    const estReplacementDate = replacementDateObj.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    let failureRisk: 'Low Risk' | 'Moderate Risk' | 'High Risk' = 'Low Risk';
    if (currentHealth < 45 || (rulDays <= 20 && currentHealth <= 50)) {
      failureRisk = 'High Risk';
    } else if (currentHealth < 75 || rulDays <= 60) {
      failureRisk = 'Moderate Risk';
    }

    const breakdown = healthObj.breakdown;
    const contributions = [
      { name: 'Flow Reduction / Membrane Fouling', val: breakdown.flow_reduction_contribution },
      { name: 'Differential Pressure Rise / Clogging', val: breakdown.pressure_contribution },
      { name: 'Rated Volumetric Usage Exceeded', val: breakdown.water_usage_contribution },
      { name: 'Operating Lifespan Elapsed', val: breakdown.age_contribution },
      { name: 'Membrane Rejection Deterioration (TDS)', val: breakdown.tds_contribution },
      { name: 'Particulate Influx / Pre-filter Silt', val: breakdown.turbidity_contribution },
    ];
    contributions.sort((a, b) => b.val - a.val);
    const primaryFailureMode = contributions[0].name;

    const recommendations: string[] = [];
    const flowPctDrop = ((this.settings.baseline_flow_rate - reading.flow_rate) / this.settings.baseline_flow_rate) * 100;
    if (flowPctDrop > 25) {
      recommendations.push(
        `Flow rate has declined by ${flowPctDrop.toFixed(1)}% compared with baseline (${this.settings.baseline_flow_rate} L/min). Possible filter restriction or particulate fouling detected. Inspect pre-filter and RO membrane.`
      );
    }
    if (reading.pressure_drop > 0.8) {
      recommendations.push(
        `Pressure drop across filter assembly is elevated (${reading.pressure_drop.toFixed(2)} bar vs ${this.settings.baseline_pressure_drop} bar nominal). Sediment filter cake resistance increasing.`
      );
    }
    if (reading.output_tds > this.settings.max_acceptable_output_tds) {
      recommendations.push(
        `Output TDS is ${reading.output_tds.toFixed(0)} ppm (exceeds target limit of ${this.settings.max_acceptable_output_tds.toFixed(0)} ppm). Reverse Osmosis membrane salt passage detected. Check booster pump and membrane seal.`
      );
    }
    if (reading.turbidity > this.settings.max_acceptable_turbidity) {
      recommendations.push(
        `Permeate turbidity is ${reading.turbidity.toFixed(2)} NTU. Inspect UF membrane integrity and sediment stage seals.`
      );
    }

    if (recommendations.length === 0) {
      if (rulDays > 90) {
        recommendations.push('Continue normal operation and periodic monitoring. All physical indices are within normal bounds.');
      } else if (rulDays > 30) {
        recommendations.push('Operating parameters are normal. Plan preventive filter replacement within the next 4–6 weeks.');
      } else {
        recommendations.push('Filter approaching end-of-life based on cumulative water processed. Schedule service technician visit.');
      }
    }

    // Trajectory
    const trajectory: TrajectoryPoint[] = [];
    const stepDays = Math.max(1, Math.floor(reading.filter_age_days / 10));
    for (let d = 0; d <= reading.filter_age_days; d += stepDays) {
      const dt = new Date(now.getTime() - (reading.filter_age_days - d) * 86400000);
      const dateStr = dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      const simScore = Math.max(
        currentHealth,
        100.0 - (100.0 - currentHealth) * Math.pow(d / Math.max(reading.filter_age_days, 1), 1.1)
      );
      trajectory.push({
        day: d,
        date: dateStr,
        health: +simScore.toFixed(1),
        is_projected: false,
      });
    }

    if (!trajectory.some((tp) => tp.day === Math.floor(reading.filter_age_days))) {
      trajectory.push({
        day: Math.floor(reading.filter_age_days),
        date: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        health: currentHealth,
        is_projected: false,
      });
    }

    const projDays = Math.max(rulDays + 20, 45);
    const projStep = Math.max(1, Math.floor(projDays / 10));
    const currDay = Math.floor(reading.filter_age_days);

    for (let forward = projStep; forward <= projDays; forward += projStep) {
      const futureDay = currDay + forward;
      const dt = new Date(now.getTime() + forward * 86400000);
      const dateStr = dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      const projHealth = Math.max(10.0, currentHealth - forward * ratePerDay);
      trajectory.push({
        day: futureDay,
        date: dateStr,
        health: +projHealth.toFixed(1),
        is_projected: true,
      });
    }

    return {
      health_score: currentHealth,
      health_status: healthObj.status,
      remaining_useful_life_days: rulDays,
      estimated_replacement_date: estReplacementDate,
      confidence_level: confidenceLevel,
      degradation_rate_per_day: +ratePerDay.toFixed(3),
      failure_risk: failureRisk,
      primary_failure_mode: primaryFailureMode,
      recommendations,
      trajectory,
      maintenance_threshold: threshold,
    };
  }

  public loadScenario(scenarioId: number): SensorReading {
    const nowStr = new Date().toISOString();
    if (scenarioId === 1) {
      this.scenarioName = 'Scenario 1: Healthy Purifier';
      this.currentReading = {
        timestamp: nowStr,
        input_tds: 420.0,
        output_tds: 22.0,
        turbidity: 0.15,
        flow_rate: 1.92,
        pressure_drop: 0.32,
        cumulative_water: 450.0,
        filter_age_days: 18.0,
        daily_consumption: 25.0,
        is_simulated: true,
      };
    } else if (scenarioId === 2) {
      this.scenarioName = 'Scenario 2: Filter Degradation';
      this.currentReading = {
        timestamp: nowStr,
        input_tds: 530.0,
        output_tds: 68.0,
        turbidity: 0.65,
        flow_rate: 1.18,
        pressure_drop: 0.88,
        cumulative_water: 4850.0,
        filter_age_days: 210.0,
        daily_consumption: 29.0,
        is_simulated: true,
      };
    } else if (scenarioId === 3) {
      this.scenarioName = 'Scenario 3: Abnormal Performance';
      this.currentReading = {
        timestamp: nowStr,
        input_tds: 690.0,
        output_tds: 142.0,
        turbidity: 2.95,
        flow_rate: 0.58,
        pressure_drop: 1.52,
        cumulative_water: 6200.0,
        filter_age_days: 265.0,
        daily_consumption: 34.0,
        is_simulated: true,
      };
    }
    this.history.push({ ...this.currentReading, id: this.history.length + 1 });
    return { ...this.currentReading };
  }

  public step(deltaSec: number = 3.0): SensorReading {
    const r = this.currentReading;
    const agingMult = this.settings.auto_degradation_speed;
    const waterDelta = (r.flow_rate / 60.0) * deltaSec * agingMult * 0.8;
    const newCumWater = +(r.cumulative_water + Math.max(0.01, waterDelta)).toFixed(1);
    const newAge = +(r.filter_age_days + (deltaSec / 86400.0) * agingMult * 5.0).toFixed(1);

    const noiseFlow = (Math.random() - 0.5) * 0.04;
    const noiseTdsIn = (Math.random() - 0.5) * 6.0;
    const noiseTdsOut = (Math.random() - 0.5) * 1.6;
    const noiseTurb = (Math.random() - 0.5) * 0.02;
    const noisePress = (Math.random() - 0.5) * 0.02;

    const cloggingDrift = (newCumWater / Math.max(this.settings.max_rated_volume, 1)) * 0.0005 * agingMult;
    const newFlow = +Math.max(0.3, r.flow_rate - cloggingDrift + noiseFlow).toFixed(2);
    const newPress = +Math.min(3.0, r.pressure_drop + cloggingDrift * 0.8 + noisePress).toFixed(2);
    const newInTds = +Math.max(100, Math.min(1200, r.input_tds + noiseTdsIn)).toFixed(1);

    const baseRejection = Math.max(0.70, 0.96 - (newCumWater / this.settings.max_rated_volume) * 0.15);
    const idealOutTds = newInTds * (1.0 - baseRejection);
    const newOutTds = +Math.max(10, Math.min(newInTds * 0.9, idealOutTds + noiseTdsOut)).toFixed(1);
    const newTurb = +Math.max(0.05, Math.min(5.0, r.turbidity + noiseTurb)).toFixed(2);

    this.currentReading = {
      id: this.history.length + 1,
      timestamp: new Date().toISOString(),
      input_tds: newInTds,
      output_tds: newOutTds,
      turbidity: newTurb,
      flow_rate: newFlow,
      pressure_drop: newPress,
      cumulative_water: newCumWater,
      filter_age_days: newAge,
      daily_consumption: r.daily_consumption,
      is_simulated: true,
    };

    this.history.push({ ...this.currentReading });
    if (this.history.length > 200) {
      this.history.shift();
    }
    return { ...this.currentReading };
  }

  public updateManualReading(partial: Partial<SensorReading>): SensorReading {
    this.currentReading = {
      ...this.currentReading,
      ...partial,
      timestamp: new Date().toISOString(),
      is_simulated: true,
    };
    this.history.push({ ...this.currentReading, id: this.history.length + 1 });
    return { ...this.currentReading };
  }

  public getStagesStatus(): FilterStage[] {
    const r = this.currentReading;
    const age = r.filter_age_days;
    const cumL = r.cumulative_water;

    const preUsage = Math.min(100.0, (cumL / 3000.0) * 100.0);
    const preHealth = Math.max(15.0, 100.0 - preUsage * 0.75 - r.turbidity * 8.0);

    const sedUsage = Math.min(100.0, (cumL / 4000.0) * 100.0);
    const sedHealth = Math.max(20.0, 100.0 - sedUsage * 0.7 - (r.pressure_drop - 0.3) * 25.0);

    const carbUsage = Math.min(100.0, (cumL / 4500.0) * 100.0);
    const carbHealth = Math.max(25.0, 100.0 - carbUsage * 0.65 - (age / 365.0) * 25.0);

    const roRejection = ((r.input_tds - r.output_tds) / Math.max(r.input_tds, 1)) * 100.0;
    const roUsage = Math.min(100.0, (cumL / this.settings.max_rated_volume) * 100.0);
    const roHealth = Math.max(10.0, Math.min(100.0, roRejection * 0.7 + (30.0 - roUsage * 0.3)));

    const ufUsage = Math.min(100.0, (cumL / 5000.0) * 100.0);
    const ufHealth = Math.max(30.0, 100.0 - ufUsage * 0.5 - r.turbidity * 12.0);

    const uvHours = age * 24.0;
    const uvUsage = Math.min(100.0, (uvHours / 8000.0) * 100.0);
    const uvHealth = Math.max(40.0, 100.0 - uvUsage * 0.6);

    const alkUsage = Math.min(100.0, (cumL / 3500.0) * 100.0);
    const alkHealth = Math.max(25.0, 100.0 - alkUsage * 0.8);

    const calcStatus = (h: number): 'Healthy' | 'Attention Required' | 'Critical' => {
      if (h >= 75) return 'Healthy';
      if (h >= 45) return 'Attention Required';
      return 'Critical';
    };

    return [
      {
        id: 'stage_prefilter',
        name: 'Pre-filtration (Sediment Spun 5µm)',
        stage_number: 1,
        technology: 'Depth Spun Polypropylene',
        health_score: +preHealth.toFixed(1),
        status: calcStatus(preHealth),
        estimated_usage_percent: +preUsage.toFixed(1),
        performance_indicator: `Inlet turbidity capture: ${r.turbidity.toFixed(2)} NTU load`,
        last_service_date: '45 days ago',
        typical_lifespan_days: 90,
        failure_symptoms: [
          'Brownish cartridge discoloration visible in housing',
          'Rapid upstream pressure build-up',
          'Visible particulate bypass into second stage',
        ],
        current_metrics: { Turbidity: `${r.turbidity.toFixed(2)} NTU`, 'Operating Days': `${age.toFixed(0)} d` },
      },
      {
        id: 'stage_sediment',
        name: 'Sediment Filter (Fine 1µm)',
        stage_number: 2,
        technology: 'Melt-blown Polymeric Matrix',
        health_score: +sedHealth.toFixed(1),
        status: calcStatus(sedHealth),
        estimated_usage_percent: +sedUsage.toFixed(1),
        performance_indicator: `Differential pressure drop: ${r.pressure_drop.toFixed(2)} bar`,
        last_service_date: '120 days ago',
        typical_lifespan_days: 180,
        failure_symptoms: [
          'High pressure drop exceeding 0.7 bar',
          'Reduced feed rate to booster pump',
          'Acoustic cavitation in downstream pump',
        ],
        current_metrics: { 'Delta Pressure': `${r.pressure_drop.toFixed(2)} bar`, Usage: `${sedUsage.toFixed(1)}%` },
      },
      {
        id: 'stage_carbon',
        name: 'Activated Carbon Block',
        stage_number: 3,
        technology: 'Acid-washed Coconut Shell Charcoal',
        health_score: +carbHealth.toFixed(1),
        status: calcStatus(carbHealth),
        estimated_usage_percent: +carbUsage.toFixed(1),
        performance_indicator: 'Adsorption bed capacity: ~78% active micropores',
        last_service_date: '180 days ago',
        typical_lifespan_days: 240,
        failure_symptoms: [
          'Chlorine breakthrough or pungent chemical odor',
          'Trihalomethane (THM) passage into RO membrane',
          'Organic fouling of downstream polyamide membrane',
        ],
        current_metrics: { 'Chlorine Adsorption': 'Nominal', 'Estimated Lifespan': '240 days' },
      },
      {
        id: 'stage_ro',
        name: 'Reverse Osmosis (RO) Membrane',
        stage_number: 4,
        technology: 'Thin-Film Composite (TFC) Polyamide',
        health_score: +roHealth.toFixed(1),
        status: calcStatus(roHealth),
        estimated_usage_percent: +roUsage.toFixed(1),
        performance_indicator: `Salt rejection: ${roRejection.toFixed(1)}% (${r.input_tds.toFixed(0)} -> ${r.output_tds.toFixed(0)} ppm)`,
        last_service_date: '210 days ago',
        typical_lifespan_days: 365,
        failure_symptoms: [
          'Sharp decrease in permeate flux (flow rate < 1.0 L/min)',
          'Salt passage exceeding 100 ppm output TDS',
          'Mineral scale deposition (calcium carbonate / silica)',
        ],
        current_metrics: { 'Salt Rejection': `${roRejection.toFixed(1)}%`, 'Flux Flow': `${r.flow_rate.toFixed(2)} L/min` },
      },
      {
        id: 'stage_uf',
        name: 'Ultrafiltration (UF) Stage',
        stage_number: 5,
        technology: 'Hollow Fiber Membrane (0.01µm)',
        health_score: +ufHealth.toFixed(1),
        status: calcStatus(ufHealth),
        estimated_usage_percent: +ufUsage.toFixed(1),
        performance_indicator: 'Colloidal and macromolecule barrier status: Active',
        last_service_date: '210 days ago',
        typical_lifespan_days: 365,
        failure_symptoms: [
          'Hollow fiber rupture causing particulate spikes',
          'Biofilm accumulation inside fiber lumen',
          'Severe flow constriction',
        ],
        current_metrics: { 'Pore Cutoff': '0.01 µm', 'Integrity Check': 'Pass' },
      },
      {
        id: 'stage_uv',
        name: 'UV In-Tank / In-Line Steriliser',
        stage_number: 6,
        technology: 'Cold-Cathode Germicidal UV-C (254nm LED)',
        health_score: +uvHealth.toFixed(1),
        status: calcStatus(uvHealth),
        estimated_usage_percent: +uvUsage.toFixed(1),
        performance_indicator: `UV-C radiation output: ~${Math.max(70, 100 - uvUsage * 0.3).toFixed(0)}% intensity`,
        last_service_date: '300 days ago',
        typical_lifespan_days: 450,
        failure_symptoms: [
          'UV emitter irradiance drop below 16 mJ/cm²',
          'Quartz sleeve solarisation or iron oxide fouling',
          'Disinfection ballast failure alert',
        ],
        current_metrics: { Wavelength: '254 nm UV-C', 'Operating Run': `${uvHours.toFixed(0)} hrs` },
      },
      {
        id: 'stage_alkaliser',
        name: 'Post-RO Alkaliser & Mineraliser',
        stage_number: 7,
        technology: 'Bioceramic Beads & Calcite/Corosex Bed',
        health_score: +alkHealth.toFixed(1),
        status: calcStatus(alkHealth),
        estimated_usage_percent: +alkUsage.toFixed(1),
        performance_indicator: 'Mineral elution & pH buffering: pH ~7.6, Mg²⁺/Ca²⁺ enrichment',
        last_service_date: '150 days ago',
        typical_lifespan_days: 240,
        failure_symptoms: [
          'Depletion of calcite bed resulting in acidic permeate',
          'Loss of essential mineral enrichment',
          'Flat or metallic taste in purified water',
        ],
        current_metrics: { 'Target pH': '7.5 - 8.2', 'Active Cartridge': `${alkUsage.toFixed(1)}% depleted` },
      },
    ];
  }

  public getMaintenance(): MaintenanceEvent[] {
    return [...this.maintenanceEvents];
  }

  public addMaintenance(event: Omit<MaintenanceEvent, 'id' | 'created_at' | 'status'>): MaintenanceEvent {
    const newEvent: MaintenanceEvent = {
      ...event,
      id: this.maintenanceEvents.length + 1,
      created_at: new Date().toISOString(),
      status: 'Pending',
    };
    this.maintenanceEvents.unshift(newEvent);
    return newEvent;
  }

  public updateMaintenanceStatus(id: number, status: 'Pending' | 'In Progress' | 'Completed', notes?: string) {
    const ev = this.maintenanceEvents.find((e) => e.id === id);
    if (ev) {
      ev.status = status;
      if (status === 'Completed') {
        ev.completed_at = new Date().toISOString();
      }
      if (notes !== undefined) {
        ev.technician_notes = notes;
      }
    }
  }

  public getHistory(limit: number = 50): SensorReading[] {
    return this.history.slice(-limit);
  }

  public resetDatabase() {
    this.seedHistory();
    this.seedMaintenance();
    this.loadScenario(1);
  }

  public getCurrentState() {
    const reading = { ...this.currentReading };
    const { isValid, issues } = this.validateReading(reading);
    const health = this.calculateHealth(reading);
    const prognostics = this.runPrognostics(reading);
    return {
      reading,
      health,
      prognostics,
      valid: isValid,
      sensor_issues: issues,
    };
  }

  public getSystemStatus(): SystemStatus {
    const { isValid, issues } = this.validateReading(this.currentReading);
    return {
      device_id: 'ATMB-AQUASENSE-001',
      device_name: 'Atomberg Multi-Stage Smart RO+UF+UV',
      status: 'Online',
      simulation_mode: this.scenarioName,
      is_simulated: true,
      is_running: this.isRunning,
      last_updated: this.currentReading.timestamp,
      sensor_validity: isValid ? 'Valid' : 'Sensor Warning',
      sensor_issues: issues,
      server_time: new Date().toISOString(),
    };
  }
}

export const clientEngine = new ClientEngine();

