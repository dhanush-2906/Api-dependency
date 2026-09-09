import React from 'react';

export default function Legend({ mode }) {
  return (
    <div className="floating-graph-legend">
      <span className="legend-section-title">Ecosystem Topology</span>
      <div className="legend-grid-items">
        <div className="legend-item-row">
          <span className="legend-dot-indicator" style={{ background: 'var(--service-color)' }}></span>
          <span>API Service</span>
        </div>
        <div className="legend-item-row">
          <span className="legend-dot-indicator" style={{ background: 'var(--app-color)' }}></span>
          <span>Application</span>
        </div>
        <div className="legend-item-row">
          <span className="legend-dot-indicator" style={{ background: 'var(--db-color)' }}></span>
          <span>Database</span>
        </div>
        <div className="legend-item-row">
          <span className="legend-dot-indicator" style={{ background: 'var(--external-color)' }}></span>
          <span>Gateway</span>
        </div>
      </div>

      {mode === 'FAILURE_SIMULATION' && (
        <>
          <span className="legend-section-title" style={{ marginTop: '4px', color: '#f87171' }}>Outage Blast State</span>
          <div className="legend-grid-items">
            <div className="legend-item-row">
              <span className="legend-dot-indicator" style={{ background: '#ef4444' }}></span>
              <span>Failed Root</span>
            </div>
            <div className="legend-item-row">
              <span className="legend-dot-indicator" style={{ background: '#f87171' }}></span>
              <span>Direct (1 Hop)</span>
            </div>
            <div className="legend-item-row">
              <span className="legend-dot-indicator" style={{ background: '#fb923c' }}></span>
              <span>Indirect (2+ Hops)</span>
            </div>
            <div className="legend-item-row">
              <span className="legend-dot-indicator" style={{ background: '#475569', opacity: 0.5 }}></span>
              <span>Unaffected</span>
            </div>
          </div>
        </>
      )}

      {mode === 'CHANGE_IMPACT_ANALYSIS' && (
        <>
          <span className="legend-section-title" style={{ marginTop: '4px', color: '#fbbf24' }}>Change Propagation</span>
          <div className="legend-grid-items">
            <div className="legend-item-row">
              <span className="legend-dot-indicator" style={{ background: '#f59e0b' }}></span>
              <span>Modified Service</span>
            </div>
            <div className="legend-item-row">
              <span className="legend-dot-indicator" style={{ background: '#fb923c' }}></span>
              <span>Dependent System</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
