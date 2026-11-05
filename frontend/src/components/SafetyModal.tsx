import React from 'react';
import { X, ShieldAlert, CheckCircle, AlertTriangle, Cpu, Droplet, Sliders } from 'lucide-react';

interface SafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  sensorIssues?: string[];
}

export const SafetyModal: React.FC<SafetyModalProps> = ({ isOpen, onClose, sensorIssues = [] }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">System Safety, Ethics & Limitations</h3>
              <p className="text-xs text-slate-400">Atomberg atomQUEST 2026 Architectural Declaration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700">
          {/* Active Sensor Diagnostics */}
          {sensorIssues.length > 0 ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
              <div className="flex items-center space-x-2 font-bold text-amber-800 text-xs uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Active Sensor Telemetry Warnings Detected:</span>
              </div>
              <ul className="mt-2 list-disc list-inside space-y-1 text-xs">
                {sensorIssues.map((issue, idx) => (
                  <li key={idx} className="font-medium text-amber-800">
                    {issue}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-amber-700 italic">
                Prognostic outputs are automatically tempered with lower confidence flags when sensor out-of-bounds are detected.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center space-x-2.5 text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>All simulated sensor inputs currently satisfy boundary validity & physical monotonicity checks.</span>
            </div>
          )}

          {/* Detailed 7 Mandatory Disclaimers */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
              Operational Boundaries & Disclaimers:
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/70">
                <div className="font-semibold text-slate-900 flex items-center space-x-1.5 mb-1">
                  <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>Hardware Isolation</span>
                </div>
                <p className="text-slate-600">
                  This software is an autonomous data and analytics prototype. It is not connected to physical GPIO or live municipal water lines.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/70">
                <div className="font-semibold text-slate-900 flex items-center space-x-1.5 mb-1">
                  <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">2</span>
                  <span>Purely Simulated Data</span>
                </div>
                <p className="text-slate-600">
                  All metrics, flow rates, and TDS values are generated synthetically by the built-in mathematical physics engine.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/70">
                <div className="font-semibold text-slate-900 flex items-center space-x-1.5 mb-1">
                  <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">3</span>
                  <span>Potability Boundaries</span>
                </div>
                <p className="text-slate-600">
                  TDS and turbidity alone do not certify biological sterility or absence of dissolved heavy metals, nitrates, or microplastics.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/70">
                <div className="font-semibold text-slate-900 flex items-center space-x-1.5 mb-1">
                  <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">4</span>
                  <span>Illustrative Health Score</span>
                </div>
                <p className="text-slate-600">
                  The 0–100 Filter Health Score represents a multi-parameter degradation proxy model and is not a warranty of cartridge integrity.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/70">
                <div className="font-semibold text-slate-900 flex items-center space-x-1.5 mb-1">
                  <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">5</span>
                  <span>Real-World Calibration</span>
                </div>
                <p className="text-slate-600">
                  Production deployment requires calibrating prognostic weights against Atomberg endurance test benches and accelerated life test (ALT) rigs.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/70">
                <div className="font-semibold text-slate-900 flex items-center space-x-1.5 mb-1">
                  <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">6</span>
                  <span>Service Protocol</span>
                </div>
                <p className="text-slate-600">
                  Physical filter replacements and sanitisation flushing must adhere strictly to Atomberg factory maintenance manuals and certified parts.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-sky-100 bg-sky-50/60 text-xs">
              <div className="font-semibold text-sky-950 flex items-center space-x-1.5 mb-1">
                <span className="w-4 h-4 rounded-full bg-sky-200 flex items-center justify-center text-[10px] font-bold text-sky-900">7</span>
                <span>Passive Supervisory Architecture</span>
              </div>
              <p className="text-sky-900">
                This dashboard functions strictly as an advisory supervisory system. It intentionally exerts zero electrical control over solenoid valves, booster pumps, or germicidal UV ballast supplies.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">Doc ref: ATMB-QS-SAF-2026</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};

