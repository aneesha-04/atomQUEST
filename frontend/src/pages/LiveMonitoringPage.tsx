import React, { useState } from 'react';
import {
  SensorReading,
  HealthScore,
  SystemStatus,
} from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Radio,
  Cpu,
  Info,
  RefreshCw,
} from 'lucide-react';

interface LiveMonitoringPageProps {
  reading: SensorReading;
  health: HealthScore;
  status: SystemStatus | null;
  isRunning: boolean;
  onTogglePlay: () => void;
  onStep: () => void;
  onReset: () => void;
  onUpdateManualReading: (partial: Partial<SensorReading>) => void;
}

export const LiveMonitoringPage: React.FC<LiveMonitoringPageProps> = ({
  reading,
  health,
  status,
  isRunning,
  onTogglePlay,
  onStep,
  onReset,
  onUpdateManualReading,
}) => {
  // Local state for interactive sliders/inputs
  const [inputTds, setInputTds] = useState(reading.input_tds);
  const [outputTds, setOutputTds] = useState(reading.output_tds);
  const [turbidity, setTurbidity] = useState(reading.turbidity);
  const [flowRate, setFlowRate] = useState(reading.flow_rate);
  const [pressureDrop, setPressureDrop] = useState(reading.pressure_drop);
  const [cumulativeWater, setCumulativeWater] = useState(reading.cumulative_water);
  const [filterAge, setFilterAge] = useState(reading.filter_age_days);
  const [dailyCons, setDailyCons] = useState(reading.daily_consumption);

  // Sync state if external changes happen
  React.useEffect(() => {
    setInputTds(reading.input_tds);
    setOutputTds(reading.output_tds);
    setTurbidity(reading.turbidity);
    setFlowRate(reading.flow_rate);
    setPressureDrop(reading.pressure_drop);
    setCumulativeWater(reading.cumulative_water);
    setFilterAge(reading.filter_age_days);
    setDailyCons(reading.daily_consumption);
  }, [reading]);

  const handleApplySliders = () => {
    onUpdateManualReading({
      input_tds: Number(inputTds),
      output_tds: Number(outputTds),
      turbidity: Number(turbidity),
      flow_rate: Number(flowRate),
      pressure_drop: Number(pressureDrop),
      cumulative_water: Number(cumulativeWater),
      filter_age_days: Number(filterAge),
      daily_consumption: Number(dailyCons),
    });
  };

  // Sensor status helper
  const getSensorStatus = (
    key: string,
    val: number
  ): { label: 'Normal' | 'Warning' | 'Abnormal'; color: string; badge: string } => {
    switch (key) {
      case 'input_tds':
        if (val > 1000) return { label: 'Warning', color: 'text-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
        return { label: 'Normal', color: 'text-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'output_tds':
        if (val > 120) return { label: 'Abnormal', color: 'text-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200' };
        if (val > 80) return { label: 'Warning', color: 'text-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
        return { label: 'Normal', color: 'text-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'turbidity':
        if (val > 1.5) return { label: 'Abnormal', color: 'text-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200' };
        if (val > 0.8) return { label: 'Warning', color: 'text-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
        return { label: 'Normal', color: 'text-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'flow_rate':
        if (val < 0.8) return { label: 'Abnormal', color: 'text-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200' };
        if (val < 1.4) return { label: 'Warning', color: 'text-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
        return { label: 'Normal', color: 'text-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'pressure_drop':
        if (val > 1.2) return { label: 'Abnormal', color: 'text-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200' };
        if (val > 0.7) return { label: 'Warning', color: 'text-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
        return { label: 'Normal', color: 'text-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: 'Normal', color: 'text-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
  };

  const sensors = [
    {
      key: 'input_tds',
      label: 'Input Water TDS',
      value: reading.input_tds.toFixed(1),
      unit: 'ppm',
      nominal: '300 – 600 ppm',
      desc: 'Conductivity probe measuring raw feed dissolved salts.',
    },
    {
      key: 'output_tds',
      label: 'Output Water TDS',
      value: reading.output_tds.toFixed(1),
      unit: 'ppm',
      nominal: '< 100 ppm',
      desc: 'Post-RO & mineraliser permeate quality sensor.',
    },
    {
      key: 'turbidity',
      label: 'Permeate Turbidity',
      value: reading.turbidity.toFixed(2),
      unit: 'NTU',
      nominal: '< 1.00 NTU',
      desc: 'Optical nephelometric 90° light scattering sensor.',
    },
    {
      key: 'flow_rate',
      label: 'Purified Flow Rate',
      value: reading.flow_rate.toFixed(2),
      unit: 'L/min',
      nominal: '1.8 – 2.2 L/min',
      desc: 'Hall-effect turbine flow transducer on permeate line.',
    },
    {
      key: 'pressure_drop',
      label: 'Differential Pressure (ΔP)',
      value: reading.pressure_drop.toFixed(2),
      unit: 'bar',
      nominal: '0.25 – 0.50 bar',
      desc: 'Piezoresistive differential pressure across filter housing.',
    },
    {
      key: 'cumulative_water',
      label: 'Cumulative Water',
      value: reading.cumulative_water.toLocaleString(),
      unit: 'Litres',
      nominal: '< 6,000 L',
      desc: 'Integrated volume processed since filter commission.',
    },
    {
      key: 'filter_age_days',
      label: 'Filter Operating Age',
      value: reading.filter_age_days.toFixed(0),
      unit: 'Days',
      nominal: '< 365 Days',
      desc: 'Elapsed duration of current multi-stage cartridge set.',
    },
    {
      key: 'daily_consumption',
      label: 'Daily Consumption',
      value: reading.daily_consumption.toFixed(1),
      unit: 'L/day',
      nominal: '20 – 35 L/day',
      desc: 'Rolling 7-day average household water draw rate.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Simulation Notice Banner */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-3 text-amber-900">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold tracking-wide uppercase">Notice — Simulated Hardware Architecture:</span>{' '}
          All telemetry values shown below are generated in real-time by the internal computational model. No live physical sensors or serial ports are connected. Use the manual override sliders on the right to stress-test the model live!
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 8 Live Sensor Tiles */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Active Simulated Sensor Telemetry</h3>
              <p className="text-xs text-slate-500">Live multi-channel telemetry streams (Updated in real-time)</p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
              <Radio className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
              <span>8 Channels Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {sensors.map((sensor) => {
              const st = getSensorStatus(sensor.key, Number(sensor.value.replace(/,/g, '')));
              return (
                <div
                  key={sensor.key}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-card hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      {sensor.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${st.badge}`}>
                      {st.label}
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline space-x-1.5 font-mono">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {sensor.value}
                    </span>
                    <span className="text-xs font-medium text-slate-500">{sensor.unit}</span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{sensor.desc}</p>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Nominal: {sensor.nominal}</span>
                    <span className="text-teal-600 font-medium">SIMULATED</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Simulation Control & Interactive Parameter Sliders */}
        <div className="lg:col-span-4 space-y-5">
          {/* Simulation Control Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-teal-600" />
              <span>Simulation Engine Controller</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Control the time-series state generation engine.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={onTogglePlay}
                className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-bold shadow-xs transition-colors ${
                  isRunning
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                }`}
              >
                {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isRunning ? 'Pause Sim' : 'Start Sim'}</span>
              </button>

              <button
                onClick={onStep}
                className="flex items-center justify-center space-x-1.5 py-2.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs transition-colors"
              >
                <FastForward className="w-3.5 h-3.5 text-slate-500" />
                <span>Next Reading</span>
              </button>
            </div>

            <button
              onClick={onReset}
              className="w-full flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Baseline (Scenario 1)</span>
            </button>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Status:</span>
              <span className="font-semibold text-slate-800">
                {isRunning ? 'Running (1 tick / 3s)' : 'Paused'}
              </span>
            </div>
          </div>

          {/* Interactive Manual Override Sliders */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                <Sliders className="w-4 h-4 text-cyan-600" />
                <span>Manual Parameter Override</span>
              </h3>
              <button
                onClick={handleApplySliders}
                className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Apply</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Tweak parameters to trigger degradation and alerts.
            </p>

            <div className="space-y-3.5 text-xs">
              {/* Flow Rate Slider */}
              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Flow Rate</span>
                  <span className="font-mono font-bold text-teal-700">{flowRate} L/min</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="2.5"
                  step="0.05"
                  value={flowRate}
                  onChange={(e) => setFlowRate(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
              </div>

              {/* Output TDS Slider */}
              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Output TDS</span>
                  <span className="font-mono font-bold text-teal-700">{outputTds} ppm</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="250"
                  step="2"
                  value={outputTds}
                  onChange={(e) => setOutputTds(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
              </div>

              {/* Differential Pressure Slider */}
              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Pressure Drop (ΔP)</span>
                  <span className="font-mono font-bold text-teal-700">{pressureDrop} bar</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.2"
                  step="0.05"
                  value={pressureDrop}
                  onChange={(e) => setPressureDrop(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
              </div>

              {/* Turbidity Slider */}
              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Turbidity</span>
                  <span className="font-mono font-bold text-teal-700">{turbidity} NTU</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="4.0"
                  step="0.05"
                  value={turbidity}
                  onChange={(e) => setTurbidity(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
              </div>

              {/* Filter Operating Age Slider */}
              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Operating Age</span>
                  <span className="font-mono font-bold text-teal-700">{filterAge} Days</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="400"
                  step="5"
                  value={filterAge}
                  onChange={(e) => setFilterAge(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
              </div>

              {/* Cumulative Water Slider */}
              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Cumulative Water</span>
                  <span className="font-mono font-bold text-teal-700">{cumulativeWater} L</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="8000"
                  step="100"
                  value={cumulativeWater}
                  onChange={(e) => setCumulativeWater(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
              </div>
            </div>

            <button
              onClick={handleApplySliders}
              className="mt-4 w-full py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              Push Values to Telemetry Stream
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

