import React from 'react';
import { HealthScore } from '../types';
import { ShieldCheck, AlertCircle, AlertTriangle } from 'lucide-react';

interface HealthGaugeProps {
  health: HealthScore;
  size?: number;
}

export const HealthGauge: React.FC<HealthGaugeProps> = ({ health, size = 220 }) => {
  const score = health.score;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // Semi-circle arc (180 degrees)
  const circumference = Math.PI * radius;
  const progressOffset = circumference - (score / 100) * circumference;

  let color = '#0d9488'; // teal-600 (Healthy)
  let bgColor = 'text-teal-600 bg-teal-50 border-teal-200';
  let Icon = ShieldCheck;

  if (score < 45) {
    color = '#e11d48'; // rose-600 (Critical)
    bgColor = 'text-rose-700 bg-rose-50 border-rose-200';
    Icon = AlertCircle;
  } else if (score < 75) {
    color = '#d97706'; // amber-600 (Attention Required)
    bgColor = 'text-amber-700 bg-amber-50 border-amber-200';
    Icon = AlertTriangle;
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size * 0.65 }}>
        <svg
          width={size}
          height={size * 0.65}
          viewBox={`0 0 ${size} ${size * 0.65}`}
          className="overflow-visible"
        >
          {/* Background Arc */}
          <path
            d={`M ${strokeWidth / 2} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${center}`}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
          />
          {/* Foreground Progress Arc */}
          <path
            d={`M ${strokeWidth / 2} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${center}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            strokeLinecap="butt"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Value Overlay */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/4 text-center">
          <div className="text-4xl font-extrabold tracking-tight text-slate-900 font-mono">
            {score.toFixed(0)}
            <span className="text-xl text-slate-400 font-sans font-normal ml-0.5">/100</span>
          </div>
          <div className="mt-1 flex items-center justify-center space-x-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${bgColor}`}>
              <Icon className="w-3 h-3 mr-1" />
              {health.status}
            </span>
          </div>
        </div>
      </div>

      {/* Explanatory text */}
      <p className="mt-3 text-xs text-center text-slate-600 max-w-xs font-medium leading-relaxed">
        {health.explanation}
      </p>

      {/* Threshold markings */}
      <div className="w-full flex justify-between text-[11px] text-slate-400 font-mono px-4 mt-2 border-t border-slate-100 pt-2">
        <span>0 (Failed)</span>
        <span className="text-amber-600 font-medium">40 (Maint Threshold)</span>
        <span>100 (Optimal)</span>
      </div>
    </div>
  );
};

