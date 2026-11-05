import React from 'react';
import {
  SensorReading,
  HealthScore,
  PrognosticsResult,
  SystemSettings,
} from '../types';
import {
  Cpu,
  TrendingDown,
  Calendar,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Target,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';

interface PredictiveAnalyticsPageProps {
  reading: SensorReading;
  health: HealthScore;
  prognostics: PrognosticsResult;
  history: SensorReading[];
  settings: SystemSettings;
}

export const PredictiveAnalyticsPage: React.FC<PredictiveAnalyticsPageProps> = ({
  reading,
  health,
  prognostics,
  history,
  settings,
}) => {
  const currentHealth = health.score;
  const threshold = prognostics.maintenance_threshold;

  // Prepare chart data combining historical points and future projected points
  // Split trajectory into historical & projected keys for distinct visual lines
  const trajectoryData = prognostics.trajectory.map((pt) => {
    return {
      day: `Day ${pt.day} (${pt.date})`,
      dayNum: pt.day,
      historical: pt.is_projected ? null : pt.health,
      projected: pt.is_projected ? pt.health : (pt.day === Math.floor(reading.filter_age_days) ? pt.health : null),
      threshold: threshold,
    };
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low Risk':
        return {
          pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          badge: 'bg-emerald-500',
          card: 'border-emerald-200 bg-emerald-50/20',
        };
      case 'Moderate Risk':
        return {
          pill: 'bg-amber-50 text-amber-700 border-amber-200',
          badge: 'bg-amber-500',
          card: 'border-amber-200 bg-amber-50/20',
        };
      default:
        return {
          pill: 'bg-rose-50 text-rose-700 border-rose-200',
          badge: 'bg-rose-500',
          card: 'border-rose-200 bg-rose-50/20',
        };
    }
  };

  const riskStyle = getRiskColor(prognostics.failure_risk);

  return (
    <div className="space-y-6">
      {/* Top Prognostics Header Banner */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-slate-900 via-navy-900 to-slate-900 text-white shadow-card border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>Failure Prognostics & Remaining Useful Life (RUL) Engine</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            Predictive Degradation Trajectory & Maintenance Horizons
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Analysing rate of decay across permeate flux, pressure differentials, and solute breakthrough
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-slate-800/90 px-3.5 py-2 rounded-xl border border-slate-700 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Failure Risk</span>
            <span className={`text-xs font-bold ${prognostics.failure_risk === 'Low Risk' ? 'text-emerald-400' : (prognostics.failure_risk === 'Moderate Risk' ? 'text-amber-400' : 'text-rose-400')}`}>
              {prognostics.failure_risk}
            </span>
          </div>
          <div className="bg-slate-800/90 px-3.5 py-2 rounded-xl border border-slate-700 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">RUL Horizon</span>
            <span className="text-sm font-extrabold text-teal-400 font-mono">
              {prognostics.remaining_useful_life_days} Days
            </span>
          </div>
        </div>
      </div>

      {/* Row 1: 4 Prognostic Summary KPI Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Estimated RUL */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Remaining Life</span>
            <Calendar className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5 font-mono">
            <span className="text-3xl font-extrabold text-slate-900">
              {prognostics.remaining_useful_life_days}
            </span>
            <span className="text-xs font-semibold text-slate-500">Days</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 font-medium">
            Est. Replacement: <span className="font-bold text-slate-800">{prognostics.estimated_replacement_date}</span>
          </div>
        </div>

        {/* Card 2: Degradation Rate */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Degradation Velocity</span>
            <TrendingDown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5 font-mono">
            <span className="text-3xl font-extrabold text-slate-900">
              {prognostics.degradation_rate_per_day.toFixed(3)}
            </span>
            <span className="text-xs font-semibold text-slate-500">pts / day</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 font-medium">
            Fit Confidence: <span className="font-semibold text-teal-700">{prognostics.confidence_level}</span>
          </div>
        </div>

        {/* Card 3: Primary Failure Mode */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Primary Failure Mode</span>
            <AlertTriangle className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-sm font-bold text-slate-900 line-clamp-2 min-h-[38px] leading-tight">
            {prognostics.primary_failure_mode}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Dominant parameter driving score decay
          </div>
        </div>

        {/* Card 4: Action Threshold */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Maint Threshold</span>
            <Target className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5 font-mono">
            <span className="text-3xl font-extrabold text-slate-900">
              {threshold.toFixed(0)}
            </span>
            <span className="text-xs font-semibold text-slate-500">/ 100 Health</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Buffer: <span className="font-bold text-slate-700">{(currentHealth - threshold).toFixed(1)} pts</span> above replacement
          </div>
        </div>
      </div>

      {/* Row 2: The Main Prognostics Visualization Chart (Historical + Future Projection) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
              <h3 className="font-bold text-slate-900 text-base">
                Prognostics Trajectory: Historical Evolution vs. Forecasted Degradation
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Extrapolates filter life decay until intersection with the critical maintenance threshold line.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
            <span className="flex items-center space-x-1.5 text-teal-700">
              <span className="w-3.5 h-1 bg-teal-600 rounded"></span>
              <span>Historical Sensor Fit</span>
            </span>
            <span className="flex items-center space-x-1.5 text-cyan-600">
              <span className="w-3.5 h-1 bg-cyan-500 border-t border-dashed border-cyan-700 rounded"></span>
              <span>Projected Decay (Prognostics)</span>
            </span>
            <span className="flex items-center space-x-1.5 text-rose-600">
              <span className="w-3.5 h-1 bg-rose-500 rounded"></span>
              <span>Action Threshold ({threshold.toFixed(0)} pts)</span>
            </span>
          </div>
        </div>

        {/* The Chart */}
        <div className="h-72 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trajectoryData} margin={{ top: 10, right: 30, left: -10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <ReferenceLine
                y={threshold}
                label={{
                  value: `Maintenance Threshold (${threshold})`,
                  position: 'insideBottomRight',
                  fill: '#e11d48',
                  fontSize: 11,
                  fontWeight: 600,
                }}
                stroke="#e11d48"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
              {/* Historical Solid Line */}
              <Line
                type="monotone"
                dataKey="historical"
                name="Historical Health"
                stroke="#0d9488"
                strokeWidth={3}
                dot={{ r: 3, fill: '#0d9488' }}
                connectNulls={false}
              />
              {/* Projected Dashed Line */}
              <Line
                type="monotone"
                dataKey="projected"
                name="Projected Horizon"
                stroke="#0891b2"
                strokeWidth={2.5}
                strokeDasharray="6 6"
                dot={{ r: 4, stroke: '#0891b2', fill: '#fff' }}
                connectNulls={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Explanatory Footer */}
        <div className="mt-4 p-3.5 rounded-lg bg-sky-50/70 border border-sky-100 flex items-center justify-between text-xs text-sky-900">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              <strong>Trajectory Interpretation:</strong> Projection intersects the replacement line in{' '}
              <strong>{prognostics.remaining_useful_life_days} days</strong> ({prognostics.estimated_replacement_date}), based on current flow and water draw velocity.
            </span>
          </div>
          <span className="font-mono text-[11px] text-sky-700 shrink-0 font-semibold">
            Threshold: {threshold} pts
          </span>
        </div>
      </div>

      {/* Row 3: Actionable Prognostic Maintenance Recommendations */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card">
        <h3 className="font-bold text-slate-900 text-base mb-1">
          Prescriptive Maintenance & Mitigation Protocols
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Automated guidance generated from real-time physical sensor divergence.
        </p>

        <div className="space-y-3">
          {prognostics.recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start space-x-3.5 hover:bg-white hover:border-slate-300 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Recommended Action</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                    Confidence: {prognostics.confidence_level.split(' ')[0]}
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">{rec}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer Box */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <span>
          <strong>Methodology Declaration:</strong> Predictions are computed via linear parameter decay heuristics calibrated against simulated operating cycles. This prototype has not been trained on proprietary Atomberg field datasets and requires physical test-bench validation.
        </span>
      </div>
    </div>
  );
};

