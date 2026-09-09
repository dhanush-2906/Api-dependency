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
import ComponentModal from './components/Ecosystem/ComponentModal';
import DeleteConfirmModal from './components/Ecosystem/DeleteConfirmModal';
import MutationToast from './components/Ecosystem/MutationToast';
import AiCopilotDrawer from './components/Copilot/AiCopilotDrawer';
import AiCopilotTrigger from './components/Copilot/AiCopilotTrigger';

import {
  getGraphData,
  getComponents,
  getComponentById,
  getMetrics,
  getValidationReport,
  simulateFailure,
  analyzeChangeImpact,
  createComponent,
  updateComponent,
  deleteComponent,
  resetEcosystem
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
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Initializing Dependency Topology...');
  const [error, setError] = useState(null);

  // ─── Ecosystem CRUD State ──────────────────────────────────────────────────
  const [ecosystemModal, setEcosystemModal] = useState({ open: false, mode: 'add', initialData: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, details: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => setToast({ type, message });
  const dismissToast = () => setToast(null);

  // ─── Initial Data Fetch ────────────────────────────────────────────────────
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

  /**
   * Refresh all ecosystem data after a CRUD or AI mutation (no page reload).
   * Optionally selects a specific component ID after refresh.
   */
  const refreshEcosystem = useCallback(async (selectId = null) => {
    try {
      const [gData, cList, mData] = await Promise.all([
        getGraphData(),
        getComponents(),
        getMetrics()
      ]);
      setGraphData(gData);
      setComponents(cList);
      setMetrics(mData);
      setImpactData(null);
      setMode('NORMAL');

      if (selectId) {
        await handleSelectComponent(selectId);
      } else if (selectedComponentId) {
        // Re-fetch details for current selection (topology may have changed)
        try {
          const details = await getComponentById(selectedComponentId);
          setSelectedDetails(details);
        } catch {
          setSelectedDetails(null);
          setSelectedComponentId(null);
        }
      }
    } catch (err) {
      console.error('Failed to refresh ecosystem:', err);
    }
  }, [selectedComponentId]);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Global Keyboard Shortcuts (Ctrl+K / Cmd+K for Palette, Ctrl+J / Cmd+J for AI Copilot)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setIsCopilotOpen(prev => !prev);
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

  // ─── Ecosystem CRUD Handlers ───────────────────────────────────────────────

  const handleOpenAddModal = () => {
    setEcosystemModal({ open: true, mode: 'add', initialData: null });
  };

  const handleOpenEditModal = (details) => {
    setEcosystemModal({ open: true, mode: 'edit', initialData: details });
  };

  const handleCloseEcosystemModal = () => {
    setEcosystemModal(prev => ({ ...prev, open: false }));
  };

  const handleCreateComponent = async (formData) => {
    setIsSubmitting(true);
    try {
      const result = await createComponent(formData);
      handleCloseEcosystemModal();
      showToast('success', `"${result.component.name}" added to ecosystem.`);
      await refreshEcosystem(result.component.id);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0] || 'Failed to create component.';
      showToast('error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComponent = async (formData) => {
    if (!ecosystemModal.initialData?.component) return;
    const id = ecosystemModal.initialData.component.id;
    setIsSubmitting(true);
    try {
      const result = await updateComponent(id, formData);
      handleCloseEcosystemModal();
      showToast('success', `"${result.component.name}" updated successfully.`);
      await refreshEcosystem(result.component.id);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0] || 'Failed to update component.';
      showToast('error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteModal = (details) => {
    setDeleteModal({ open: true, details });
  };

  const handleCloseDeleteModal = () => {
    setDeleteModal({ open: false, details: null });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.details) return;
    const { component } = deleteModal.details;
    setIsDeleting(true);
    try {
      await deleteComponent(component.id);
      handleCloseDeleteModal();
      showToast('success', `"${component.name}" removed from ecosystem.`);
      setSelectedDetails(null);
      setSelectedComponentId(null);
      await refreshEcosystem(null);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to delete component.';
      showToast('error', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetEcosystem = async () => {
    try {
      await resetEcosystem();
      showToast('success', 'Ecosystem reset to seed dataset.');
      setSelectedDetails(null);
      setSelectedComponentId(null);
      await refreshEcosystem(null);
    } catch (err) {
      showToast('error', 'Failed to reset ecosystem.');
    }
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
        onResetEcosystem={handleResetEcosystem}
        onOpenCopilot={() => setIsCopilotOpen(prev => !prev)}
        isCopilotOpen={isCopilotOpen}
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
          onAddComponent={handleOpenAddModal}
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
            onEditComponent={handleOpenEditModal}
            onDeleteComponent={handleOpenDeleteModal}
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

      {/* ─── Ecosystem Management Modals ─────────────────────────────── */}
      <ComponentModal
        mode={ecosystemModal.mode}
        isOpen={ecosystemModal.open}
        onClose={handleCloseEcosystemModal}
        onSubmit={ecosystemModal.mode === 'add' ? handleCreateComponent : handleUpdateComponent}
        allComponents={components}
        initialData={ecosystemModal.initialData}
        isSubmitting={isSubmitting}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        componentName={deleteModal.details?.component?.name || ''}
        isDeleting={isDeleting}
        downstreamCount={deleteModal.details?.totalDownstreamCount || 0}
      />

      {/* ─── AI Architecture Copilot Drawer & Launcher ───────────────── */}
      <AiCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        selectedComponentId={selectedComponentId}
        selectedDetails={selectedDetails}
        mode={mode}
        impactData={impactData}
        onSelectComponent={handleSelectComponent}
        onRefreshEcosystem={refreshEcosystem}
      />

      <AiCopilotTrigger
        isOpen={isCopilotOpen}
        onToggle={() => setIsCopilotOpen(true)}
      />

      <MutationToast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
