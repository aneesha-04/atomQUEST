import { clientEngine } from './clientEngine';
import {
  SensorReading,
  HealthScore,
  PrognosticsResult,
  FilterStage,
  MaintenanceEvent,
  SystemSettings,
  SystemStatus,
} from '../types';

const API_BASE = '/api';

let backendAvailable: boolean | null = null;

async function checkBackend(): Promise<boolean> {
  if (backendAvailable !== null) return backendAvailable;
  try {
    const res = await fetch(`${API_BASE}/status`, { signal: AbortSignal.timeout(1200) });
    backendAvailable = res.ok;
  } catch {
    backendAvailable = false;
  }
  return backendAvailable;
}

export const api = {
  async getSystemStatus(): Promise<SystemStatus> {
    if (await checkBackend()) {
      try {
        const res = await fetch(`${API_BASE}/status`);
        if (res.ok) return await res.json();
      } catch {
        backendAvailable = false;
      }
    }
    return clientEngine.getSystemStatus();
  },

  async getCurrentReading(): Promise<{
    reading: SensorReading;
    health: HealthScore;
    prognostics: PrognosticsResult;
    valid: boolean;
    sensor_issues: string[];
  }> {
    if (await checkBackend()) {
      try {
        const res = await fetch(`${API_BASE}/readings/current`);
        if (res.ok) return await res.json();
      } catch {
        backendAvailable = false;
      }
    }
    return clientEngine.getCurrentState();
  },

  async updateManualReading(partial: Partial<SensorReading>): Promise<any> {
    if (await checkBackend()) {
      try {
        const res = await fetch(`${API_BASE}/readings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(partial),
        });
        if (res.ok) return await res.json();
      } catch {
        backendAvailable = false;
      }
    }
    const reading = clientEngine.updateManualReading(partial);
    return clientEngine.getCurrentState();
  },

  async getHistory(limit: number = 50): Promise<SensorReading[]> {
    if (await checkBackend()) {
      try {
        const res = await fetch(`${API_BASE}/readings/history?limit=${limit}`);
        if (res.ok) return await res.json();
      } catch {
        backendAvailable = false;
      }
    }
    return clientEngine.getHistory(limit);
  },

  async loadScenario(scenarioId: number): Promise<any> {
    if (await checkBackend()) {
      try {
        const res = await fetch(`${API_BASE}/simulation/scenario/${scenarioId}`, {
          method: 'POST',
        });
        if (res.ok) return await res.json();
      } catch {
        backendAvailable = false;
      }
    }
    clientEngine.loadScenario(scenarioId);
    return clientEngine.getCurrentState();
  },

  async stepSimulation(): Promise<any> {
    if (await checkBackend()) {
      try {
        const res = await fetch(`${API_BASE}/simulation/step`, {
          method: 'POST',
        });
        if (res.ok) return await res.json();
      } catch {
        backendAvailable = false;
      }
    }
    clientEngine.step();
    return clientEngine.getCurrentState();
  },

  async startSimulation(): Promise<any> {
    clientEngine.isRunning = true;
    if (await checkBackend()) {
      try {
        await fetch(`${API_BASE}/simulation/start`, { method: 'POST' });
      } catch {
        backendAvailable = false;
      }
    }
    return { status: 'started', is_running: true };
  },

  async pauseSimulation(): Promise<any> {
    clientEngine.isRunning = false;
    if (await checkBackend()) {
      try {
        await fetch(`${API_BASE}/simulation/pause`, { method: 'POST' });
      } catch {
        backendAvailable = false;
      }
    }
    return { status: 'paused', is_running: false };
  },

  async resetSimulation(): Promise<any> {
    if (await checkBackend()) {
      try {
        await fetch(`${API_BASE}/simulation/reset`, { method: 'POST' });
      } catch {
        backendAvailable = false;
      }
    }
    clientEngine.loadScenario(1);
    return clientEngine.getCurrentState();
  },

  async getStages(): Promise<FilterStage[]> {
    if (await checkBackend()) {
      try {
        const res = await fetch(`${API_BASE}/stages`);
        if (res.ok) return await res.json();
      } catch {
        backendAvailable = false;
      }
    }
    return clientEngine.getStagesStatus();
  },

  async getMaintenance(): Promise<MaintenanceEvent[]> {
    if (await checkBackend()) {
      try {
        const res = await fetch(`${API_BASE}/maintenance`);
        if (res.ok) return await res.json();
      } catch {
        backendAvailable = false;
      }
    }
    return clientEngine.getMaintenance();
  },

  async addMaintenance(event: {
    stage_id: string;
    stage_name: string;
    title: string;
    description: string;
    priority: string;
    technician_notes: string;
  }): Promise<any> {
    if (await checkBackend()) {
      try {
        const res = await fetch(`${API_BASE}/maintenance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });
        if (res.ok) return await res.json();
      } catch {
        backendAvailable = false;
      }
    }
    return clientEngine.addMaintenance(event as any);
  },

  async updateMaintenanceStatus(
    id: number,
    status: 'Pending' | 'In Progress' | 'Completed',
    notes?: string
  ): Promise<any> {
    if (await checkBackend()) {
      try {
        const res = await fetch(`${API_BASE}/maintenance/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, technician_notes: notes }),
        });
        if (res.ok) return await res.json();
      } catch {
        backendAvailable = false;
      }
    }
    clientEngine.updateMaintenanceStatus(id, status, notes);
    return { id, status };
  },

  async getSettings(): Promise<SystemSettings> {
    if (await checkBackend()) {
      try {
        const res = await fetch(`${API_BASE}/settings`);
        if (res.ok) return await res.json();
      } catch {
        backendAvailable = false;
      }
    }
    return clientEngine.getSettings();
  },

  async updateSettings(settings: SystemSettings): Promise<any> {
    if (await checkBackend()) {
      try {
        const res = await fetch(`${API_BASE}/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        });
        if (res.ok) return await res.json();
      } catch {
        backendAvailable = false;
      }
    }
    clientEngine.updateSettings(settings);
    return { status: 'updated', settings };
  },

  async resetDatabase(): Promise<any> {
    if (await checkBackend()) {
      try {
        await fetch(`${API_BASE}/database/reset`, { method: 'POST' });
      } catch {
        backendAvailable = false;
      }
    }
    clientEngine.resetDatabase();
    return { status: 'reset' };
  },

  getExportCsvUrl(): string {
    return `${API_BASE}/export/csv`;
  },
};

