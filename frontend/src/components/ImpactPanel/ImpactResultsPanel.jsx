import React from 'react';
import { ShieldAlert, GitPullRequest, AlertCircle, AppWindow, Route, RefreshCw } from 'lucide-react';

export default function ImpactResultsPanel({
  impactData,
  onReset,
  onSelectComponent
}) {
  if (!impactData) return null;

  const isFailure = impactData.mode === 'FAILURE_SIMULATION';
  const { rootComponent, directImpact, indirectImpact, affectedApplications, impactPaths, metrics } = impactData;

  return (
    <div className="panel-section" style={{ background: '#0b1120', borderTop: '1px solid var(--border-color)' }}>
      <div className={`impact-banner ${isFailure ? 'failure' : 'change'}`}>
        <div className="impact-banner-title">
          {isFailure ? <ShieldAlert size={16} color="#ef4444" /> : <GitPullRequest size={16} color="#f59e0b" />}
          <span>{isFailure ? 'Simulated Outage Blast Radius' : 'Change Impact Analysis'}</span>
        </div>
        <div className="impact-banner-desc">
          Root: <strong>{rootComponent.name}</strong>
        </div>
      </div>

      <div className="details-grid" style={{ marginBottom: '12px' }}>
        <div className="details-stat">
          <div className="details-stat-label">Direct Impact</div>
          <div className="details-stat-val">{metrics.directCount ?? metrics.directDependentCount ?? directImpact.length}</div>
        </div>
        <div className="details-stat">
          <div className="details-stat-label">Indirect Impact</div>
          <div className="details-stat-val">{metrics.indirectCount ?? metrics.indirectDependentCount ?? indirectImpact.length}</div>
        </div>
        <div className="details-stat">
          <div className="details-stat-label">Total Affected</div>
          <div className="details-stat-val" style={{ color: isFailure ? 'var(--color-danger)' : 'var(--color-warning)' }}>
            {metrics.totalAffected ?? metrics.totalDependentCount ?? (directImpact.length + indirectImpact.length)}
          </div>
        </div>
        {metrics.blastRadiusPercent !== undefined && (
          <div className="details-stat">
            <div className="details-stat-label">Ecosystem Blast %</div>
            <div className="details-stat-val" style={{ color: 'var(--accent-service)' }}>
              {metrics.blastRadiusPercent}%
            </div>
          </div>
        )}
      </div>

      {affectedApplications && affectedApplications.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div className="dep-subheading" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-app)' }}>
            <AppWindow size={14} /> Affected Applications ({affectedApplications.length})
          </div>
          <div className="dep-chips">
            {affectedApplications.map((app) => (
              <span key={app.id} className="dep-chip" style={{ borderColor: 'var(--accent-app)', color: 'var(--accent-app)' }} onClick={() => onSelectComponent(app.id)}>
                {app.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {impactPaths && impactPaths.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div className="dep-subheading" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Route size={14} /> Explainable Impact Paths ({impactPaths.length})
          </div>
          <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
            {impactPaths.map((p, idx) => (
              <div key={idx} className="impact-path-item" title={p.pathString}>
                <span>{p.pathString}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={onReset}>
        <RefreshCw size={14} /> Reset Analysis
      </button>
    </div>
  );
}
