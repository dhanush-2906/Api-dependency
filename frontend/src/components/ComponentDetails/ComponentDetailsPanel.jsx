import React from 'react';
import { 
  ShieldAlert, 
  GitPullRequest, 
  ArrowDownRight, 
  ArrowUpLeft, 
  Info, 
  Layers,
  FileCode,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function ComponentDetailsPanel({
  selectedDetails,
  onSimulateFailure,
  onAnalyzeChange,
  onSelectComponent,
  loadingImpact
}) {
  if (!selectedDetails) {
    return (
      <div className="inspector-section" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
        <Layers size={28} style={{ opacity: 0.3, marginBottom: 10 }} />
        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
          Select a Component
        </h4>
        <p style={{ fontSize: '0.74rem' }}>
          Click any node on the canvas or select from the navigator to inspect its upstream providers, downstream dependents, and run impact simulations.
        </p>
      </div>
    );
  }

  const { component, directDownstream, directUpstream, totalDownstreamCount, totalUpstreamCount } = selectedDetails;

  return (
    <div className="inspector-section">
      <div className="inspector-section-header">
        <div className="inspector-title-group">
          <Layers size={16} color="var(--brand-primary)" />
          <span className="inspector-title">{component.name}</span>
        </div>
        <span className={`nav-item-type-badge ${component.type.toLowerCase()}`}>
          {component.type === 'SERVICE' ? 'API' : component.type}
        </span>
      </div>

      <div className="inspector-stat-grid">
        <div className="stat-box">
          <div className="stat-box-label">Direct Upstream</div>
          <div className="stat-box-val">{directUpstream.length}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Direct Downstream</div>
          <div className="stat-box-val">{directDownstream.length}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Transitive Upstream</div>
          <div className="stat-box-val">{totalUpstreamCount}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Transitive Blast</div>
          <div className="stat-box-val" style={{ color: totalDownstreamCount > 0 ? '#f87171' : 'var(--text-primary)' }}>
            {totalDownstreamCount}
          </div>
        </div>
      </div>

      {component.sourceFile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 12 }}>
          <FileCode size={12} color="var(--brand-primary)" />
          <span>Defined in: <code>{component.sourceFile}</code></span>
        </div>
      )}

      {/* Hero Action Buttons */}
      <div className="hero-action-buttons">
        <button 
          className="hero-action-btn outage"
          onClick={() => onSimulateFailure(component.id)}
          disabled={loadingImpact}
        >
          <ShieldAlert size={18} style={{ marginTop: 2 }} />
          <div className="hero-action-btn-text">
            <h4>Simulate Outage</h4>
            <p>Calculate downstream blast radius &amp; consumer impact</p>
          </div>
        </button>

        <button 
          className="hero-action-btn change"
          onClick={() => onAnalyzeChange(component.id)}
          disabled={loadingImpact}
        >
          <GitPullRequest size={18} style={{ marginTop: 2 }} />
          <div className="hero-action-btn-text">
            <h4>Analyze Change Impact</h4>
            <p>Identify dependent systems requiring validation</p>
          </div>
        </button>
      </div>

      {/* Upstream / Downstream Neighborhood */}
      <div style={{ marginTop: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <ArrowUpLeft size={13} /> Upstream Providers ({directUpstream.length})
        </div>
        <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2, marginBottom: 6 }}>
          Services/databases that {component.name} relies on:
        </p>
        {directUpstream.length === 0 ? (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>None (Root provider)</div>
        ) : (
          <div className="interactive-chip-list">
            {directUpstream.map((u) => (
              <span key={u.id} className="interactive-chip" onClick={() => onSelectComponent(u.id)}>
                {u.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <ArrowDownRight size={13} /> Downstream Dependents ({directDownstream.length})
        </div>
        <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2, marginBottom: 6 }}>
          Services/applications consuming {component.name}:
        </p>
        {directDownstream.length === 0 ? (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>None (End consumer / leaf)</div>
        ) : (
          <div className="interactive-chip-list">
            {directDownstream.map((d) => (
              <span key={d.id} className="interactive-chip" onClick={() => onSelectComponent(d.id)}>
                {d.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
