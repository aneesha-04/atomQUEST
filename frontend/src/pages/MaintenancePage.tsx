import React, { useState } from 'react';
import {
  MaintenanceEvent,
  SensorReading,
  HealthScore,
  PrognosticsResult,
} from '../types';
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  FileCheck,
  Calendar,
  Layers,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface MaintenancePageProps {
  reading: SensorReading;
  health: HealthScore;
  prognostics: PrognosticsResult;
  events: MaintenanceEvent[];
  onAddEvent: (event: {
    stage_id: string;
    stage_name: string;
    title: string;
    description: string;
    priority: string;
    technician_notes: string;
  }) => void;
  onUpdateEventStatus: (
    id: number,
    status: 'Pending' | 'In Progress' | 'Completed',
    notes?: string
  ) => void;
}

export const MaintenancePage: React.FC<MaintenancePageProps> = ({
  reading,
  health,
  prognostics,
  events,
  onAddEvent,
  onUpdateEventStatus,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'completed'>('all');

  // Form state
  const [stageName, setStageName] = useState('RO Membrane Assembly');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [notes, setNotes] = useState('');

  // Editing notes state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [noteInput, setNoteInput] = useState('');

  const filteredEvents = events.filter((e) => {
    if (filterTab === 'pending') return e.status !== 'Completed';
    if (filterTab === 'completed') return e.status === 'Completed';
    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddEvent({
      stage_id: 'stage_custom',
      stage_name: stageName,
      title: title.trim(),
      description: description.trim(),
      priority,
      technician_notes: notes.trim(),
    });

    setTitle('');
    setDescription('');
    setNotes('');
    setShowAddModal(false);
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'Critical':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'High':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Medium':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Progress':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white rounded-xl border border-slate-200 shadow-card">
        <div>
          <div className="flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-bold text-slate-900">Maintenance & Service Dispatch Center</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Log technician actions, track cartridge service history, and execute prognostically generated interventions.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Log Service Ticket</span>
        </button>
      </div>

      {/* Dynamic Alerts Derived from Prediction Engine */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
        <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Real-Time Condition-Based Alerts (Generated from Simulated Telemetry)</span>
        </h3>

        <div className="space-y-2.5">
          {prognostics.recommendations.map((rec, i) => (
            <div
              key={i}
              className="p-3.5 rounded-lg bg-amber-50/60 border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-2"
            >
              <div className="flex items-start space-x-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                <div>
                  <span className="text-xs font-bold text-amber-900">Alert #{i + 1}: Diagnostic Trigger</span>
                  <p className="text-xs text-amber-950 mt-0.5">{rec}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  onAddEvent({
                    stage_id: 'stage_auto',
                    stage_name: 'Condition-Based Inspection',
                    title: `Investigate: ${rec.slice(0, 45)}...`,
                    description: rec,
                    priority: 'High',
                    technician_notes: 'Created automatically from real-time alert trigger.',
                  });
                }}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-semibold shadow-2xs transition-colors"
              >
                Create Work Order
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Tabs & Event List */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-slate-900 text-base">Service Action Checklist & Log</h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              {events.length} records
            </span>
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1 rounded font-medium transition-all ${
                filterTab === 'all' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All ({events.length})
            </button>
            <button
              onClick={() => setFilterTab('pending')}
              className={`px-3 py-1 rounded font-medium transition-all ${
                filterTab === 'pending' ? 'bg-white text-amber-700 font-bold shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Pending ({events.filter((e) => e.status !== 'Completed').length})
            </button>
            <button
              onClick={() => setFilterTab('completed')}
              className={`px-3 py-1 rounded font-medium transition-all ${
                filterTab === 'completed' ? 'bg-white text-emerald-700 font-bold shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Completed ({events.filter((e) => e.status === 'Completed').length})
            </button>
          </div>
        </div>

        {/* List of Events */}
        <div className="mt-4 divide-y divide-slate-100">
          {filteredEvents.map((ev) => {
            const isCompleted = ev.status === 'Completed';
            const isEditing = editingId === ev.id;

            return (
              <div key={ev.id} className="py-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <button
                    onClick={() => {
                      if (!ev.id) return;
                      const nextStatus = isCompleted ? 'Pending' : 'Completed';
                      onUpdateEventStatus(ev.id, nextStatus);
                    }}
                    className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      isCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 hover:border-teal-500 bg-white'
                    }`}
                    title={isCompleted ? 'Mark Pending' : 'Mark Completed'}
                  >
                    {isCompleted && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                  </button>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h4
                        className={`text-sm font-bold ${
                          isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'
                        }`}
                      >
                        {ev.title}
                      </h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadge(ev.priority)}`}>
                        {ev.priority}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(ev.status)}`}>
                        {ev.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ev.description}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-2 font-mono">
                      <span>Module: <strong className="text-slate-700">{ev.stage_name}</strong></span>
                      <span>•</span>
                      <span>Logged: {new Date(ev.created_at).toLocaleDateString()}</span>
                      {ev.completed_at && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold">
                            Completed: {new Date(ev.completed_at).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Technician Notes Display or Edit */}
                    {isEditing ? (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <textarea
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          placeholder="Add technician service notes..."
                          rows={2}
                          className="w-full text-xs p-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                        <div className="mt-2 flex space-x-2">
                          <button
                            onClick={() => {
                              if (ev.id) onUpdateEventStatus(ev.id, ev.status, noteInput);
                              setEditingId(null);
                            }}
                            className="px-2.5 py-1 rounded bg-teal-600 text-white text-xs font-bold"
                          >
                            Save Note
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 rounded bg-slate-200 text-slate-700 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      ev.technician_notes && (
                        <div className="mt-2.5 p-2 rounded bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-start justify-between">
                          <span>
                            <strong className="text-slate-500 font-semibold">Tech Notes:</strong>{' '}
                            {ev.technician_notes}
                          </span>
                          <button
                            onClick={() => {
                              if (!ev.id) return;
                              setEditingId(ev.id);
                              setNoteInput(ev.technician_notes || '');
                            }}
                            className="text-[10px] text-teal-600 hover:underline font-semibold ml-2 shrink-0"
                          >
                            Edit
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {!isEditing && !ev.technician_notes && (
                  <button
                    onClick={() => {
                      if (!ev.id) return;
                      setEditingId(ev.id);
                      setNoteInput('');
                    }}
                    className="shrink-0 text-xs text-slate-500 hover:text-teal-600 border border-slate-200 px-2.5 py-1 rounded-md"
                  >
                    + Note
                  </button>
                )}
              </div>
            );
          })}

          {filteredEvents.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              No service events matching filter criteria.
            </div>
          )}
        </div>
      </div>

      {/* Add Maintenance Ticket Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6">
            <h3 className="font-bold text-slate-900 text-base mb-1">Create Preventive Service Ticket</h3>
            <p className="text-xs text-slate-500 mb-4">Record cartridge replacement or maintenance inspection.</p>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Filtration Module</label>
                <select
                  value={stageName}
                  onChange={(e) => setStageName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Pre-filtration (Spun 5µm)">Stage 1: Pre-filtration (Spun 5µm)</option>
                  <option value="Sediment Filter (Fine 1µm)">Stage 2: Sediment Filter (Fine 1µm)</option>
                  <option value="Activated Carbon Block">Stage 3: Activated Carbon Block</option>
                  <option value="RO Membrane Assembly">Stage 4: RO Membrane Assembly</option>
                  <option value="UF Membrane Stage">Stage 5: UF Membrane Stage</option>
                  <option value="UV Germicidal Chamber">Stage 6: UV Germicidal Chamber</option>
                  <option value="Alkaliser / Mineral Cartridge">Stage 7: Alkaliser / Mineral Cartridge</option>
                  <option value="Complete Hydraulic Overhaul">Complete Assembly Overhaul</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ticket Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Replace RO Membrane & Flush Housing"
                  className="w-full p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Priority Level</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Low', 'Medium', 'High', 'Critical'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-1.5 rounded-lg border font-semibold text-center ${
                        priority === p
                          ? 'border-teal-600 bg-teal-50 text-teal-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Observations</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide diagnosis, symptoms observed or technician recommendations..."
                  rows={2}
                  className="w-full p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Technician Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Serial # verified, spare part in van inventory."
                  className="w-full p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Save Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

