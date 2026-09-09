import React, { useState } from 'react';
import { 
  Network, 
  ShieldAlert, 
  GitPullRequest, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  Sparkles,
  Command,
  ChevronDown
} from 'lucide-react';

export default function Header({ 
  mode, 
  onReset, 
  onOpenValidation, 
  onOpenPalette,
  onRunScenario,
  validationReport 
}) {
  const [showScenarios, setShowScenarios] = useState(false);
  const hasIssues = validationReport?.issues?.length > 0;

  const scenarios = [
    {
      id: 'auth-service',
      type: 'FAILURE',
      title: 'Auth Service Outage',
      desc: 'Simulate core identity outage & calculate blast radius'
    },
    {
      id: 'inventory-service',
      type: 'CHANGE',
      title: 'Inventory Service Modification',
      desc: 'Analyze downstream change impact & test scope'
    },
    {
      id: 'product-catalog-service',
      type: 'FAILURE',
      title: 'Product Catalog Failure',
      desc: 'Cascading catalog outage across inventory & pricing'
    },
    {
      id: 'payment-gateway',
      type: 'FAILURE',
      title: 'Payment Gateway Failure',
      desc: 'External gateway disruption to payment & order flow'
    }
  ];

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="brand-icon-wrapper">
          <Network size={18} />
        </div>
        <div className="brand-text">
          <div className="brand-title-row">
            <span className="brand-title">Dependency Intelligence</span>
            <span className="brand-badge">UPS Enterprise</span>
          </div>
          <span className="brand-subtitle">API Topology &amp; Blast Radius Analyzer</span>
        </div>
      </div>

      <div className="header-center">
        {mode === 'NORMAL' && (
          <div className="system-status-indicator normal">
            <span className="status-dot green"></span>
            <span>Ecosystem Operational</span>
          </div>
        )}
        {mode === 'FAILURE_SIMULATION' && (
          <div className="system-status-indicator failure">
            <span className="status-dot red"></span>
            <span>Outage Blast Simulation Active</span>
          </div>
        )}
        {mode === 'CHANGE_IMPACT_ANALYSIS' && (
          <div className="system-status-indicator change">
            <span className="status-dot amber"></span>
            <span>Change Impact Analysis Active</span>
          </div>
        )}
      </div>

      <div className="header-right">
        {/* Quick Demo Scenarios Dropdown */}
        <div style={{ position: 'relative' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowScenarios(!showScenarios)}
            title="Launch preset evaluation scenarios"
          >
            <Sparkles size={13} color="var(--brand-primary)" />
            <span>Demo Scenarios</span>
            <ChevronDown size={12} />
          </button>

          {showScenarios && (
            <div className="scenarios-dropdown-menu">
              <div className="scenarios-header">
                <span>Select Evaluation Scenario</span>
              </div>
              {scenarios.map((sc, i) => (
                <div 
                  key={i} 
                  className="scenario-menu-item"
                  onClick={() => {
                    onRunScenario(sc.id, sc.type);
                    setShowScenarios(false);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {sc.type === 'FAILURE' ? (
                      <ShieldAlert size={13} color="#ef4444" />
                    ) : (
                      <GitPullRequest size={13} color="#f59e0b" />
                    )}
                    <span className="scenario-item-title">{sc.title}</span>
                  </div>
                  <span className="scenario-item-desc">{sc.desc}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Command Palette Button */}
        <button 
          className="btn btn-secondary" 
          onClick={onOpenPalette}
          title="Open Command & Search Palette (Ctrl+K)"
        >
          <Command size={13} />
          <span>Palette</span>
          <span className="search-shortcut-hint" style={{ position: 'static', marginLeft: 4 }}>Ctrl K</span>
        </button>

        {mode !== 'NORMAL' && (
          <button 
            className="btn btn-secondary" 
            onClick={onReset}
            title="Return to normal dependency exploration"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        )}

        <button 
          className="btn btn-secondary"
          onClick={onOpenValidation}
          title="Inspect dataset schema &amp; normalization integrity"
        >
          {hasIssues ? (
            <>
              <AlertTriangle size={13} color="#f59e0b" />
              <span>Warnings ({validationReport.issues.length})</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={13} color="#10b981" />
              <span>Dataset Validated</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
