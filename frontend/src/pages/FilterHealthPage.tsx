import React from 'react';
import {
  SensorReading,
  HealthScore,
  FilterStage,
  SystemSettings,
} from '../types';
import { HealthGauge } from '../components/HealthGauge';
import { StageDiagram } from '../components/StageDiagram';
import {
  HeartPulse,
  Sliders,
  Info,
  Clock,
  Droplets,
  Gauge,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

interface FilterHealthPageProps {
  reading: SensorReading;
  health: HealthScore;
  stages: FilterStage[];
  settings: SystemSettings;
}

export const FilterHealthPage: React.FC<FilterHealthPageProps> = ({
  reading,
  health,
  stages,
  settings,
}) => {
  const b = health.breakdown;

  const contributions = [
    {
      label: 'Cumulative Water Usage',
      weight: `${(settings.weight_water * 100).toFixed(0)}%`,
      points: b.water_usage_contribution,
      maxPoints: settings.weight_water * 100,
      icon: Droplets,
      color: 'bg-sky-500',
      reason: `${reading.cumulative_water.toLocaleString()} L of rated ${settings.max_rated_volume.toLocaleString()} L volume consumed`,
    },
    {
      label: 'Permeate Flow Reduction',
      weight: `${(settings.weight_flow * 100).toFixed(0)}%`,
      points: b.flow_reduction_contribution,
      maxPoints: settings.weight_flow * 100,
      icon: Activity,
      color: 'bg-teal-500',
      reason: `Current: ${reading.flow_rate.toFixed(2)} L/min vs baseline ${settings.baseline_flow_rate.toFixed(1)} L/min`,
    },
    {
      label: 'Filter Operating Age',
      weight: `${(settings.weight_age * 100).toFixed(0)}%`,
      points: b.age_contribution,
      maxPoints: settings.weight_age * 100,
      icon: Clock,
      color: 'bg-indigo-500',
      reason: `${reading.filter_age_days.toFixed(0)} days of rated ${settings.max_rated_days.toFixed(0)} days`,
    },
    {
      label: 'Differential Pressure (ΔP)',
      weight: `${(settings.weight_pressure * 100).toFixed(0)}%`,
      points: b.pressure_contribution,
      maxPoints: settings.weight_pressure * 100,
      icon: Gauge,
      color: 'bg-amber-500',
      reason: `${reading.pressure_drop.toFixed(2)} bar vs nominal baseline ${settings.baseline_pressure_drop.toFixed(2)} bar`,
    },
    {
      label: 'TDS Rejection Proxy',
      weight: `${(settings.weight_tds * 100).toFixed(0)}%`,
      points: b.tds_contribution,
      maxPoints: settings.weight_tds * 100,
      icon: Sparkles,
      color: 'bg-cyan-500',
      reason: `Output: ${reading.output_tds.toFixed(0)} ppm (Inlet: ${reading.input_tds.toFixed(0)} ppm)`,
    },
    {
      label: 'Turbidity Deterioration',
      weight: `${(settings.weight_turbidity * 100).toFixed(0)}%`,
      points: b.turbidity_contribution,
      maxPoints: settings.weight_turbidity * 100,
      icon: Layers,
      color: 'bg-emerald-500',
      reason: `Permeate turbidity: ${reading.turbidity.toFixed(2)} NTU (Target < 1.00)`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner explaining transparent calculation */}
      <div className="p-4 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
            <HeartPulse className="w-4 h-4" />
            <span>Explainable Multi-Parameter Health Engine</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">
            Transparent Degradation Decomposition
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Filter Health Score = 100 − Σ (Normalized Parameter Penalties × Configured Prototype Weights)
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700/60 font-mono text-xs text-slate-300">
          <Info className="w-4 h-4 text-teal-400 shrink-0" />
          <span>Weights are prototype assumptions, not manufacturer warranties.</span>
        </div>
      </div>

      {/* Row 1: Gauge + Breakdown Decomposition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Overall Health Summary Card */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-card flex flex-col justify-between">
          <h3 className="font-bold text-slate-900 text-base pb-3 border-b border-slate-100">
            Composite Health Status
          </h3>

          <div className="my-auto py-4">
            <HealthGauge health={health} size={260} />
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100 text-xs">
            <div className="flex justify-between text-slate-600">
              <span className="font-medium">Total Degradation Penalty:</span>
              <span className="font-mono font-bold text-rose-600">-{b.total_degradation.toFixed(1)} pts</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span className="font-medium">Net Filter Health Score:</span>
              <span className="font-mono font-bold text-teal-600">{health.score.toFixed(1)} / 100</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span className="font-medium">Current Operational Band:</span>
              <span className="font-bold text-slate-900">{health.status}</span>
            </div>
          </div>
        </div>

        {/* Right: Detailed Parameter Contribution Breakdown */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Weighted Degradation Breakdown</h3>
              <p className="text-xs text-slate-500 mt-0.5">Understand why and how the health score changes</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
              Total Penalty: {b.total_degradation.toFixed(1)}%
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {contributions.map((item, index) => {
              const Icon = item.icon;
              const pctOfDegradation = b.total_degradation > 0 ? (item.points / b.total_degradation) * 100 : 0;
              return (
                <div key={index} className="p-3 rounded-lg border border-slate-100 bg-slate-50/60">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4 text-slate-500" />
                      <span className="font-bold text-slate-800">{item.label}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        (Weight: {item.weight})
                      </span>
                    </div>
                    <div className="flex items-baseline space-x-1.5 font-mono">
                      <span className="font-extrabold text-slate-900 text-sm">
                        -{item.points.toFixed(1)}
                      </span>
                      <span className="text-slate-400 text-[10px]">pts</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{
                        width: `${Math.min(100, (item.points / item.maxPoints) * 100)}%`,
                      }}
                    ></div>
                  </div>

                  <div className="mt-1.5 flex justify-between items-center text-[11px] text-slate-500">
                    <span className="truncate max-w-[320px]">{item.reason}</span>
                    <span className="font-medium text-slate-400">
                      {pctOfDegradation.toFixed(0)}% of total penalty
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Multi-Stage Filter Monitoring Section */}
      <StageDiagram stages={stages} />
    </div>
  );
};

