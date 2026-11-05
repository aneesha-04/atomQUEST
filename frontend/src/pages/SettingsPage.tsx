import React, { useState } from 'react';
import { SystemSettings } from '../types';
import {
  Settings,
  Sliders,
  RotateCcw,
  Save,
  CheckCircle,
  Database,
  AlertTriangle,
  Info,
  Shield,
} from 'lucide-react';

interface SettingsPageProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  onResetDatabase: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  onResetDatabase,
}) => {
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleChange = (key: keyof SystemSettings, val: number) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
    setSavedSuccess(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Calculate sum of weights
  const totalWeight =
    formData.weight_age +
    formData.weight_water +
    formData.weight_flow +
    formData.weight_pressure +
    formData.weight_tds +
    formData.weight_turbidity;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-card flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-bold text-slate-900">System Calibration & Engine Configuration</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Calibrate algorithmic weights, maintenance boundaries, and simulation acceleration.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Settings Saved Successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Health Degradation Weights */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Filter Health Parameter Weights</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Proportion of degradation score assigned to each telemetry channel (Target sum: 1.00 / 100%)
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">Weight Sum:</span>
              <span
                className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                  Math.abs(totalWeight - 1.0) < 0.01
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {(totalWeight * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
            <div>
              <label className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Filter Operating Age</span>
                <span className="font-mono text-teal-700">{(formData.weight_age * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0.05"
                max="0.50"
                step="0.05"
                value={formData.weight_age}
                onChange={(e) => handleChange('weight_age', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <span className="text-[10px] text-slate-400">Baseline assumption: 20%</span>
            </div>

            <div>
              <label className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Cumulative Water Volume</span>
                <span className="font-mono text-teal-700">{(formData.weight_water * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0.05"
                max="0.50"
                step="0.05"
                value={formData.weight_water}
                onChange={(e) => handleChange('weight_water', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <span className="text-[10px] text-slate-400">Baseline assumption: 25%</span>
            </div>

            <div>
              <label className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Flow Reduction (Membrane flux)</span>
                <span className="font-mono text-teal-700">{(formData.weight_flow * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0.05"
                max="0.50"
                step="0.05"
                value={formData.weight_flow}
                onChange={(e) => handleChange('weight_flow', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <span className="text-[10px] text-slate-400">Baseline assumption: 25%</span>
            </div>

            <div>
              <label className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Pressure Drop (ΔP clogging)</span>
                <span className="font-mono text-teal-700">{(formData.weight_pressure * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0.05"
                max="0.40"
                step="0.05"
                value={formData.weight_pressure}
                onChange={(e) => handleChange('weight_pressure', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <span className="text-[10px] text-slate-400">Baseline assumption: 15%</span>
            </div>

            <div>
              <label className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>TDS Passage Proxy</span>
                <span className="font-mono text-teal-700">{(formData.weight_tds * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0.05"
                max="0.30"
                step="0.05"
                value={formData.weight_tds}
                onChange={(e) => handleChange('weight_tds', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <span className="text-[10px] text-slate-400">Baseline assumption: 10%</span>
            </div>

            <div>
              <label className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Turbidity Influx</span>
                <span className="font-mono text-teal-700">{(formData.weight_turbidity * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0.01"
                max="0.20"
                step="0.01"
                value={formData.weight_turbidity}
                onChange={(e) => handleChange('weight_turbidity', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <span className="text-[10px] text-slate-400">Baseline assumption: 5%</span>
            </div>
          </div>
        </div>

        {/* Section 2: Baselines & Thresholds */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card">
          <h3 className="font-bold text-slate-900 text-base pb-3 border-b border-slate-100 mb-4">
            Hydraulic Baselines & Critical Intervention Thresholds
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Clean Baseline Flow Rate (L/min)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.baseline_flow_rate}
                onChange={(e) => handleChange('baseline_flow_rate', parseFloat(e.target.value))}
                className="w-full p-2 rounded-lg border border-slate-300 font-mono"
              />
              <span className="text-[10px] text-slate-400">Standard clean filter: 2.0 L/min</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Clean Differential Pressure (bar)
              </label>
              <input
                type="number"
                step="0.05"
                value={formData.baseline_pressure_drop}
                onChange={(e) => handleChange('baseline_pressure_drop', parseFloat(e.target.value))}
                className="w-full p-2 rounded-lg border border-slate-300 font-mono"
              />
              <span className="text-[10px] text-slate-400">Standard clean baseline: 0.30 bar</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Maintenance Health Threshold
              </label>
              <input
                type="number"
                step="1"
                value={formData.maintenance_threshold}
                onChange={(e) => handleChange('maintenance_threshold', parseFloat(e.target.value))}
                className="w-full p-2 rounded-lg border border-slate-300 font-mono"
              />
              <span className="text-[10px] text-slate-400">Triggers RUL replacement: 40 pts</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Max Acceptable Output TDS (ppm)
              </label>
              <input
                type="number"
                step="5"
                value={formData.max_acceptable_output_tds}
                onChange={(e) => handleChange('max_acceptable_output_tds', parseFloat(e.target.value))}
                className="w-full p-2 rounded-lg border border-slate-300 font-mono"
              />
              <span className="text-[10px] text-slate-400">Salt passage limit: 100 ppm</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Max Rated Volume (Litres)
              </label>
              <input
                type="number"
                step="500"
                value={formData.max_rated_volume}
                onChange={(e) => handleChange('max_rated_volume', parseFloat(e.target.value))}
                className="w-full p-2 rounded-lg border border-slate-300 font-mono"
              />
              <span className="text-[10px] text-slate-400">Rated cartridge life: 6,000 L</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Max Rated Operating Days
              </label>
              <input
                type="number"
                step="15"
                value={formData.max_rated_days}
                onChange={(e) => handleChange('max_rated_days', parseFloat(e.target.value))}
                className="w-full p-2 rounded-lg border border-slate-300 font-mono"
              />
              <span className="text-[10px] text-slate-400">1 calendar year: 365 days</span>
            </div>
          </div>
        </div>

        {/* Section 3: Simulation Parameters & Controls */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card">
          <h3 className="font-bold text-slate-900 text-base pb-3 border-b border-slate-100 mb-4">
            Simulation Speed & Degradation Time Multiplier
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Accelerated Aging Multiplier</span>
                <span className="font-mono text-teal-700">{formData.auto_degradation_speed}x</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.5"
                value={formData.auto_degradation_speed}
                onChange={(e) => handleChange('auto_degradation_speed', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <span className="text-[10px] text-slate-400">Accelerates aging rate during live simulation</span>
            </div>

            <div>
              <label className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Simulation Tick Interval</span>
                <span className="font-mono text-teal-700">{formData.simulation_interval_sec}s</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={formData.simulation_interval_sec}
                onChange={(e) => handleChange('simulation_interval_sec', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <span className="text-[10px] text-slate-400">Seconds between automated telemetry frames</span>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-slate-400" />
            <span>Updated values are applied immediately to all subsequent health calculations.</span>
          </div>

          <button
            type="submit"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>

      {/* Database Reset & Sample Data Recovery */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card">
        <h3 className="font-bold text-slate-900 text-base mb-1 flex items-center space-x-2 text-slate-800">
          <Database className="w-4 h-4 text-slate-600" />
          <span>Telemetry Database & Sample Data State</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Reset all recorded simulated readings and restore pristine 30-day baseline sample data for competition demonstration.
        </p>

        {resetConfirm ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-rose-900 font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Confirm database reseed? All custom telemetry will be restored to factory default.</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setResetConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onResetDatabase();
                  setResetConfirm(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Yes, Reset Database
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setResetConfirm(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Database to Default Baseline</span>
          </button>
        )}
      </div>
    </div>
  );
};

