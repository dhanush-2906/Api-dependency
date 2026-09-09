import React from 'react';
import { 
  ShieldAlert, 
  GitPullRequest, 
  AppWindow, 
  Route, 
  RotateCcw,
  ArrowRight
} from 'lucide-react';

export default function ImpactResultsPanel({
  impactData,
  onReset,
  onSelectComponent
}) {
  if (!impactData) return null;

  const isFailure = impactData.mode === 'FAILURE_SIMULATION';
  const { rootComponent, directImpact, indirectImpact, affectedApplications, impactPaths, metrics } = impactData;

  const totalAffected = metrics.totalAffected ?? metrics.totalDependentCount ?? (directImpact.length + indirectImpact.length);
  const blastPercent = metrics.blastRadiusPercent ?? 0;

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
          Source: <strong style={{ color: 'var(--text-primary)' }}>{rootComponent.name}</strong>
        </div>

        {isFailure && (
          <div className="blast-gauge-bar-wrapper">
            <div className="blast-gauge-labels">
              <span>Ecosystem Exposure</span>
              <strong style={{ color: '#f87171' }}>{blastPercent}% Blast Radius</strong>
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
          <div className="stat-box-label">Total Affected Systems</div>
          <div className="stat-box-val" style={{ color: isFailure ? '#ef4444' : '#f59e0b' }}>
            {totalAffected} components
          </div>
        </div>
      </div>

      {/* Affected Client Applications */}
      {affectedApplications && affectedApplications.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--app-color)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <AppWindow size={13} /> Impacted User Applications ({affectedApplications.length})
          </div>
          <div className="interactive-chip-list">
            {affectedApplications.map((app) => (
              <span 
                key={app.id} 
                className="interactive-chip"
                style={{ borderColor: 'rgba(52, 211, 153, 0.4)', color: 'var(--app-color)' }}
                onClick={() => onSelectComponent(app.id)}
              >
                {app.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Explainable Impact Paths */}
      {impactPaths && impactPaths.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
            <Route size={13} /> Explainable Propagation Paths ({impactPaths.length})
          </div>
          <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
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
        <span>Reset Simulation</span>
      </button>
    </div>
  );
}
