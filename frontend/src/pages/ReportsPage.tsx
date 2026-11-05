import React, { useState } from 'react';
import {
  SensorReading,
  HealthScore,
  PrognosticsResult,
  MaintenanceEvent,
  SystemSettings,
} from '../types';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
  Layers,
  Droplet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsPageProps {
  reading: SensorReading;
  health: HealthScore;
  prognostics: PrognosticsResult;
  history: SensorReading[];
  maintenanceEvents: MaintenanceEvent[];
  settings: SystemSettings;
  exportCsvUrl: string;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  reading,
  health,
  prognostics,
  history,
  maintenanceEvents,
  settings,
  exportCsvUrl,
}) => {
  const [reportGenDate] = useState(new Date().toLocaleString());
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Analytics charts preparation
  const chartData = history.slice(-25).map((r) => {
    const d = new Date(r.timestamp);
    const dayStr = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
    const flowDrop = Math.max(0, (2.0 - r.flow_rate) / 2.0);
    const scoreEst = Math.max(
      15,
      100 - (r.cumulative_water / 6000 * 30 + flowDrop * 40 + (r.filter_age_days / 365 * 25))
    );
    return {
      name: dayStr,
      flow_rate: r.flow_rate,
      pressure_drop: r.pressure_drop,
      input_tds: r.input_tds,
      output_tds: r.output_tds,
      turbidity: r.turbidity,
      daily_consumption: r.daily_consumption,
      health: +scoreEst.toFixed(1),
    };
  });

  // Client-side CSV generator fallback
  const handleDownloadCsv = () => {
    const headers = [
      'Timestamp',
      'Input_TDS_ppm',
      'Output_TDS_ppm',
      'Turbidity_NTU',
      'Flow_Rate_Lpm',
      'Pressure_Drop_bar',
      'Cumulative_Water_L',
      'Filter_Age_Days',
      'Daily_Consumption_L',
      'Data_Provenance',
    ];
    const rows = history.map((r) => [
      r.timestamp,
      r.input_tds,
      r.output_tds,
      r.turbidity,
      r.flow_rate,
      r.pressure_drop,
      r.cumulative_water,
      r.filter_age_days,
      r.daily_consumption,
      'SIMULATED DATA',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `aquasense_historical_telemetry_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Professional PDF Report generator
  const handleGeneratePdf = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF();

      // Brand Title Header
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 36, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('AquaSense – Predictive Health & Prognostics Report', 14, 18);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text('Atomberg Technologies — atomQUEST 2026 Innovation Challenge Submission', 14, 26);
      doc.text(`Generated: ${new Date().toLocaleString()} | Device: ATMB-RO-001`, 14, 31);

      // Disclaimer Alert Bar
      doc.setFillColor(254, 243, 199); // amber-100
      doc.setDrawColor(245, 158, 11);
      doc.rect(14, 42, 182, 12, 'FD');
      doc.setTextColor(146, 64, 14); // amber-900
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(
        'IMPORTANT PROVENANCE DECLARATION: ALL DATA IN THIS REPORT IS SYNTHETICALLY SIMULATED.',
        18,
        49
      );

      // Section 1: Executive Summary
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Purifier Condition & Prognostic Summary', 14, 62);

      autoTable(doc, {
        startY: 66,
        head: [['Metric Parameter', 'Current Value', 'Nominal Benchmark', 'Status Evaluation']],
        body: [
          ['Overall Filter Health', `${health.score.toFixed(1)} / 100`, '75 – 100 Optimal', health.status],
          [
            'Remaining Useful Life (RUL)',
            `${prognostics.remaining_useful_life_days} Days`,
            '> 60 Days',
            prognostics.failure_risk,
          ],
          [
            'Projected Replacement Date',
            prognostics.estimated_replacement_date,
            'Calendar Schedule',
            'Estimated',
          ],
          [
            'Degradation Velocity',
            `-${prognostics.degradation_rate_per_day.toFixed(3)} pts/day`,
            '< 0.20 pts/day',
            prognostics.confidence_level,
          ],
          ['Purified Flow Rate', `${reading.flow_rate.toFixed(2)} L/min`, '2.0 L/min', reading.flow_rate > 1.2 ? 'Nominal' : 'Choked'],
          ['Differential Pressure (ΔP)', `${reading.pressure_drop.toFixed(2)} bar`, '< 0.50 bar', reading.pressure_drop < 0.8 ? 'Normal' : 'Elevated'],
          ['Permeate Output TDS', `${reading.output_tds.toFixed(0)} ppm`, '< 100 ppm', reading.output_tds < 100 ? 'Compliant' : 'High TDS'],
          ['Cumulative Volume Processed', `${reading.cumulative_water.toLocaleString()} L`, '6,000 L Max Rated', `${((reading.cumulative_water / 6000) * 100).toFixed(0)}% Capacity`],
        ],
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [13, 148, 136] }, // teal-600
      });

      // Section 2: Prescriptive Actions
      const finalY1 = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Actionable Prognostics & Maintenance Recommendations', 14, finalY1);

      const recsBody = prognostics.recommendations.map((rec, i) => [`Action #${i + 1}`, rec]);
      autoTable(doc, {
        startY: finalY1 + 4,
        head: [['Code', 'Recommended Engineering Action']],
        body: recsBody.length > 0 ? recsBody : [['Notice', 'All parameters within normal operating envelope.']],
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [8, 145, 178] }, // cyan-600
      });

      // Section 3: Recent Maintenance Events
      const finalY2 = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('3. Maintenance History & Service Log', 14, finalY2);

      const maintBody = maintenanceEvents.slice(0, 5).map((e) => [
        new Date(e.created_at).toLocaleDateString(),
        e.stage_name,
        e.title,
        e.priority,
        e.status,
      ]);

      autoTable(doc, {
        startY: finalY2 + 4,
        head: [['Date', 'Filtration Stage', 'Service Event', 'Priority', 'Status']],
        body: maintBody,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [15, 23, 42] },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `AquaSense Prognostics System | Confidential — For atomQUEST 2026 Evaluation Only | Page ${i} of ${pageCount}`,
          14,
          290
        );
      }

      doc.save(`AquaSense_Health_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('PDF error', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-bold text-slate-900">Analytics & System Health Reports</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Export audit-ready condition monitoring summaries and longitudinal sensor telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF Report'}</span>
          </button>
        </div>
      </div>

      {/* Report Summary Card Preview */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Current System Health Dossier</h3>
            <span className="text-xs text-slate-400 font-mono">
              Timestamp: {reportGenDate} | Machine ID: ATMB-AQUASENSE-001
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Audit Ready
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-5 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-400 font-semibold block uppercase text-[10px]">Filter Health</span>
            <span className="text-2xl font-extrabold font-mono text-slate-900 mt-1 block">
              {health.score.toFixed(1)} / 100
            </span>
            <span className="text-teal-600 font-medium">{health.status}</span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-400 font-semibold block uppercase text-[10px]">Predicted RUL</span>
            <span className="text-2xl font-extrabold font-mono text-slate-900 mt-1 block">
              {prognostics.remaining_useful_life_days} Days
            </span>
            <span className="text-slate-500 font-medium">Due {prognostics.estimated_replacement_date}</span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-400 font-semibold block uppercase text-[10px]">Flow Status</span>
            <span className="text-2xl font-extrabold font-mono text-slate-900 mt-1 block">
              {reading.flow_rate.toFixed(2)} L/min
            </span>
            <span className="text-slate-500 font-medium">ΔP: {reading.pressure_drop.toFixed(2)} bar</span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-400 font-semibold block uppercase text-[10px]">Water Processed</span>
            <span className="text-2xl font-extrabold font-mono text-slate-900 mt-1 block">
              {reading.cumulative_water.toLocaleString()} L
            </span>
            <span className="text-slate-500 font-medium">Daily: {reading.daily_consumption.toFixed(0)} L</span>
          </div>
        </div>

        {/* Suggested Actions Preview */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-2">
            Suggested Maintenance Actions:
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
            {prognostics.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Historical Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart A: Filter Health over Time */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <h3 className="font-bold text-slate-900 text-sm mb-1">Filter Health Score Over Time</h3>
          <p className="text-xs text-slate-500 mb-3">Multi-parameter degradation trajectory</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip />
                <Line type="monotone" dataKey="health" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Input vs Output TDS */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <h3 className="font-bold text-slate-900 text-sm mb-1">Input vs Output TDS (ppm)</h3>
          <p className="text-xs text-slate-500 mb-3">Feed salt load vs permeate purity</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip />
                <Line type="monotone" dataKey="input_tds" stroke="#64748b" strokeWidth={1.5} dot={false} name="Input TDS" />
                <Line type="monotone" dataKey="output_tds" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 2 }} name="Output TDS" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart C: Flow Rate Variation */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <h3 className="font-bold text-slate-900 text-sm mb-1">Flow Rate Variation (L/min)</h3>
          <p className="text-xs text-slate-500 mb-3">Permeate flux stability profile</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis domain={[0, 2.5]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip />
                <Line type="monotone" dataKey="flow_rate" stroke="#0891b2" strokeWidth={2.5} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart D: Daily Water Consumption */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <h3 className="font-bold text-slate-900 text-sm mb-1">Water Consumption Histogram (L/day)</h3>
          <p className="text-xs text-slate-500 mb-3">Household water demand pattern</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip />
                <Bar dataKey="daily_consumption" fill="#0d9488" radius={[0, 0, 0, 0]} name="Consumption (L)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

