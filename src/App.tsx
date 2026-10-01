import React, { useState, useEffect } from 'react';
import { 
  Patient, 
  UserProfile, 
  PredictionResult, 
  TimelineEvent, 
  SystemAlert, 
  DashboardSummary,
  RiskThresholdConfig,
  VitalSign
} from './types';
import { api, getThresholdConfig, updateThresholdConfig } from './services/api';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AlertsDrawer } from './components/AlertsDrawer';
import { ConfigModal } from './components/ConfigModal';
import { AIExplanationModal } from './components/AIExplanationModal';
import { AddPatientModal } from './components/AddPatientModal';
import { LogVitalModal } from './components/LogVitalModal';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PatientDigitalTwinPage } from './pages/PatientDigitalTwinPage';
import { PatientAnalysisPage } from './pages/PatientAnalysisPage';
import { WhatIfSimulationPage } from './pages/WhatIfSimulationPage';

export default function App() {
  // Authentication state
  const [user, setUser] = useState<UserProfile | null>(null);

  // Navigation state
  const [activeScreen, setActiveScreen] = useState<string>('dashboard');
  const [activePatientId, setActivePatientId] = useState<string>('');

  // Core Data States
  const [patients, setPatients] = useState<Patient[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedPatientHistory, setSelectedPatientHistory] = useState<VitalSign[]>([]);
  const [selectedPatientPrediction, setSelectedPatientPrediction] = useState<PredictionResult | null>(null);
  const [selectedPatientTimeline, setSelectedPatientTimeline] = useState<TimelineEvent[]>([]);

  // UI Modal / Drawer States
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isAIExplanationOpen, setIsAIExplanationOpen] = useState(false);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isLogVitalOpen, setIsLogVitalOpen] = useState(false);
  const [thresholdConfig, setThresholdConfig] = useState<RiskThresholdConfig>(getThresholdConfig());

  // Loading and error states
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Load initial patients and dashboard summary
  const loadCohortData = async () => {
    setIsLoadingPatients(true);
    setGlobalError(null);
    try {
      const [pts, sum, alts] = await Promise.all([
        api.getPatients(),
        api.getDashboardSummary(),
        api.getAlerts()
      ]);
      setPatients(pts);
      setSummary(sum);
      setAlerts(alts);

      // Select default patient if not already set or not in list
      const targetId = activePatientId || pts[0]?.patient_id;
      const found = pts.find(p => p.patient_id === targetId) || pts[0];
      if (found) {
        setSelectedPatient(found);
        await loadPatientDetails(found.patient_id);
      } else {
        setSelectedPatient(null);
        setSelectedPatientHistory([]);
        setSelectedPatientPrediction(null);
        setSelectedPatientTimeline([]);
      }
    } catch (err: any) {
      setGlobalError(err.message || 'Unable to load ICU patient cohort data. Please try again.');
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const loadPatientDetails = async (patientId: string) => {
    try {
      const [pt, vitals, pred, timeline] = await Promise.all([
        api.getPatient(patientId),
        api.getPatientVitals(patientId),
        api.getLatestPrediction(patientId),
        api.getPatientTimeline(patientId)
      ]);
      setSelectedPatient(pt);
      setSelectedPatientHistory(vitals);
      setSelectedPatientPrediction(pred);
      setSelectedPatientTimeline(timeline);
    } catch (err: any) {
      console.error('Error loading patient details:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadCohortData();
    }
  }, [user]);

  // Handle patient selection
  const handleSelectPatient = async (patient: Patient | string) => {
    const patientId = typeof patient === 'string' ? patient : patient.patient_id;
    setActivePatientId(patientId);
    await loadPatientDetails(patientId);
    setActiveScreen('digital-twin');
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    await api.acknowledgeAlert(alertId);
    const updated = await api.getAlerts();
    setAlerts(updated);
    const sum = await api.getDashboardSummary();
    setSummary(sum);
  };

  const handleSaveThresholds = (newConfig: RiskThresholdConfig) => {
    updateThresholdConfig(newConfig);
    setThresholdConfig(newConfig);
    loadCohortData();
  };

  const handlePatientAdded = async (newPt: Patient) => {
    await loadCohortData();
    setSelectedPatient(newPt);
    setActivePatientId(newPt.patient_id);
    await loadPatientDetails(newPt.patient_id);
    setActiveScreen('digital-twin');
  };

  const handleVitalLogged = async (updatedPt: Patient) => {
    setSelectedPatient(updatedPt);
    await loadCohortData();
    await loadPatientDetails(updatedPt.patient_id);
  };

  const handleApplySimulation = async (patientId: string, simulatedVitals: any) => {
    const updated = await api.applySimulationToTwin(patientId, simulatedVitals);
    setSelectedPatient(updated);
    await loadCohortData();
    await loadPatientDetails(patientId);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveScreen('login');
  };

  if (!user) {
    return <LoginPage onLoginSuccess={(u) => { setUser(u); setActiveScreen('dashboard'); }} />;
  }

  const activeAlertsCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 antialiased font-sans">
      {/* Top Header */}
      <TopBar
        user={user}
        activeAlertsCount={activeAlertsCount}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenConfig={() => setIsConfigOpen(true)}
        onLogout={handleLogout}
        activeScreen={activeScreen}
        onNavigate={(screen) => setActiveScreen(screen)}
        selectedPatient={selectedPatient}
        patients={patients}
        onSelectPatient={handleSelectPatient}
      />

      {/* Main App Workspace (Sidebar + Dynamic Screen Area) */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeScreen={activeScreen}
          onNavigate={(screen) => setActiveScreen(screen)}
          selectedPatient={selectedPatient}
          patients={patients}
          onSelectPatient={handleSelectPatient}
          activeAlertsCount={activeAlertsCount}
          onLogout={handleLogout}
        />

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {globalError && (
            <div className="p-4 bg-rose-950/80 border-b border-rose-800 text-rose-200 text-xs flex items-center justify-between">
              <span>{globalError}</span>
              <button
                onClick={() => loadCohortData()}
                className="px-3 py-1 rounded bg-rose-900 hover:bg-rose-800 text-white font-semibold text-xs transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Screen Routing */}
          {activeScreen === 'dashboard' || activeScreen === 'patients-list' ? (
            <DashboardPage
              patients={patients}
              summary={summary}
              onSelectPatient={handleSelectPatient}
              onRefresh={loadCohortData}
              isLoading={isLoadingPatients}
              onOpenAddPatient={() => setIsAddPatientOpen(true)}
            />
          ) : activeScreen === 'digital-twin' && selectedPatient ? (
            <PatientDigitalTwinPage
              patient={selectedPatient}
              vitalsHistory={selectedPatientHistory}
              prediction={selectedPatientPrediction}
              timeline={selectedPatientTimeline}
              onNavigateTab={(tab) => {
                if (tab === 'trends') setActiveScreen('analysis');
                else if (tab === 'simulation') setActiveScreen('simulation');
                else if (tab === 'risk') setIsAIExplanationOpen(true);
              }}
              onOpenAIExplanation={() => setIsAIExplanationOpen(true)}
              onOpenLogVital={() => setIsLogVitalOpen(true)}
            />
          ) : activeScreen === 'analysis' && selectedPatient ? (
            <PatientAnalysisPage
              patient={selectedPatient}
              timeline={selectedPatientTimeline}
              onNavigateTab={(tab) => {
                if (tab === 'twin') setActiveScreen('digital-twin');
                else if (tab === 'simulation') setActiveScreen('simulation');
                else if (tab === 'risk') setIsAIExplanationOpen(true);
              }}
              onOpenAIExplanation={() => setIsAIExplanationOpen(true)}
            />
          ) : activeScreen === 'simulation' && selectedPatient ? (
            <WhatIfSimulationPage
              patient={selectedPatient}
              onNavigateTab={(tab) => {
                if (tab === 'twin') setActiveScreen('digital-twin');
                else if (tab === 'trends') setActiveScreen('analysis');
                else if (tab === 'risk') setIsAIExplanationOpen(true);
              }}
              onOpenAIExplanation={() => setIsAIExplanationOpen(true)}
              onApplySimulationToTwin={handleApplySimulation}
            />
          ) : (
            <DashboardPage
              patients={patients}
              summary={summary}
              onSelectPatient={handleSelectPatient}
              onRefresh={loadCohortData}
              isLoading={isLoadingPatients}
              onOpenAddPatient={() => setIsAddPatientOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Modals & Slide-out Drawers */}
      <AddPatientModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        onPatientAdded={handlePatientAdded}
      />

      {selectedPatient && (
        <LogVitalModal
          isOpen={isLogVitalOpen}
          onClose={() => setIsLogVitalOpen(false)}
          patient={selectedPatient}
          onVitalLogged={handleVitalLogged}
        />
      )}

      <AlertsDrawer
        isOpen={isAlertsOpen || activeScreen === 'alerts'}
        onClose={() => {
          setIsAlertsOpen(false);
          if (activeScreen === 'alerts') setActiveScreen('dashboard');
        }}
        alerts={alerts}
        onAcknowledge={handleAcknowledgeAlert}
        onSelectPatient={handleSelectPatient}
      />

      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={thresholdConfig}
        onSaveConfig={handleSaveThresholds}
      />

      <AIExplanationModal
        isOpen={isAIExplanationOpen}
        onClose={() => setIsAIExplanationOpen(false)}
        prediction={selectedPatientPrediction}
        patient={selectedPatient}
        vitalsHistory={selectedPatientHistory}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeScreen={activeScreen}
        onNavigate={(screen) => setActiveScreen(screen)}
        selectedPatient={selectedPatient}
        activeAlertsCount={activeAlertsCount}
      />
    </div>
  );
}
