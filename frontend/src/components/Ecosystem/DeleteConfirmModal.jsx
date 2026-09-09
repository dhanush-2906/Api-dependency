import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

/**
 * DeleteConfirmModal — confirmation dialog before deleting a component
 * Props:
 *   isOpen: boolean
 *   onClose: () => void
 *   onConfirm: () => void
 *   componentName: string
 *   isDeleting: boolean
 *   downstreamCount: number — how many components will be affected
 */
export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  componentName = '',
  isDeleting = false,
  downstreamCount = 0
}) {
  if (!isOpen) return null;

  const hasImpact = downstreamCount > 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-panel"
        style={{ maxWidth: 420 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trash2 size={15} color="#ef4444" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              Delete Component
            </span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            You are about to permanently remove{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{componentName}</strong>{' '}
            from the ecosystem.
          </p>

          {hasImpact && (
            <div
              style={{
                marginTop: 14,
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8
              }}
            >
              <AlertTriangle size={15} color="#fbbf24" style={{ marginTop: 1, flexShrink: 0 }} />
              <p style={{ fontSize: '0.78rem', color: '#fbbf24', lineHeight: 1.5 }}>
                <strong>{downstreamCount}</strong> downstream component{downstreamCount !== 1 ? 's' : ''} depend on this.
                Removing it will disconnect those edges from the graph.
              </p>
            </div>
          )}

          <p style={{ marginTop: 14, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            This action cannot be undone unless you reset the ecosystem to its seed state.
          </p>
        </div>

        <div className="form-actions" style={{ padding: '16px 20px 20px' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={isDeleting}>
            Cancel
          </button>
          <button
            className="btn"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              fontWeight: 600
            }}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Component'}
          </button>
        </div>
      </div>
    </div>
  );
}
