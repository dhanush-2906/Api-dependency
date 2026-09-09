import React from 'react';
import { X, CheckCircle2, AlertTriangle, FileCode, Check } from 'lucide-react';

export default function ValidationModal({ isOpen, onClose, validationReport }) {
  if (!isOpen || !validationReport) return null;

  const { isValid, issues, validRecords } = validationReport;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isValid ? (
              <CheckCircle2 size={18} color="#10b981" />
            ) : (
              <AlertTriangle size={18} color="#f59e0b" />
            )}
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Dataset Integrity &amp; Normalization Report
            </h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body-content">
          <div style={{ padding: '12px 14px', background: isValid ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)', border: `1px solid ${isValid ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`, borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: isValid ? '#34d399' : '#fbbf24', marginBottom: 2 }}>
              {isValid ? 'All Schema & Reference Validations Passed' : 'Validation Warnings Surfaced'}
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              Total Files Ingested: {validRecords ? validRecords.length : 0} | Issues Detected: {issues ? issues.length : 0}
            </p>
          </div>

          {issues && issues.length > 0 ? (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
                Reported Issues
              </div>
              {issues.map((iss, i) => (
                <div key={i} style={{ padding: '8px 10px', background: 'var(--bg-surface-raised)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-sm)', marginBottom: 6, fontSize: '0.75rem' }}>
                  <strong style={{ color: '#f59e0b' }}>[{iss.code}] {iss.file}:</strong> {iss.message}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
              The YAML dependency dataset has been normalized into the canonical <code>Provider ? Consumer</code> model. All bidirectional dependencies and consumer relationships have been deduplicated without altering the underlying source files.
            </div>
          )}

          {validRecords && validRecords.length > 0 && (
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
                Loaded Authoritative YAML Files
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {validRecords.map((r, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'var(--bg-surface-raised)', padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                    <FileCode size={12} color="var(--brand-primary)" />
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
