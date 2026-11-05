import React from 'react';
import {
  Activity,
  BarChart3,
  Cpu,
  FileText,
  HeartPulse,
  Home,
  Settings,
  ShieldAlert,
  Wrench,
  Droplets,
  Radio,
  UserCheck,
} from 'lucide-react';
import { SystemStatus } from '../types';

export type NavTab =
  | 'overview'
  | 'monitoring'
  | 'health'
  | 'predictive'
  | 'maintenance'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  status: SystemStatus | null;
  onOpenSafety: () => void;
  alertCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  status,
  onOpenSafety,
  alertCount,
}) => {
  const navItems = [
    { id: 'overview' as NavTab, label: 'Overview', icon: Home },
    { id: 'monitoring' as NavTab, label: 'Live Monitoring', icon: Radio },
    { id: 'health' as NavTab, label: 'Filter Health', icon: HeartPulse },
    { id: 'predictive' as NavTab, label: 'Predictive Analytics', icon: Cpu },
    {
      id: 'maintenance' as NavTab,
      label: 'Maintenance Center',
      icon: Wrench,
      badge: alertCount > 0 ? alertCount : undefined,
    },
    { id: 'reports' as NavTab, label: 'Reports', icon: FileText },
    { id: 'settings' as NavTab, label: 'System Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-lg tracking-tight text-white font-['Plus_Jakarta_Sans']">
                AquaSense
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-400 border border-teal-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-wide font-medium">
              Predict. Monitor. Maintain.
            </p>
          </div>
        </div>
      </div>

      {/* Device Status Bar */}
      <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800/80 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium">Purifier Node</span>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono text-emerald-400 text-[11px] font-medium">Online</span>
          </div>
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-mono">ATMB-RO-001</span>
          <span className="text-teal-400 font-medium truncate max-w-[110px]" title={status?.simulation_mode}>
            {status?.simulation_mode?.split(':')[0] || 'Simulated'}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Main Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-teal-600/15 text-teal-300 font-semibold border-l-4 border-teal-400 pl-2'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Safety & Limitations Trigger */}
        <div className="pt-4 px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Compliance & Safety
        </div>
        <button
          onClick={onOpenSafety}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-amber-400/90 hover:bg-amber-950/30 transition-all border border-amber-500/20"
        >
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Safety & Limitations</span>
        </button>
      </nav>

      {/* Evaluator / User Profile */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-teal-900/60 border border-teal-500/30 flex items-center justify-center text-teal-300 font-semibold text-xs">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-200 truncate">Atomberg R&D Lead</div>
            <div className="text-[10px] text-slate-400 truncate">atomQUEST 2026 Jury</div>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
          <span>Simulation Engine</span>
          <span className="text-cyan-400 font-mono">v1.2 Active</span>
        </div>
      </div>
    </aside>
  );
};

