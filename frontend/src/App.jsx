import React, { useState, useEffect, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';

import Header from './components/Header/Header';
import MetricCards from './components/Metrics/MetricCards';
import SearchFilterBar from './components/Search/SearchFilterBar';
import DependencyGraph from './components/DependencyGraph/DependencyGraph';
import ComponentDetailsPanel from './components/ComponentDetails/ComponentDetailsPanel';
import ImpactResultsPanel from './components/ImpactPanel/ImpactResultsPanel';
import ValidationModal from './components/Validation/ValidationModal';
import CommandPaletteModal from './components/CommandPalette/CommandPaletteModal';

import {
  getGraphData,
  getComponents,
  getComponentById,
  getMetrics,
  getValidationReport,
  simulateFailure,
  analyzeChangeImpact
} from './services/api';

export default function App() {
  const [components, setComponents] = useState([]);
  const [graphData, setGraphData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [validationReport, setValidationReport] = useState(null);

  const [selectedComponentId, setSelectedComponentId] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');

  const [mode, setMode] = useState('NORMAL'); // 'NORMAL' | 'FAILURE_SIMULATION' | 'CHANGE_IMPACT_ANALYSIS'
  const [impactData, setImpactData] = useState(null);

  const [layoutDirection, setLayoutDirection] = useState('LR');
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Initializing Dependency Topology...');
  const [error, setError] = useState(null);

  // Initial Data Fetch
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [gData, cList, mData, vReport] = await Promise.all([
        getGraphData(),
        getComponents(),
        getMetrics(),
        getValidationReport()
      ]);

      setGraphData(gData);
      setComponents(cList);
      setMetrics(mData);
      setValidationReport(vReport);

      // Default selection to first service if available
      if (cList && cList.length > 0) {
        const firstService = cList.find(c => c.type === 'SERVICE') || cList[0];
        handleSelectComponent(firstService.id);
      }
    } catch (err) {
      console.error('Failed to load initial dataset:', err);
      setError('Failed to connect to backend server. Make sure the backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Global Keyboard Shortcuts (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle component selection
  const handleSelectComponent = useCallback(async (id) => {
    if (!id) return;
    setSelectedComponentId(id);
    try {
      const details = await getComponentById(id);
      setSelectedDetails(details);
    } catch (err) {
      console.error('Failed to load component details:', err);
    }
  }, []);

  // Simulate Failure
  const handleSimulateFailure = async (id) => {
    try {
      setLoadingImpact(true);
      setLoadingMessage('Simulating outage & tracing downstream blast radius...');
      const impact = await simulateFailure(id);
      setImpactData(impact);
      setMode('FAILURE_SIMULATION');
      setSelectedComponentId(id);
    } catch (err) {
      console.error('Failure simulation failed:', err);
    } finally {
      setLoadingImpact(false);
    }
  };

  // Analyze Change Impact
  const handleAnalyzeChange = async (id) => {
    try {
      setLoadingImpact(true);
      setLoadingMessage('Calculating downstream change propagation & validation scope...');
      const impact = await analyzeChangeImpact(id);
      setImpactData(impact);
      setMode('CHANGE_IMPACT_ANALYSIS');
      setSelectedComponentId(id);
    } catch (err) {
      console.error('Change impact analysis failed:', err);
    } finally {
      setLoadingImpact(false);
    }
  };

  // Run Preset Scenario
  const handleRunScenario = (id, scenarioType) => {
    if (scenarioType === 'FAILURE') {
      handleSimulateFailure(id);
    } else {
      handleAnalyzeChange(id);
    }
  };

  // Reset Simulation Mode
  const handleResetSimulation = () => {
    setMode('NORMAL');
    setImpactData(null);
  };

  const handleToggleLayout = () => {
    setLayoutDirection(prev => (prev === 'LR' ? 'TB' : 'LR'));
  };

  if (loading) {
    return (
      <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--brand-primary)', marginBottom: '6px' }}>
            {loadingMessage}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Parsing YAML datasets &amp; building canonical graph model.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '440px', padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ef4444', marginBottom: '8px' }}>
            Unable to Connect to Backend
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>{error}</p>
          <button className="btn btn-primary" onClick={loadInitialData}>
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header
        mode={mode}
        onReset={handleResetSimulation}
        onOpenValidation={() => setIsValidationOpen(true)}
        onOpenPalette={() => setIsPaletteOpen(true)}
        onRunScenario={handleRunScenario}
        validationReport={validationReport}
      />

      <MetricCards
        metrics={metrics}
        onSelectComponent={handleSelectComponent}
      />

      <main className="main-workspace">
        <SearchFilterBar
          components={components}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedType={selectedType}
          onTypeSelect={setSelectedType}
          selectedComponentId={selectedComponentId}
          onSelectComponent={handleSelectComponent}
        />

        <ReactFlowProvider>
          <DependencyGraph
            graphData={graphData}
            selectedComponentId={selectedComponentId}
            selectedDetails={selectedDetails}
            onSelectComponent={handleSelectComponent}
            mode={mode}
            impactData={impactData}
            layoutDirection={layoutDirection}
            onToggleLayout={handleToggleLayout}
          />
        </ReactFlowProvider>

        <aside className="inspector-sidebar">
          <ComponentDetailsPanel
            selectedDetails={selectedDetails}
            onSimulateFailure={handleSimulateFailure}
            onAnalyzeChange={handleAnalyzeChange}
            onSelectComponent={handleSelectComponent}
            loadingImpact={loadingImpact}
          />

          {mode !== 'NORMAL' && impactData && (
            <ImpactResultsPanel
              impactData={impactData}
              onReset={handleResetSimulation}
              onSelectComponent={handleSelectComponent}
            />
          )}
        </aside>
      </main>

      <ValidationModal
        isOpen={isValidationOpen}
        onClose={() => setIsValidationOpen(false)}
        validationReport={validationReport}
      />

      <CommandPaletteModal
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        components={components}
        selectedComponentId={selectedComponentId}
        onSelectComponent={handleSelectComponent}
        onSimulateFailure={handleSimulateFailure}
        onAnalyzeChange={handleAnalyzeChange}
        onResetSimulation={handleResetSimulation}
        onToggleLayout={handleToggleLayout}
        onOpenValidation={() => setIsValidationOpen(true)}
        metrics={metrics}
      />
    </div>
  );
}
