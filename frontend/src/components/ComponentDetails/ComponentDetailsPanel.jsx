import React from 'react';
import { ShieldAlert, GitPullRequest, ArrowDownRight, ArrowUpLeft, Info, Layers } from 'lucide-react';

export default function ComponentDetailsPanel({
  selectedDetails,
  onSimulateFailure,
  onAnalyzeChange,
  onSelectComponent,
  loadingImpact
}) {
  if (!selectedDetails) {
    return (
      <aside className="right-sidebar">
        <div className="panel-section" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <Info size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p style={{ fontSize: '0.85rem' }}>Select any service or component in the graph or search list to inspect dependencies and run impact simulations.</p>
        </div>
      </aside>
    );
  }

  const { component, directDownstream, directUpstream, totalDownstreamCount, totalUpstreamCount } = selectedDetails;

  return (
    <aside className="right-sidebar">
      <div className="panel-section">
        <div className="panel-header">
          <div className="panel-title">
            <Layers size={18} color="var(--accent-service)" />
            <span>{component.name}</span>
          </div>
          <span className={`type-tag ${component.type.toLowerCase()}`}>
            {component.type === 'SERVICE' ? 'API' : component.type}
          </span>
        </div>

        <div className="details-grid">
          <div className="details-stat">
            <div className="details-stat-label">Direct Upstream</div>
            <div className="details-stat-val">{directUpstream.length}</div>
          </div>
          <div className="details-stat">
            <div className="details-stat-label">Direct Downstream</div>
            <div className="details-stat-val">{directDownstream.length}</div>
          </div>
          <div className="details-stat">
            <div className="details-stat-label">Total Upstream Reach</div>
            <div className="details-stat-val">{totalUpstreamCount}</div>
          </div>
          <div className="details-stat">
            <div className="details-stat-label">Total Downstream Blast</div>
            <div className="details-stat-val" style={{ color: 'var(--color-danger)' }}>{totalDownstreamCount}</div>
          </div>
        </div>

        <div className="impact-actions-group">
          <button 
            className="btn btn-danger" 
            onClick={() => onSimulateFailure(component.id)}
            disabled={loadingImpact}
          >
            <ShieldAlert size={15} /> Simulate Failure (Outage)
          </button>
          <button 
            className="btn btn-warning" 
            onClick={() => onAnalyzeChange(component.id)}
            disabled={loadingImpact}
          >
            <GitPullRequest size={15} /> Analyze Change Impact
          </button>
        </div>
      </div>

      <div className="panel-section">
        <div className="dep-subheading" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ArrowUpLeft size={14} /> Upstream Dependencies ({directUpstream.length})
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Components that {component.name} depends on (Providers):
        </p>
        {directUpstream.length === 0 ? (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>None (Root provider / standalone)</div>
        ) : (
          <div className="dep-chips">
            {directUpstream.map((u) => (
              <span key={u.id} className="dep-chip" onClick={() => onSelectComponent(u.id)}>
                {u.name}
              </span>
            ))}
          </div>
        )}

        <div className="dep-subheading" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '16px' }}>
          <ArrowDownRight size={14} /> Downstream Consumers ({directDownstream.length})
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Components consuming {component.name} (Dependents):
        </p>
        {directDownstream.length === 0 ? (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>None (End consumer / leaf application)</div>
        ) : (
          <div className="dep-chips">
            {directDownstream.map((d) => (
              <span key={d.id} className="dep-chip" onClick={() => onSelectComponent(d.id)}>
                {d.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
