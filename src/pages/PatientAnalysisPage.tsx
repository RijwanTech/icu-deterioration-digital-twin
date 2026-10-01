import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';
import { Patient, TrendDataPoint, TrendAnalysisSummary, TimelineEvent } from '../types';
import { PatientHeader } from '../components/PatientHeader';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { api } from '../services/api';
import { exportPatientDataToCSV } from '../utils/export.js';
import { 
  LineChart as LineChartIcon, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Clock, 
  Activity, 
  ShieldAlert, 
  Calendar,
  Layers,
  ArrowRight,
  Download
} from 'lucide-react';

interface PatientAnalysisPageProps {
  patient: Patient;
  timeline: TimelineEvent[];
  onNavigateTab: (tab: 'twin' | 'vitals' | 'trends' | 'risk' | 'timeline' | 'simulation') => void;
  onOpenAIExplanation: () => void;
}

export const PatientAnalysisPage: React.FC<PatientAnalysisPageProps> = ({
  patient,
  timeline,
  onNavigateTab,
  onOpenAIExplanation
}) => {
  const [timeRangeHours, setTimeRangeHours] = useState<6 | 12 | 24>(24);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [trendSummary, setTrendSummary] = useState<TrendAnalysisSummary | null>(null);
  const [activeAnalysisView, setActiveAnalysisView] = useState<'trends' | 'timeline' | 'correlation'>('trends');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchTrends = async () => {
      setIsLoading(true);
      try {
        const res = await api.getPatientTrends(patient.patient_id, timeRangeHours);
        if (isMounted) {
          setTrendData(res.points);
          setTrendSummary(res.summary);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchTrends();
    return () => { isMounted = false; };
  }, [patient.patient_id, timeRangeHours]);

  const getTrendIcon = (trend: 'Increasing' | 'Decreasing' | 'Stable') => {
    if (trend === 'Increasing') return <TrendingUp className="w-3.5 h-3.5 text-rose-400" />;
    if (trend === 'Decreasing') return <TrendingDown className="w-3.5 h-3.5 text-cyan-400" />;
    return <Minus className="w-3.5 h-3.5 text-slate-400" />;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-xl text-xs font-mono space-y-1">
          <div className="text-slate-400 font-bold border-b border-slate-800 pb-1 mb-1.5 flex items-center justify-between gap-4">
            <span>TIMESTAMP: {label}</span>
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-bold text-white tabular-nums">
                {entry.value} {entry.unit || ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-950">
      <DisclaimerBanner />

      <PatientHeader
        patient={patient}
        activeTab="trends"
        onSelectTab={onNavigateTab}
        onOpenAIExplanation={onOpenAIExplanation}
        onExportCSV={() => exportPatientDataToCSV(patient.patient_id, trendData)}
      />

      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* View Switcher & Time Range Selector */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveAnalysisView('trends')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeAnalysisView === 'trends'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
              }`}
            >
              Telemetry Waveforms & Trends
            </button>
            <button
              onClick={() => setActiveAnalysisView('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeAnalysisView === 'timeline'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
              }`}
            >
              Chronological Patient Timeline
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activeAnalysisView === 'trends' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Analysis Window:</span>
                <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-lg">
                  {([6, 12, 24] as const).map(hours => (
                    <button
                      key={hours}
                      onClick={() => setTimeRangeHours(hours)}
                      className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                        timeRangeHours === hours
                          ? 'bg-slate-800 text-cyan-300 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {hours} Hours
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => exportPatientDataToCSV(patient.patient_id, trendData)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
              title="Export trend series data to CSV"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Data</span>
            </button>
          </div>
        </div>

        {activeAnalysisView === 'trends' ? (
          <>
            {/* Trend Summaries Bar (Derived from Data) */}
            {trendSummary && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono text-xs">
                {/* HR */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[11px] flex items-center justify-between">
                    <span>HEART RATE</span>
                    {getTrendIcon(trendSummary.heart_rate_trend)}
                  </div>
                  <div className="text-sm font-bold text-white mt-1">
                    {trendSummary.heart_rate_trend}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Delta: {trendSummary.heart_rate_change > 0 ? `+${trendSummary.heart_rate_change}` : trendSummary.heart_rate_change} bpm
                  </div>
                </div>

                {/* SpO2 */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[11px] flex items-center justify-between">
                    <span>SPO2 SATURATION</span>
                    {getTrendIcon(trendSummary.spo2_trend)}
                  </div>
                  <div className="text-sm font-bold text-white mt-1">
                    {trendSummary.spo2_trend}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Delta: {trendSummary.spo2_change > 0 ? `+${trendSummary.spo2_change}` : trendSummary.spo2_change}%
                  </div>
                </div>

                {/* RR */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[11px] flex items-center justify-between">
                    <span>RESPIRATORY</span>
                    {getTrendIcon(trendSummary.respiratory_rate_trend)}
                  </div>
                  <div className="text-sm font-bold text-white mt-1">
                    {trendSummary.respiratory_rate_trend}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Delta: {trendSummary.respiratory_rate_change > 0 ? `+${trendSummary.respiratory_rate_change}` : trendSummary.respiratory_rate_change} bpm
                  </div>
                </div>

                {/* BP */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[11px] flex items-center justify-between">
                    <span>BLOOD PRESSURE</span>
                    {getTrendIcon(trendSummary.blood_pressure_trend)}
                  </div>
                  <div className="text-sm font-bold text-white mt-1">
                    {trendSummary.blood_pressure_trend}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Perfusion: SBP &amp; MAP
                  </div>
                </div>

                {/* Stability */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 col-span-2 md:col-span-1">
                  <div className="text-slate-400 text-[11px]">COHORT STABILITY</div>
                  <div className={`text-sm font-bold mt-1 ${
                    trendSummary.stability_index === 'Volatile' ? 'text-rose-400' :
                    trendSummary.stability_index === 'Guarded' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {trendSummary.stability_index.toUpperCase()}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Across {timeRangeHours}h rolling window
                  </div>
                </div>
              </div>
            )}

            {/* Grid of 5 Time-Series Waveform Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 1. Heart Rate Chart */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Heart Rate (HR)
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">Target: 60–100 bpm</span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="display_time" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis domain={['auto', 'auto']} stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine y={100} stroke="#f43f5e" strokeDasharray="3 3" opacity={0.6} />
                      <ReferenceLine y={60} stroke="#f43f5e" strokeDasharray="3 3" opacity={0.6} />
                      <Line
                        type="monotone"
                        dataKey="heart_rate"
                        name="Heart Rate"
                        unit="bpm"
                        stroke="#f43f5e"
                        strokeWidth={2.5}
                        dot={{ r: 2.5, fill: '#f43f5e' }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 2. SpO2 Oxygen Saturation Chart */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Pulse Oximetry (SpO2)
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">Target: 95–100%</span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="display_time" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis domain={[80, 100]} stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine y={92} stroke="#f43f5e" strokeDasharray="3 3" opacity={0.6} />
                      <Line
                        type="monotone"
                        dataKey="spo2"
                        name="SpO2"
                        unit="%"
                        stroke="#06b6d4"
                        strokeWidth={2.5}
                        dot={{ r: 2.5, fill: '#06b6d4' }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 3. Blood Pressure / MAP Chart */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Hemodynamics (SBP / DBP / MAP)
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">MAP Threshold &gt;65 mmHg</span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="display_time" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis domain={['auto', 'auto']} stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine y={65} stroke="#f43f5e" strokeDasharray="3 3" opacity={0.6} />
                      <Line
                        type="monotone"
                        dataKey="systolic_bp"
                        name="Systolic BP"
                        unit="mmHg"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 2, fill: '#10b981' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="diastolic_bp"
                        name="Diastolic BP"
                        unit="mmHg"
                        stroke="#059669"
                        strokeWidth={1.5}
                        strokeDasharray="4 2"
                        dot={{ r: 2, fill: '#059669' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="map"
                        name="MAP"
                        unit="mmHg"
                        stroke="#fbbf24"
                        strokeWidth={2}
                        dot={{ r: 2, fill: '#fbbf24' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 4. Respiratory Rate Chart */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Respiratory Rate (RR)
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">Target: 12–20 bpm</span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="display_time" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis domain={[8, 38]} stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine y={24} stroke="#f43f5e" strokeDasharray="3 3" opacity={0.6} />
                      <Line
                        type="monotone"
                        dataKey="respiratory_rate"
                        name="Respiratory Rate"
                        unit="bpm"
                        stroke="#818cf8"
                        strokeWidth={2.5}
                        dot={{ r: 2.5, fill: '#818cf8' }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 5. Historical AI Risk Score Trajectory (Full Width) */}
              <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Model Deterioration Probability Trajectory
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">Threshold: &gt;70% High Risk</span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="display_time" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine y={70} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'High Risk (0.70)', fill: '#f43f5e', fontSize: 10 }} />
                      <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Medium Risk (0.40)', fill: '#f59e0b', fontSize: 10 }} />
                      <Area
                        type="monotone"
                        dataKey="risk_score"
                        name="Deterioration Risk"
                        unit="%"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#riskGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Chronological Patient Timeline View */
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Comprehensive Chronological Patient Events</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Auditable sequence of physiological telemetry, risk model alerts, and clinical events.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Total Events: {timeline.length}
              </span>
            </div>

            <div className="space-y-4 max-w-4xl">
              {timeline.map((event, idx) => (
                <div key={event.event_id} className="relative pl-6 pb-6 border-l border-slate-800 last:border-l-0">
                  <div className={`absolute -left-[7px] top-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                    event.severity === 'critical' ? 'bg-rose-500 ring-4 ring-rose-500/20' :
                    event.severity === 'warning' ? 'bg-amber-500' : 'bg-cyan-500'
                  }`} />

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{event.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                          {event.event_type.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
