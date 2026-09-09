import React from 'react';

export default function Legend({ mode }) {
  return (
    <div className="graph-legend">
      <div className="legend-title">Component Types</div>
      <div className="legend-items">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: 'var(--accent-service)' }}></span>
          <span>Service / API</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: 'var(--accent-app)' }}></span>
          <span>Application</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: 'var(--accent-db)' }}></span>
          <span>Database</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: 'var(--accent-external)' }}></span>
          <span>External System</span>
        </div>
      </div>

      {mode !== 'NORMAL' && (
        <>
          <div className="legend-title" style={{ marginTop: '6px' }}>Impact Status</div>
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#ef4444' }}></span>
              <span>Root Failure / Change</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#f87171' }}></span>
              <span>Direct Impact (1 Hop)</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#fb923c' }}></span>
              <span>Indirect Impact (2+ Hops)</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#818cf8' }}></span>
              <span>Upstream Context</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
