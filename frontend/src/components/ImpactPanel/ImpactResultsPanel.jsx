import React, { useState } from 'react';
import { 
  ShieldAlert, 
  GitPullRequest, 
  AppWindow, 
  Route, 
  RotateCcw,
  ArrowRight,
  HelpCircle,
  X,
  ChevronDown,
  ChevronUp,
  Server
} from 'lucide-react';

export default function ImpactResultsPanel({
  impactData,
  onReset,
  onSelectComponent
}) {
  const [selectedWhyTarget, setSelectedWhyTarget] = useState(null);

  if (!impactData) return null;

  const isFailure = impactData.mode === 'FAILURE_SIMULATION';
  const { 
    rootComponent, 
    directImpact, 
    indirectImpact, 
    affectedApplications, 
    affectedServices,
    impactPaths, 
    metrics 
  } = impactData;

  const totalAffected = metrics.totalAffected ?? metrics.totalDependentCount ?? (directImpact.length + indirectImpact.length);
  const blastPercent = metrics.blastRadiusPercent ?? 0;

  // Find shortest/first path for a specific target component from existing impactPaths
  const getPathForTarget = (targetId) => {
    if (!impactPaths) return null;
    return impactPaths.find(p => p.targetId === targetId || p.nodeIds[p.nodeIds.length - 1] === targetId);
  };

  const handleWhyClick = (e, compId) => {
    e.stopPropagation();
    if (selectedWhyTarget === compId) {
      setSelectedWhyTarget(null);
    } else {
      setSelectedWhyTarget(compId);
    }
  };

  return (
    <div className="inspector-section" style={{ background: '#090e1a', borderTop: '1px solid var(--border-strong)' }}>
      <div className={`impact-hero-banner ${isFailure ? 'outage' : 'change'}`}>
        <div className="impact-hero-header">
          <div className="impact-hero-title" style={{ color: isFailure ? '#f87171' : '#fbbf24' }}>
            {isFailure ? <ShieldAlert size={16} /> : <GitPullRequest size={16} />}
            <span>{isFailure ? 'Outage Blast Radius Analysis' : 'Change Impact Analysis'}</span>
          </div>
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          {isFailure ? 'Failed Root' : 'Modified Source'}: <strong style={{ color: 'var(--text-primary)' }}>{rootComponent.name}</strong>
        </div>

        {isFailure && (
          <div className="blast-gauge-bar-wrapper">
            <div className="blast-gauge-labels">
              <span>Ecosystem Blast Radius</span>
              <strong style={{ color: '#f87171' }}>{blastPercent}% Exposure</strong>
            </div>
            <div className="blast-gauge-track">
              <div 
                className="blast-gauge-fill red" 
                style={{ width: `${Math.max(5, blastPercent)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="inspector-stat-grid" style={{ marginBottom: 12 }}>
        <div className="stat-box">
          <div className="stat-box-label">Direct Impact</div>
          <div className="stat-box-val" style={{ color: isFailure ? '#f87171' : '#fbbf24' }}>
            {metrics.directCount ?? metrics.directDependentCount ?? directImpact.length}
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Indirect Impact</div>
          <div className="stat-box-val" style={{ color: '#fb923c' }}>
            {metrics.indirectCount ?? metrics.indirectDependentCount ?? indirectImpact.length}
          </div>
        </div>
        <div className="stat-box" style={{ gridColumn: 'span 2' }}>
          <div className="stat-box-label">Total Affected Components</div>
          <div className="stat-box-val" style={{ color: isFailure ? '#ef4444' : '#f59e0b' }}>
            {totalAffected} systems
          </div>
        </div>
      </div>

      {/* Affected Client Applications with "Why?" Explanation */}
      {affectedApplications && affectedApplications.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--app-color)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
            <AppWindow size={13} /> User-Facing Applications Impacted ({affectedApplications.length})
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {affectedApplications.map((app) => {
              const appPath = getPathForTarget(app.id);
              const isWhyOpen = selectedWhyTarget === app.id;

              return (
                <div 
                  key={app.id} 
                  style={{ 
                    background: 'var(--bg-surface-raised)', 
                    border: '1px solid var(--border-default)', 
                    borderRadius: 'var(--radius-md)', 
                    padding: '6px 10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span 
                      style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--app-color)', cursor: 'pointer' }}
                      onClick={() => onSelectComponent(app.id)}
                      title="Click to focus on application"
                    >
                      {app.name}
                    </span>

                    <button 
                      className="btn-why-explanation"
                      onClick={(e) => handleWhyClick(e, app.id)}
                      title="Explain why this application is impacted"
                    >
                      <HelpCircle size={11} />
                      <span>Why?</span>
                      {isWhyOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    </button>
                  </div>

                  {/* Expanded "Why?" Path Explanation */}
                  {isWhyOpen && appPath && (
                    <div className="why-path-container">
                      <div className="why-path-header">
                        <span>Propagation Chain from {rootComponent.name}:</span>
                      </div>
                      <div className="path-chain-nodes">
                        {appPath.nodeNames.map((nodeName, nIdx) => (
                          <React.Fragment key={nIdx}>
                            <span 
                              className={`path-step-badge ${nIdx === 0 ? 'root' : ''}`}
                              onClick={() => onSelectComponent(appPath.nodeIds[nIdx])}
                              style={{ cursor: 'pointer' }}
                              title="Click to focus on this step"
                            >
                              {nodeName}
                            </span>
                            {nIdx < appPath.nodeNames.length - 1 && (
                              <ArrowRight size={10} color="var(--text-muted)" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Explainable Impact Propagation Paths */}
      {impactPaths && impactPaths.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
            <Route size={13} /> Complete Propagation Paths ({impactPaths.length})
          </div>
          <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {impactPaths.map((pathObj, idx) => (
              <div 
                key={idx} 
                className="dependency-path-card"
                onClick={() => onSelectComponent(pathObj.targetId)}
                title={`Click to focus target: ${pathObj.nodeNames[pathObj.nodeNames.length - 1]}`}
              >
                <div className="path-chain-nodes">
                  {pathObj.nodeNames.map((name, nIdx) => (
                    <React.Fragment key={nIdx}>
                      <span className={`path-step-badge ${nIdx === 0 ? 'root' : ''}`}>
                        {name}
                      </span>
                      {nIdx < pathObj.nodeNames.length - 1 && (
                        <ArrowRight size={10} color="var(--text-muted)" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button 
        className="btn btn-secondary" 
        style={{ width: '100%', padding: '8px' }} 
        onClick={onReset}
      >
        <RotateCcw size={13} />
        <span>Reset Analysis</span>
      </button>
    </div>
  );
}
