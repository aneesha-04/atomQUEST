import React from 'react';
import {
  SensorReading,
  HealthScore,
  PrognosticsResult,
  MaintenanceEvent,
} from '../types';
import { KpiCard } from '../components/KpiCard';
import { HealthGauge } from '../components/HealthGauge';
import {
  HeartPulse,
  Calendar,
  Droplet,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

interface OverviewPageProps {
  reading: SensorReading;
  health: HealthScore;
  prognostics: PrognosticsResult;
  history: SensorReading[];
  maintenanceEvents: MaintenanceEvent[];
  onNavigateTab: (tab: any) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  reading,
  health,
  prognostics,
  history,
  maintenanceEvents,
  onNavigateTab,
}) => {
  // Historical chart data
  const chartData = history.slice(-20).map((r, i) => {
    const d = new Date(r.timestamp);
    const label = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
    // Reconstruct degradation score proxy
    const flowDrop = Math.max(0, (2.0 - r.flow_rate) / 2.0);
    const scoreEst = Math.max(15, 100 - (r.cumulative_water / 6000 * 30 + flowDrop * 40 + (r.filter_age_days / 365 * 25)));
    return {
      name: label,
      flow_rate: r.flow_rate,
      output_tds: r.output_tds,
      input_tds: r.input_tds,
      health: +scoreEst.toFixed(1),
      turbidity: r.turbidity,
    };
  });

  // Calculate salt rejection & recovery ratio proxy
  const rejectionRate = ((reading.input_tds - reading.output_tds) / Math.max(reading.input_tds, 1)) * 100;
  const recoveryRatio = reading.flow_rate > 0.4 ? 65.0 : 42.0; // standard domestic RO recovery proxy %

  // Filter pending or high priority alerts
  const pendingAlerts = maintenanceEvents.filter((e) => e.status !== 'Completed').slice(0, 3);

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'Healthy':
        return { text: 'Optimal', variant: 'success' as const };
      case 'Attention Required':
        return { text: 'Attention', variant: 'warning' as const };
      default:
        return { text: 'Critical', variant: 'danger' as const };
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'Low Risk':
        return { text: 'Low Risk', variant: 'success' as const };
      case 'Moderate Risk':
        return { text: 'Moderate Risk', variant: 'warning' as const };
      default:
        return { text: 'High Risk', variant: 'danger' as const };
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI A: Overall Filter Health */}
        <KpiCard
          title="Overall Filter Health"
          value={health.score.toFixed(1)}
          unit="/100"
          subtitle={`Status: ${health.status}`}
          icon={HeartPulse}
          iconColor="text-teal-600 bg-teal-50"
          badge={getHealthBadge(health.status)}
          trend={{
            value: `${health.score_change_24h > 0 ? '+' : ''}${health.score_change_24h}%`,
            isPositive: health.score_change_24h >= 0,
            label: '24h drift',
          }}
        />

        {/* KPI B: Estimated Remaining Useful Life */}
        <KpiCard
          title="Estimated Remaining Life (RUL)"
          value={prognostics.remaining_useful_life_days}
          unit="Days"
          subtitle={`Due: ${prognostics.estimated_replacement_date}`}
          icon={Calendar}
          iconColor="text-cyan-600 bg-cyan-50"
          badge={getRiskBadge(prognostics.failure_risk)}
          trend={{
            value: prognostics.confidence_level.split(' ')[0],
            isPositive: prognostics.confidence_level.includes('High'),
            label: 'confidence',
          }}
        />

        {/* KPI C: Water Processed */}
        <KpiCard
          title="Cumulative Water Processed"
          value={reading.cumulative_water.toLocaleString()}
          unit="Litres"
          subtitle={`Avg: ${reading.daily_consumption.toFixed(0)} L/day`}
          icon={Droplet}
          iconColor="text-sky-600 bg-sky-50"
          badge={{ text: 'Rated: 6,000L', variant: 'neutral' }}
          trend={{
            value: `${((reading.cumulative_water / 6000) * 100).toFixed(0)}%`,
            isPositive: false,
            label: 'capacity used',
          }}
        />

        {/* KPI D: System Performance */}
        <KpiCard
          title="System Hydraulics"
          value={reading.flow_rate.toFixed(2)}
          unit="L/min"
          subtitle={`ΔP: ${reading.pressure_drop.toFixed(2)} bar`}
          icon={Gauge}
          iconColor="text-indigo-600 bg-indigo-50"
          badge={{
            text: reading.flow_rate >= 1.5 ? 'Nominal Flow' : (reading.flow_rate >= 1.0 ? 'Restricted' : 'Choked'),
            variant: reading.flow_rate >= 1.5 ? 'success' : (reading.flow_rate >= 1.0 ? 'warning' : 'danger'),
          }}
          trend={{
            value: `${reading.pressure_drop < 0.6 ? 'Low ΔP' : (reading.pressure_drop < 1.0 ? 'Moderate ΔP' : 'High ΔP')}`,
            isPositive: reading.pressure_drop < 0.6,
          }}
        />
      </div>

      {/* Row 2: Health Overview Gauge & Water Quality Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Section A: Filter Health Overview (Gauge) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Filter Health Overview</h3>
              <p className="text-xs text-slate-500 mt-0.5">Weighted multi-parameter degradation estimate</p>
            </div>
            <button
              onClick={() => onNavigateTab('health')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
            >
              View Breakdown &rarr;
            </button>
          </div>

          <div className="my-auto py-4">
            <HealthGauge health={health} size={250} />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-slate-100 text-xs">
            <div className="p-2 rounded bg-slate-50">
              <span className="text-[10px] text-slate-400 block font-medium">Degradation Rate</span>
              <span className="font-mono font-bold text-slate-700">-{prognostics.degradation_rate_per_day}/day</span>
            </div>
            <div className="p-2 rounded bg-slate-50">
              <span className="text-[10px] text-slate-400 block font-medium">Filter Age</span>
              <span className="font-mono font-bold text-slate-700">{reading.filter_age_days.toFixed(0)} Days</span>
            </div>
            <div className="p-2 rounded bg-slate-50">
              <span className="text-[10px] text-slate-400 block font-medium">Failure Risk</span>
              <span className={`font-semibold ${prognostics.failure_risk === 'Low Risk' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {prognostics.failure_risk.split(' ')[0]}
              </span>
            </div>
          </div>
        </div>

        {/* Section B: Water Quality Monitoring Cards */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Water Quality & Purification Efficiency</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time physicochemical sensor feed</p>
            </div>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
              Rejection: {rejectionRate.toFixed(1)}%
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Input TDS</span>
              <div className="mt-1 flex items-baseline space-x-1 font-mono">
                <span className="text-2xl font-bold text-slate-800">{reading.input_tds.toFixed(0)}</span>
                <span className="text-xs text-slate-500">ppm</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">Raw municipal feed</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-teal-50/40">
              <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">Output TDS</span>
              <div className="mt-1 flex items-baseline space-x-1 font-mono">
                <span className="text-2xl font-bold text-teal-800">{reading.output_tds.toFixed(0)}</span>
                <span className="text-xs text-teal-600">ppm</span>
              </div>
              <span className="text-[10px] text-teal-700 block mt-1 font-medium">Permeate target: &lt;100</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Turbidity</span>
              <div className="mt-1 flex items-baseline space-x-1 font-mono">
                <span className="text-2xl font-bold text-slate-800">{reading.turbidity.toFixed(2)}</span>
                <span className="text-xs text-slate-500">NTU</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">Limit: &lt;1.00 NTU</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recovery Ratio</span>
              <div className="mt-1 flex items-baseline space-x-1 font-mono">
                <span className="text-2xl font-bold text-slate-800">{recoveryRatio.toFixed(0)}</span>
                <span className="text-xs text-slate-500">%</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">Water recovery</span>
            </div>
          </div>

          {/* Quick TDS Differential Bar */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-2">
              <span>Membrane Desalination Separation</span>
              <span className="font-mono text-teal-700">
                {(reading.input_tds - reading.output_tds).toFixed(0)} ppm TDS removed
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
              <div
                className="bg-teal-600 h-full transition-all duration-500"
                style={{ width: `${rejectionRate}%` }}
                title={`Rejection: ${rejectionRate.toFixed(1)}%`}
              ></div>
              <div
                className="bg-amber-400 h-full transition-all duration-500"
                style={{ width: `${100 - rejectionRate}%` }}
                title="Solute bypass"
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1.5">
              <span>0% (Passage)</span>
              <span>Rejection: {rejectionRate.toFixed(1)}%</span>
              <span>100% (Absolute Barrier)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Performance Trends (Flow Rate & Output TDS over time) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Flow Rate & Pressure Drop Over Time */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Flow Rate & Pressure Dynamics</h3>
              <p className="text-xs text-slate-500">Hydraulic resistance trend over simulated days</p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-medium">
              <span className="flex items-center space-x-1 text-teal-600">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block"></span>
                <span>Flow (L/min)</span>
              </span>
              <span className="flex items-center space-x-1 text-indigo-500">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
                <span>ΔP (bar)</span>
              </span>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 2.5]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="flow_rate"
                  name="Flow Rate (L/min)"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#0d9488' }}
                />
                <Line
                  type="monotone"
                  dataKey="pressure_drop"
                  name="Pressure Drop (bar)"
                  stroke="#6366f1"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Output TDS and Health Score Degradation */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Output TDS & Health Degradation Trajectory</h3>
              <p className="text-xs text-slate-500">Longitudinal salt rejection vs composite health</p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-medium">
              <span className="flex items-center space-x-1 text-cyan-600">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 inline-block"></span>
                <span>Output TDS (ppm)</span>
              </span>
              <span className="flex items-center space-x-1 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
                <span>Health Index</span>
              </span>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 15, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="health"
                  name="Health Score"
                  stroke="#0d9488"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorHealth)"
                />
                <Line
                  type="monotone"
                  dataKey="output_tds"
                  name="Output TDS (ppm)"
                  stroke="#0891b2"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: Recent Alerts & Diagnostic Recommendations */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-sm">Recent Active Alerts & Actionable Insights</h3>
          </div>
          <button
            onClick={() => onNavigateTab('maintenance')}
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
          >
            Manage All Alerts &rarr;
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {prognostics.recommendations.map((rec, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/40 flex flex-col justify-between"
            >
              <div className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  !
                </span>
                <div>
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                    Diagnostic Finding #{i + 1}
                  </span>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">{rec}</p>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-amber-200/50 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Trigger: Real-time Telemetry</span>
                <span className="text-amber-700 font-semibold">Priority Action</span>
              </div>
            </div>
          ))}

          {prognostics.recommendations.length === 0 && (
            <div className="col-span-3 p-6 text-center text-slate-500 bg-slate-50 rounded-xl">
              <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No active critical alerts detected.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">All operating indices are within standard bounds.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

