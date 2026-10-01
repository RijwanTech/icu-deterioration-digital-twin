import React, { useState, useMemo } from 'react';
import { 
  Users, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  RefreshCw, 
  ChevronRight, 
  Filter, 
  Activity, 
  Heart, 
  Wind, 
  Droplets,
  Layers,
  ArrowUpDown,
  Download,
  UserPlus,
  HelpCircle,
  LayoutGrid,
  List
} from 'lucide-react';
import { Patient, RiskLevel, DashboardSummary } from '../types';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { exportCohortSummaryToCSV } from '../services/csvExport';

interface DashboardPageProps {
  patients: Patient[];
  summary: DashboardSummary | null;
  onSelectPatient: (patient: Patient) => void;
  onRefresh: () => void;
  isLoading: boolean;
  onOpenAddPatient?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  patients,
  summary,
  onSelectPatient,
  onRefresh,
  isLoading,
  onOpenAddPatient
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'risk_desc' | 'risk_asc' | 'id' | 'bed'>('risk_desc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Filtered and sorted patients
  const filteredPatients = useMemo(() => {
    return patients
      .filter(p => {
        const matchesSearch = 
          p.patient_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.bed_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.admission_diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.unit.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRisk = riskFilter === 'ALL' || p.risk_level === riskFilter;
        const matchesUnit = unitFilter === 'ALL' || p.unit.includes(unitFilter);

        return matchesSearch && matchesRisk && matchesUnit;
      })
      .sort((a, b) => {
        if (sortBy === 'risk_desc') return b.risk_score - a.risk_score;
        if (sortBy === 'risk_asc') return a.risk_score - b.risk_score;
        if (sortBy === 'bed') return a.bed_number.localeCompare(b.bed_number);
        return a.patient_id.localeCompare(b.patient_id);
      });
  }, [patients, searchQuery, riskFilter, unitFilter, sortBy]);

  const uniqueUnits = useMemo(() => {
    const units = new Set<string>();
    patients.forEach(p => {
      if (p.unit.includes('MICU')) units.add('MICU');
      else if (p.unit.includes('SICU')) units.add('SICU');
      else if (p.unit.includes('CICU')) units.add('CICU');
      else if (p.unit.includes('NICU')) units.add('NICU');
      else if (p.unit.includes('TICU')) units.add('TICU');
    });
    return Array.from(units);
  }, [patients]);

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch {
      return ts;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-950 pb-16 md:pb-6">
      <DisclaimerBanner />

      <div className="p-3.5 sm:p-5 md:p-6 space-y-5 max-w-7xl mx-auto w-full">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>ICU Command Center & Deterioration Monitor</span>
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Continuous multi-patient telemetry ingestion paired with machine learning deterioration estimation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenAddPatient && (
              <button
                onClick={onOpenAddPatient}
                className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Admit Patient</span>
              </button>
            )}

            <button
              onClick={() => exportCohortSummaryToCSV(patients)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors"
              title="Export complete multi-patient cohort dataset to CSV"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Export Cohort CSV</span>
              <span className="sm:hidden">CSV</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Cards - High Contrast */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Patients */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-300 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider">TOTAL PATIENTS</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white font-mono tabular-nums">
              {summary?.total_patients ?? patients.length}
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              Active Digital Twins Synced
            </div>
          </div>

          {/* Low Risk */}
          <div 
            onClick={() => setRiskFilter(riskFilter === 'LOW' ? 'ALL' : 'LOW')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-md ${
              riskFilter === 'LOW' 
                ? 'bg-emerald-950 border-emerald-500 ring-2 ring-emerald-500/40 shadow-emerald-950/50' 
                : 'bg-slate-900/90 border-slate-800 hover:border-emerald-700'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-300 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider">LOW RISK</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-300 font-mono tabular-nums">
              {summary?.low_risk_count ?? patients.filter(p => p.risk_level === 'LOW').length}
            </div>
            <div className="text-[11px] font-mono text-slate-300 mt-1">
              Score: 0.00 – 0.39 (Nominal)
            </div>
          </div>

          {/* Medium Risk */}
          <div 
            onClick={() => setRiskFilter(riskFilter === 'MEDIUM' ? 'ALL' : 'MEDIUM')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-md ${
              riskFilter === 'MEDIUM' 
                ? 'bg-amber-950 border-amber-500 ring-2 ring-amber-500/40 shadow-amber-950/50' 
                : 'bg-slate-900/90 border-slate-800 hover:border-amber-700'
            }`}
          >
            <div className="flex items-center justify-between text-amber-300 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider">MEDIUM RISK</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-amber-300 font-mono tabular-nums">
              {summary?.medium_risk_count ?? patients.filter(p => p.risk_level === 'MEDIUM').length}
            </div>
            <div className="text-[11px] font-mono text-slate-300 mt-1">
              Score: 0.40 – 0.69 (Guarded)
            </div>
          </div>

          {/* High Risk */}
          <div 
            onClick={() => setRiskFilter(riskFilter === 'HIGH' ? 'ALL' : 'HIGH')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-md ${
              riskFilter === 'HIGH' 
                ? 'bg-rose-950 border-rose-500 ring-2 ring-rose-500/40 shadow-rose-950/50' 
                : 'bg-slate-900/90 border-slate-800 hover:border-rose-700'
            }`}
          >
            <div className="flex items-center justify-between text-rose-300 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider">HIGH RISK</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-rose-300 font-mono tabular-nums">
              {summary?.high_risk_count ?? patients.filter(p => p.risk_level === 'HIGH').length}
            </div>
            <div className="text-[11px] font-mono text-slate-300 mt-1">
              Score: 0.70 – 1.00 (Escalated)
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-md">
          <div className="flex items-center gap-3 flex-1 min-w-[220px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Patient ID, Bed, Dx..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Risk segmented control */}
            <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
              {(['ALL', 'LOW', 'MEDIUM', 'HIGH'] as const).map(tier => (
                <button
                  key={tier}
                  onClick={() => setRiskFilter(tier)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                    riskFilter === tier
                      ? 'bg-slate-800 text-cyan-300 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>

            {/* Unit filter */}
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs font-medium rounded-xl px-2.5 py-2 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Units</option>
              {uniqueUnits.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>

            {/* Sort order */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs font-medium rounded-xl px-2.5 py-2 focus:outline-none focus:border-cyan-500"
            >
              <option value="risk_desc">Risk (Highest)</option>
              <option value="risk_asc">Risk (Lowest)</option>
              <option value="id">Patient ID</option>
              <option value="bed">Bed Number</option>
            </select>

            {/* View Mode Toggle (Desktop) */}
            <div className="hidden sm:flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'cards' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
                title="Cards Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
                title="Table List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* PATIENT LISTING: RESPONSIVE CARDS GRID (DEFAULT ON MOBILE) */}
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredPatients.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-slate-900/50 border border-slate-800 rounded-2xl">
                No ICU patients match your search filter criteria.
              </div>
            ) : (
              filteredPatients.map(patient => {
                const v = patient.current_state;
                const isHigh = patient.risk_level === 'HIGH';
                const isMed = patient.risk_level === 'MEDIUM';

                return (
                  <div
                    key={patient.patient_id}
                    onClick={() => onSelectPatient(patient)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer group shadow-lg flex flex-col justify-between hover:scale-[1.01] active:scale-98 ${
                      isHigh
                        ? 'bg-gradient-to-b from-rose-950/40 to-slate-900/90 border-rose-800/80 hover:border-rose-500'
                        : isMed
                        ? 'bg-gradient-to-b from-amber-950/30 to-slate-900/90 border-amber-800/80 hover:border-amber-500'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Header */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            isHigh ? 'bg-rose-500 animate-pulse ring-2 ring-rose-500/30' :
                            isMed ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} />
                          <div>
                            <div className="font-black text-white text-base tracking-tight flex items-center gap-1.5">
                              <span>{patient.patient_id}</span>
                              <span className="text-xs font-mono text-cyan-300 font-semibold bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800">
                                {patient.bed_number}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-300 truncate max-w-[170px] mt-0.5">
                              {patient.admission_diagnosis}
                            </div>
                          </div>
                        </div>

                        {/* Risk Badge */}
                        <div className={`text-right px-2 py-1 rounded-xl border ${
                          isHigh ? 'bg-rose-950 text-rose-300 border-rose-600' :
                          isMed ? 'bg-amber-950 text-amber-300 border-amber-600' :
                          'bg-emerald-950 text-emerald-300 border-emerald-600'
                        }`}>
                          <div className="text-xs font-black font-mono">
                            {(patient.risk_score * 100).toFixed(0)}%
                          </div>
                          <div className="text-[9px] font-bold uppercase tracking-wider">
                            {patient.risk_level}
                          </div>
                        </div>
                      </div>

                      {/* Vital Signs Grid */}
                      <div className="grid grid-cols-4 gap-1.5 py-2.5 my-2 border-y border-slate-800/80 text-center font-mono text-xs">
                        <div className="bg-slate-950/80 p-1.5 rounded-lg">
                          <div className="text-[9px] text-slate-400">HR</div>
                          <div className={`font-bold tabular-nums ${v.heart_rate > 100 ? 'text-rose-300' : 'text-slate-100'}`}>
                            {v.heart_rate}
                          </div>
                        </div>
                        <div className="bg-slate-950/80 p-1.5 rounded-lg">
                          <div className="text-[9px] text-slate-400">SpO2</div>
                          <div className={`font-bold tabular-nums ${v.spo2 < 93 ? 'text-rose-300' : 'text-cyan-300'}`}>
                            {v.spo2}%
                          </div>
                        </div>
                        <div className="bg-slate-950/80 p-1.5 rounded-lg">
                          <div className="text-[9px] text-slate-400">BP</div>
                          <div className="font-bold text-slate-100 tabular-nums">
                            {v.systolic_bp}
                          </div>
                        </div>
                        <div className="bg-slate-950/80 p-1.5 rounded-lg">
                          <div className="text-[9px] text-slate-400">RR</div>
                          <div className={`font-bold tabular-nums ${v.respiratory_rate > 22 ? 'text-amber-300' : 'text-slate-100'}`}>
                            {v.respiratory_rate}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-400 font-mono">
                        {patient.age}y {patient.gender} · {patient.unit}
                      </span>
                      <span className="text-cyan-400 group-hover:text-cyan-300 font-bold flex items-center gap-1">
                        <span>Open Twin</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* TABLE LIST VIEW (FOR DESKTOP USERS) */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  <tr>
                    <th className="py-3.5 px-4">Patient / Bed</th>
                    <th className="py-3.5 px-3">Age / Sex</th>
                    <th className="py-3.5 px-3 text-center">HR (bpm)</th>
                    <th className="py-3.5 px-3 text-center">BP (mmHg)</th>
                    <th className="py-3.5 px-3 text-center">SpO2</th>
                    <th className="py-3.5 px-3 text-center">RR (bpm)</th>
                    <th className="py-3.5 px-3 text-center">Temp (°C)</th>
                    <th className="py-3.5 px-4 text-center">Deterioration Risk</th>
                    <th className="py-3.5 px-3 text-right">Updated</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {filteredPatients.map(patient => {
                    const v = patient.current_state;
                    const isHigh = patient.risk_level === 'HIGH';
                    const isMed = patient.risk_level === 'MEDIUM';

                    return (
                      <tr
                        key={patient.patient_id}
                        onClick={() => onSelectPatient(patient)}
                        className={`hover:bg-slate-800/80 transition-colors cursor-pointer group ${
                          isHigh ? 'bg-rose-950/20' : (isMed ? 'bg-amber-950/20' : '')
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              isHigh ? 'bg-rose-500 animate-pulse' :
                              isMed ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} />
                            <div>
                              <div className="font-bold text-white text-sm tracking-tight flex items-center gap-1.5">
                                <span>{patient.patient_id}</span>
                                <span className="text-[11px] font-normal text-slate-300">· {patient.bed_number}</span>
                              </div>
                              <div className="text-[11px] text-slate-300 font-sans truncate max-w-[200px]">
                                {patient.admission_diagnosis}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-slate-200">
                          {patient.age}y / {patient.gender === 'Male' ? 'M' : 'F'}
                        </td>

                        <td className="py-3.5 px-3 text-center tabular-nums">
                          <span className={`font-bold ${v.heart_rate > 105 ? 'text-rose-300' : 'text-slate-100'}`}>
                            {v.heart_rate}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center tabular-nums text-slate-100">
                          {v.systolic_bp}/{v.diastolic_bp}
                        </td>

                        <td className="py-3.5 px-3 text-center tabular-nums">
                          <span className={`font-bold ${v.spo2 < 92 ? 'text-rose-300' : (v.spo2 < 95 ? 'text-amber-300' : 'text-cyan-300')}`}>
                            {v.spo2}%
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center tabular-nums">
                          <span className={`font-bold ${v.respiratory_rate > 22 ? 'text-amber-300' : 'text-slate-100'}`}>
                            {v.respiratory_rate}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center tabular-nums text-slate-200">
                          {v.temperature.toFixed(1)}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl border text-xs font-bold font-mono ${
                            isHigh ? 'bg-rose-950 text-rose-300 border-rose-600' :
                            isMed ? 'bg-amber-950 text-amber-300 border-amber-600' :
                            'bg-emerald-950 text-emerald-300 border-emerald-600'
                          }`}>
                            <span>{(patient.risk_score * 100).toFixed(0)}%</span>
                            <span className="text-[10px]">{patient.risk_level}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-right text-slate-400 text-[11px] tabular-nums">
                          {formatTime(patient.last_updated)}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                            <span>Open</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
