import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { SystemStatus } from '../types';

interface HeaderProps {
  title: string;
  subtitle: string;
  status: SystemStatus | null;
  isRunning: boolean;
  onTogglePlay: () => void;
  onStep: () => void;
  onReset: () => void;
  onSelectScenario: (scenarioId: number) => void;
  activeScenarioName: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  status,
  isRunning,
  onTogglePlay,
  onStep,
  onReset,
  onSelectScenario,
  activeScenarioName,
}) => {
  return (
    <header className="bg-white border-b border-slate-200/80 shadow-subtle px-6 py-4">
      {/* Disclaimer Top Bar */}
      <div className="mb-3 px-3 py-1.5 rounded-md bg-sky-50 border border-sky-100 flex items-center justify-between text-xs text-sky-900">
        <div className="flex items-center space-x-2">
          <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span className="font-semibold tracking-wide text-sky-800">SIMULATED DATA PROTOTYPE</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-600">atomQUEST 2026 Innovation Challenge — Atomberg Technologies</span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] font-mono">
          <span className="text-slate-500 flex items-center space-x-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Telemetry: {status?.last_updated ? new Date(status.last_updated).toLocaleTimeString() : 'Live'}</span>
          </span>
          {status?.sensor_validity === 'Valid' ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Sensors Normal
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
              <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" /> Sensor Data Warning
            </span>
          )}
        </div>
      </div>

      {/* Main Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
            {title}
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        {/* Demo Scenarios & Simulation Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Scenario Selectors for Judges */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <span className="px-2 font-semibold text-slate-500 text-[11px] uppercase tracking-wider flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-teal-600 mr-1" /> Scenarios:
            </span>
            <button
              onClick={() => onSelectScenario(1)}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                activeScenarioName.includes('Healthy')
                  ? 'bg-white text-emerald-700 font-semibold shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Low age, healthy flow, nominal pressure"
            >
              1. Healthy
            </button>
            <button
              onClick={() => onSelectScenario(2)}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                activeScenarioName.includes('Degradation')
                  ? 'bg-white text-amber-700 font-semibold shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Gradual flow reduction, aging, pressure increase"
            >
              2. Degradation
            </button>
            <button
              onClick={() => onSelectScenario(3)}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                activeScenarioName.includes('Abnormal')
                  ? 'bg-white text-rose-700 font-semibold shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Unusually low flow, high turbidity, critical alerts"
            >
              3. Abnormal
            </button>
          </div>

          {/* Engine Controls */}
          <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-200">
            <button
              onClick={onTogglePlay}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
              title={isRunning ? 'Pause automatic real-time simulation' : 'Start automatic real-time simulation'}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isRunning ? 'Pause Sim' : 'Live Sim'}</span>
            </button>

            <button
              onClick={onStep}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs transition-all"
              title="Generate single simulated telemetry reading"
            >
              <FastForward className="w-3.5 h-3.5 text-slate-500" />
              <span>Step</span>
            </button>

            <button
              onClick={onReset}
              className="inline-flex items-center p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all"
              title="Reset simulation to healthy baseline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

