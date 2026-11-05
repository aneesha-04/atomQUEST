import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import {
  SensorReading,
  HealthScore,
  PrognosticsResult,
  FilterStage,
  MaintenanceEvent,
  SystemSettings,
  SystemStatus,
} from './types';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { SafetyModal } from './components/SafetyModal';
import { OverviewPage } from './pages/OverviewPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { FilterHealthPage } from './pages/FilterHealthPage';
import { PredictiveAnalyticsPage } from './pages/PredictiveAnalyticsPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { defaultSettings } from './services/clientEngine';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);

  // Core telemetry & state
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [reading, setReading] = useState<SensorReading | null>(null);
  const [health, setHealth] = useState<HealthScore | null>(null);
  const [prognostics, setPrognostics] = useState<PrognosticsResult | null>(null);
  const [history, setHistory] = useState<SensorReading[]>([]);
  const [stages, setStages] = useState<FilterStage[]>([]);
  const [maintenanceEvents, setMaintenanceEvents] = useState<MaintenanceEvent[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [isRunning, setIsRunning] = useState(false);
  const [activeScenarioName, setActiveScenarioName] = useState('Scenario 1: Healthy Purifier');
  const [sensorIssues, setSensorIssues] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial telemetry
  const refreshTelemetry = useCallback(async () => {
    try {
      const [sysStatus, cur, hist, stgs, maint, setts] = await Promise.all([
        api.getSystemStatus(),
        api.getCurrentReading(),
        api.getHistory(50),
        api.getStages(),
        api.getMaintenance(),
        api.getSettings(),
      ]);

      setStatus(sysStatus);
      setReading(cur.reading);
      setHealth(cur.health);
      setPrognostics(cur.prognostics);
      setSensorIssues(cur.sensor_issues || []);
      setHistory(hist);
      setStages(stgs);
      setMaintenanceEvents(maint);
      setSettings(setts);
      setIsRunning(sysStatus.is_running);
      setActiveScenarioName(sysStatus.simulation_mode);
    } catch (err) {
      console.error('Failed to fetch telemetry:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTelemetry();
  }, [refreshTelemetry]);

  // Interval loop when simulation is running (step every 3 seconds)
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(async () => {
      try {
        const nextState = await api.stepSimulation();
        setReading(nextState.reading);
        setHealth(nextState.health);
        setPrognostics(nextState.prognostics);
        setSensorIssues(nextState.sensor_issues || []);
        // update history
        setHistory((prev) => [...prev.slice(-49), nextState.reading]);
        // refresh stages
        const updatedStages = await api.getStages();
        setStages(updatedStages);
      } catch (err) {
        console.error('Simulation step error:', err);
      }
    }, settings.simulation_interval_sec * 1000);

    return () => clearInterval(interval);
  }, [isRunning, settings.simulation_interval_sec]);

  // Handlers
  const handleTogglePlay = async () => {
    if (isRunning) {
      await api.pauseSimulation();
      setIsRunning(false);
    } else {
      await api.startSimulation();
      setIsRunning(true);
    }
    const s = await api.getSystemStatus();
    setStatus(s);
  };

  const handleStep = async () => {
    const nextState = await api.stepSimulation();
    setReading(nextState.reading);
    setHealth(nextState.health);
    setPrognostics(nextState.prognostics);
    setSensorIssues(nextState.sensor_issues || []);
    setHistory((prev) => [...prev.slice(-49), nextState.reading]);
    const updatedStages = await api.getStages();
    setStages(updatedStages);
    const s = await api.getSystemStatus();
    setStatus(s);
  };

  const handleReset = async () => {
    await api.resetSimulation();
    await refreshTelemetry();
  };

  const handleSelectScenario = async (id: number) => {
    const res = await api.loadScenario(id);
    setReading(res.reading);
    setHealth(res.health);
    setPrognostics(res.prognostics);
    setActiveScenarioName(res.scenario || `Scenario ${id}`);
    const updatedStages = await api.getStages();
    setStages(updatedStages);
    const hist = await api.getHistory(50);
    setHistory(hist);
    const s = await api.getSystemStatus();
    setStatus(s);
  };

  const handleUpdateManualReading = async (partial: Partial<SensorReading>) => {
    const res = await api.updateManualReading(partial);
    setReading(res.reading);
    setHealth(res.health);
    if (res.prognostics) setPrognostics(res.prognostics);
    setSensorIssues(res.sensor_issues || []);
    const updatedStages = await api.getStages();
    setStages(updatedStages);
  };

  const handleAddMaintenanceEvent = async (event: any) => {
    await api.addMaintenance(event);
    const updated = await api.getMaintenance();
    setMaintenanceEvents(updated);
  };

  const handleUpdateMaintenanceStatus = async (
    id: number,
    stat: 'Pending' | 'In Progress' | 'Completed',
    notes?: string
  ) => {
    await api.updateMaintenanceStatus(id, stat, notes);
    const updated = await api.getMaintenance();
    setMaintenanceEvents(updated);
  };

  const handleUpdateSettings = async (newSettings: SystemSettings) => {
    await api.updateSettings(newSettings);
    setSettings(newSettings);
    await refreshTelemetry();
  };

  const handleResetDatabase = async () => {
    await api.resetDatabase();
    await refreshTelemetry();
  };

  // Header Titles by Tab
  const getTabHeader = () => {
    switch (currentTab) {
      case 'overview':
        return {
          title: 'Purifier Overview',
          subtitle: 'Monitor water quality, filter performance, and predictive maintenance.',
        };
      case 'monitoring':
        return {
          title: 'Live Telemetry & Sensor Dynamics',
          subtitle: 'Real-time multi-stage sensor stream with interactive hardware simulator.',
        };
      case 'health':
        return {
          title: 'Filter Health Decomposition',
          subtitle: 'Transparent multi-parameter calculation breakdown & hydraulic stage status.',
        };
      case 'predictive':
        return {
          title: 'Predictive Prognostics & RUL',
          subtitle: 'Remaining Useful Life estimation, failure horizons, and prescriptive actions.',
        };
      case 'maintenance':
        return {
          title: 'Maintenance Center & Work Orders',
          subtitle: 'Interactive service checklist, proactive condition alerts, and overhaul records.',
        };
      case 'reports':
        return {
          title: 'Analytics & Audit Reports',
          subtitle: 'Export audit-ready CSV telemetry and formal engineering PDF dossiers.',
        };
      case 'settings':
        return {
          title: 'System Settings & Calibration',
          subtitle: 'Adjust model weights, baseline thresholds, and simulation acceleration parameters.',
        };
    }
  };

  if (loading || !reading || !health || !prognostics) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white font-['Plus_Jakarta_Sans']">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500 animate-spin mx-auto flex items-center justify-center">
            <div className="w-6 h-6 bg-slate-900 rounded-md"></div>
          </div>
          <h2 className="text-lg font-bold">AquaSense Telemetry Engine Initializing...</h2>
          <p className="text-xs text-slate-400">Loading simulated sensor channels & predictive algorithms</p>
        </div>
      </div>
    );
  }

  const { title, subtitle } = getTabHeader();
  const alertCount = maintenanceEvents.filter((e) => e.status !== 'Completed').length;

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 overflow-hidden font-['Plus_Jakarta_Sans']">
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        status={status}
        onOpenSafety={() => setIsSafetyOpen(true)}
        alertCount={alertCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          title={title}
          subtitle={subtitle}
          status={status}
          isRunning={isRunning}
          onTogglePlay={handleTogglePlay}
          onStep={handleStep}
          onReset={handleReset}
          onSelectScenario={handleSelectScenario}
          activeScenarioName={activeScenarioName}
        />

        {/* Tab View Container */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'overview' && (
              <OverviewPage
                reading={reading}
                health={health}
                prognostics={prognostics}
                history={history}
                maintenanceEvents={maintenanceEvents}
                onNavigateTab={setCurrentTab}
              />
            )}

            {currentTab === 'monitoring' && (
              <LiveMonitoringPage
                reading={reading}
                health={health}
                status={status}
                isRunning={isRunning}
                onTogglePlay={handleTogglePlay}
                onStep={handleStep}
                onReset={handleReset}
                onUpdateManualReading={handleUpdateManualReading}
              />
            )}

            {currentTab === 'health' && (
              <FilterHealthPage
                reading={reading}
                health={health}
                stages={stages}
                settings={settings}
              />
            )}

            {currentTab === 'predictive' && (
              <PredictiveAnalyticsPage
                reading={reading}
                health={health}
                prognostics={prognostics}
                history={history}
                settings={settings}
              />
            )}

            {currentTab === 'maintenance' && (
              <MaintenancePage
                reading={reading}
                health={health}
                prognostics={prognostics}
                events={maintenanceEvents}
                onAddEvent={handleAddMaintenanceEvent}
                onUpdateEventStatus={handleUpdateMaintenanceStatus}
              />
            )}

            {currentTab === 'reports' && (
              <ReportsPage
                reading={reading}
                health={health}
                prognostics={prognostics}
                history={history}
                maintenanceEvents={maintenanceEvents}
                settings={settings}
                exportCsvUrl={api.getExportCsvUrl()}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsPage
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onResetDatabase={handleResetDatabase}
              />
            )}
          </div>
        </main>
      </div>

      {/* Dedicated Safety & Limitations Modal */}
      <SafetyModal
        isOpen={isSafetyOpen}
        onClose={() => setIsSafetyOpen(false)}
        sensorIssues={sensorIssues}
      />
    </div>
  );
};

export default App;

