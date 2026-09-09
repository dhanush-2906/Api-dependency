import React from 'react';
import { 
  ShieldAlert, 
  GitPullRequest, 
  ArrowDownRight, 
  ArrowUpLeft, 
  Layers,
  FileCode,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  Edit3,
  Trash2,
  Sparkles
} from 'lucide-react';

export default function ComponentDetailsPanel({
  selectedDetails,
  onSimulateFailure,
  onAnalyzeChange,
  onSelectComponent,
  onEditComponent,
  onDeleteComponent,
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

  // Calculate Exposure Risk Badge
  let exposureLabel = 'Low Exposure';
  let exposureColor = 'var(--app-color)';
  let exposureBg = 'var(--app-bg)';
  let exposureBorder = 'var(--app-border)';

  if (totalDownstreamCount >= 5) {
    exposureLabel = 'High Blast Exposure';
    exposureColor = '#f87171';
    exposureBg = 'rgba(239, 68, 68, 0.15)';
    exposureBorder = 'rgba(239, 68, 68, 0.4)';
  } else if (totalDownstreamCount >= 2) {
    exposureLabel = 'Moderate Exposure';
    exposureColor = '#fbbf24';
    exposureBg = 'rgba(245, 158, 11, 0.15)';
    exposureBorder = 'rgba(245, 158, 11, 0.4)';
  }

  return (
    <div className="inspector-section">
      <div className="inspector-section-header">
        <div className="inspector-title-group">
          <Layers size={16} color="var(--brand-primary)" />
          <span className="inspector-title">{component.name}</span>
          {component.isUserCreated && (
            <span
              title="User-created component"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(52, 211, 153, 0.12)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                color: 'var(--app-color)',
                fontSize: '0.62rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              <Sparkles size={9} />
              Custom
            </span>
          )}
        </div>
        <span className={`nav-item-type-badge ${component.type.toLowerCase()}`}>
          {component.type === 'SERVICE' ? 'API' : component.type}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 5, 
            padding: '2px 8px', 
            borderRadius: 'var(--radius-sm)', 
            background: exposureBg, 
            border: `1px solid ${exposureBorder}`,
            color: exposureColor,
            fontSize: '0.68rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}
        >
          {totalDownstreamCount >= 5 ? <AlertCircle size={11} /> : <ShieldCheck size={11} />}
          <span>{exposureLabel}</span>
        </div>

        {component.sourceFile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            <FileCode size={11} color="var(--brand-primary)" />
            <span><code>{component.sourceFile}</code></span>
          </div>
        )}
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

      {/* Hero Action Buttons with Microcopy */}
      <div className="hero-action-buttons">
        <button 
          className="hero-action-btn outage"
          onClick={() => onSimulateFailure(component.id)}
          disabled={loadingImpact}
          title="Trace downstream dependencies and identify potentially affected systems"
        >
          <ShieldAlert size={18} style={{ marginTop: 2, flexShrink: 0 }} />
          <div className="hero-action-btn-text">
            <h4>Simulate Outage</h4>
            <p>Trace downstream dependencies and identify potentially affected systems.</p>
          </div>
        </button>

        <button 
          className="hero-action-btn change"
          onClick={() => onAnalyzeChange(component.id)}
          disabled={loadingImpact}
          title="Identify downstream systems that may require validation after a change"
        >
          <GitPullRequest size={18} style={{ marginTop: 2, flexShrink: 0 }} />
          <div className="hero-action-btn-text">
            <h4>Analyze Change Impact</h4>
            <p>Identify downstream systems that may require validation after a change.</p>
          </div>
        </button>
      </div>

      {/* Ecosystem Management Actions */}
      {(onEditComponent || onDeleteComponent) && (
        <div className="ecosystem-action-row">
          {onEditComponent && (
            <button
              className="ecosystem-action-btn edit"
              onClick={() => onEditComponent(selectedDetails)}
              title="Edit this component's type and connections"
            >
              <Edit3 size={13} />
              <span>Edit</span>
            </button>
          )}
          {onDeleteComponent && (
            <button
              className="ecosystem-action-btn delete"
              onClick={() => onDeleteComponent(selectedDetails)}
              title="Remove this component from the ecosystem"
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
          )}
        </div>
      )}

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
              <span key={u.id} className="interactive-chip" onClick={() => onSelectComponent(u.id)} title="Click to inspect this provider">
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
              <span key={d.id} className="interactive-chip" onClick={() => onSelectComponent(d.id)} title="Click to inspect this dependent">
                {d.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
