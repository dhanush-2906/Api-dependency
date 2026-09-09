import React from 'react';
import { X, CheckCircle2, AlertTriangle, FileCode } from 'lucide-react';

export default function ValidationModal({ isOpen, onClose, validationReport }) {
  if (!isOpen || !validationReport) return null;

  const { isValid, issues, validRecords } = validationReport;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isValid ? <CheckCircle2 size={20} color="#10b981" /> : <AlertTriangle size={20} color="#f59e0b" />}
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Dataset Integrity &amp; Validation Report</h2>
          </div>
          <button className="btn btn-secondary" style={{ padding: '4px' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Status: <strong style={{ color: isValid ? '#10b981' : '#f59e0b' }}>{isValid ? 'Valid Dataset Ingested' : 'Validation Warnings Found'}</strong>
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Total Valid Files Loaded: {validRecords ? validRecords.length : 0} | Issues Detected: {issues ? issues.length : 0}
            </p>
          </div>

          {issues && issues.length > 0 ? (
            <div>
              <div className="dep-subheading">Reported Validation Warnings</div>
              {issues.map((iss, i) => (
                <div key={i} style={{ padding: '8px 12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '6px', marginBottom: '8px', fontSize: '0.78rem' }}>
                  <strong style={{ color: '#f59e0b' }}>[{iss.code}] {iss.file}:</strong> {iss.message}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', fontSize: '0.8rem', color: '#6ee7b7' }}>
              All YAML files passed syntax, schema, and reference validation checks. Edges and components were normalized into the canonical Provider ? Consumer graph.
            </div>
          )}

          {validRecords && validRecords.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div className="dep-subheading">Loaded Dataset Files</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {validRecords.map((r, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--bg-surface)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                    <FileCode size={13} color="var(--accent-service)" />
                    <span>{r.filename}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
