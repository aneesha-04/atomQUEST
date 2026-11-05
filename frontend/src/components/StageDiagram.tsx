import React, { useState } from 'react';
import { FilterStage } from '../types';
import {
  ChevronRight,
  Filter,
  Layers,
  Activity,
  Zap,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Clock,
  Info,
} from 'lucide-react';

interface StageDiagramProps {
  stages: FilterStage[];
}

export const StageDiagram: React.FC<StageDiagramProps> = ({ stages }) => {
  const [selectedStageId, setSelectedStageId] = useState<string>(stages[3]?.id || stages[0]?.id);

  const selectedStage = stages.find((s) => s.id === selectedStageId) || stages[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Healthy':
        return {
          pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          bar: 'bg-emerald-500',
          card: 'border-slate-200 hover:border-emerald-300',
        };
      case 'Attention Required':
        return {
          pill: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          bar: 'bg-amber-500',
          card: 'border-slate-200 hover:border-amber-300',
        };
      default:
        return {
          pill: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          bar: 'bg-rose-500',
          card: 'border-slate-200 hover:border-rose-300',
        };
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-900 text-base">Multi-Stage Filtration Flow Pipeline</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive stage-wise hydraulic pathway. Click any module to inspect operational symptoms.
          </p>
        </div>
        <div className="text-[11px] text-slate-400 font-medium italic flex items-center space-x-1">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Conceptual R&D stage allocation — Single-node proxy telemetry</span>
        </div>
      </div>

      {/* Stage Cards Horizontal Scroll / Pipeline */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-3 pt-1">
        {stages.map((stg, index) => {
          const colors = getStatusColor(stg.status);
          const isSelected = stg.id === selectedStageId;
          return (
            <React.Fragment key={stg.id}>
              <button
                onClick={() => setSelectedStageId(stg.id)}
                className={`flex-1 min-w-[135px] text-left p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/20 shadow-sm'
                    : `bg-slate-50/60 hover:bg-white ${colors.card}`
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Stage {stg.stage_number}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${colors.dot}`}></span>
                </div>
                <div className="font-bold text-xs text-slate-800 line-clamp-1 mb-1">
                  {stg.name.split('(')[0]}
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="font-mono text-sm font-extrabold text-slate-900">
                    {stg.health_score.toFixed(0)}%
                  </span>
                  <span className="text-[10px] text-slate-400">{stg.estimated_usage_percent.toFixed(0)}% used</span>
                </div>
                {/* Mini health bar */}
                <div className="w-full bg-slate-200/80 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                    style={{ width: `${stg.health_score}%` }}
                  ></div>
                </div>
              </button>

              {index < stages.length - 1 && (
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Selected Stage Detail Panel */}
      {selectedStage && (
        <div className="mt-5 p-5 rounded-xl bg-slate-50/80 border border-slate-200 animate-in fade-in duration-200">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-teal-100 text-teal-800">
                  Stage {selectedStage.stage_number}
                </span>
                <h4 className="font-bold text-slate-900 text-base">{selectedStage.name}</h4>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    getStatusColor(selectedStage.status).pill
                  }`}
                >
                  {selectedStage.status}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                <span className="font-semibold text-slate-700">Technology:</span> {selectedStage.technology}
              </p>
            </div>

            <div className="flex items-center space-x-4 text-xs font-medium text-slate-500">
              <div>
                <span className="text-slate-400">Typical Lifespan:</span>{' '}
                <span className="font-semibold text-slate-700">{selectedStage.typical_lifespan_days} Days</span>
              </div>
              <div>
                <span className="text-slate-400">Last Serviced:</span>{' '}
                <span className="font-semibold text-slate-700">{selectedStage.last_service_date}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200/80">
            {/* Live Performance Indicator */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-teal-600" />
                <span>Live Performance Proxy</span>
              </div>
              <p className="text-xs font-semibold text-slate-800 mt-1 font-mono">
                {selectedStage.performance_indicator}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(selectedStage.current_metrics).map(([k, v]) => (
                  <span
                    key={k}
                    className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-mono text-[11px]"
                  >
                    <span className="text-slate-400">{k}:</span> {v}
                  </span>
                ))}
              </div>
            </div>

            {/* Failure Symptoms */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Potential Failure Symptoms & Triggers</span>
              </div>
              <ul className="space-y-1 text-xs text-slate-600 list-disc list-inside">
                {selectedStage.failure_symptoms.map((symptom, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {symptom}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

