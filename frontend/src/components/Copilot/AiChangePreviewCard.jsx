import React, { useState } from 'react';
import { 
  CheckCircle2, 
  X, 
  AlertTriangle, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  ArrowRight, 
  ShieldAlert,
  Layers,
  Server,
  AppWindow,
  Database,
  Globe
} from 'lucide-react';

export default function AiChangePreviewCard({
  proposedChange,
  operation,
  payload,
  onConfirm,
  onCancel,
  isExecuting = false
}) {
  const [executed, setExecuted] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  if (!proposedChange) return null;

  const action = proposedChange.action || 'MUTATION';
  const isDelete = action === 'DELETE';
  const isCreate = action === 'CREATE';
  const isAddDep = action === 'ADD_DEPENDENCY';
  const isAddCons = action === 'ADD_CONSUMER';

  const handleConfirm = async () => {
    setExecuted(true);
    await onConfirm({ operation, payload });
  };

  const handleCancel = () => {
    setCancelled(true);
    if (onCancel) onCancel();
  };

  if (cancelled) {
    return (
      <div className="ai-change-card cancelled">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.78rem' }}>
          <X size={14} />
          <span>Proposed change was cancelled.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`ai-change-card ${isDelete ? 'destructive' : ''} ${executed ? 'executed' : ''}`}>
      {/* Card Header */}
      <div className="ai-change-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isCreate && <PlusCircle size={15} color="var(--app-color)" />}
          {isDelete && <Trash2 size={15} color="#ef4444" />}
          {(isAddDep || isAddCons || action === 'UPDATE') && <Edit3 size={15} color="var(--brand-primary)" />}
          
          <span className="ai-change-card-title">
            {proposedChange.title || `${action} Component`}
          </span>
        </div>

        <span className={`ai-change-badge ${action.toLowerCase()}`}>
          {action}
        </span>
      </div>

      {/* Card Body */}
      <div className="ai-change-card-body">
        {/* CREATE Body */}
        {isCreate && proposedChange.component && (
          <div className="ai-change-grid">
            <div className="ai-change-field">
              <span className="ai-field-label">Component Name</span>
              <span className="ai-field-val strong">{proposedChange.component.name}</span>
            </div>
            <div className="ai-change-field">
              <span className="ai-field-label">Type</span>
              <span className="ai-field-val type-badge">{proposedChange.component.type}</span>
            </div>
            <div className="ai-change-field full-width">
              <span className="ai-field-label">Upstream Dependencies</span>
              <div className="ai-chip-wrap">
                {proposedChange.component.dependencies && proposedChange.component.dependencies.length > 0 ? (
                  proposedChange.component.dependencies.map((dep, idx) => (
                    <span key={idx} className="ai-preview-chip provider">{dep}</span>
                  ))
                ) : (
                  <span className="ai-preview-none">None (Root Provider)</span>
                )}
              </div>
            </div>
            <div className="ai-change-field full-width">
              <span className="ai-field-label">Downstream Consumers</span>
              <div className="ai-chip-wrap">
                {proposedChange.component.consumers && proposedChange.component.consumers.length > 0 ? (
                  proposedChange.component.consumers.map((cons, idx) => (
                    <span key={idx} className="ai-preview-chip consumer">{cons}</span>
                  ))
                ) : (
                  <span className="ai-preview-none">None (Leaf Consumer)</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DELETE Body */}
        {isDelete && (
          <div className="ai-delete-impact-box">
            <div className="ai-risk-banner">
              <ShieldAlert size={16} color="#ef4444" />
              <span>Risk Level: <strong>{proposedChange.riskLevel || 'HIGH'}</strong></span>
            </div>

            <div className="ai-delete-stats">
              <div className="ai-delete-stat-item">
                <span className="stat-num">{proposedChange.severedConnectionsCount || 0}</span>
                <span className="stat-lbl">Severed Edges</span>
              </div>
              <div className="ai-delete-stat-item">
                <span className="stat-num" style={{ color: '#f87171' }}>{proposedChange.affectedDownstreamCount || 0}</span>
                <span className="stat-lbl">Affected Systems</span>
              </div>
              <div className="ai-delete-stat-item">
                <span className="stat-num">{proposedChange.affectedApplications ? proposedChange.affectedApplications.length : 0}</span>
                <span className="stat-lbl">Impacted Apps</span>
              </div>
            </div>

            {proposedChange.affectedApplications && proposedChange.affectedApplications.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <span className="ai-field-label">Impacted User Applications:</span>
                <div className="ai-chip-wrap" style={{ marginTop: 4 }}>
                  {proposedChange.affectedApplications.map((app, i) => (
                    <span key={i} className="ai-preview-chip app-impact">{app}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ADD DEPENDENCY / CONSUMER Body */}
        {(isAddDep || isAddCons) && (
          <div className="ai-relationship-preview">
            <div className="ai-rel-node">{proposedChange.providerName}</div>
            <div className="ai-rel-arrow">
              <span className="ai-rel-arrow-lbl">Provider → Consumer</span>
              <ArrowRight size={14} color="var(--brand-primary)" />
            </div>
            <div className="ai-rel-node">{proposedChange.consumerName}</div>
          </div>
        )}
      </div>

      {/* Card Actions */}
      {!executed ? (
        <div className="ai-change-card-footer">
          <button 
            type="button" 
            className="ai-btn-cancel" 
            onClick={handleCancel}
            disabled={isExecuting}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className={`ai-btn-confirm ${isDelete ? 'danger' : 'primary'}`}
            onClick={handleConfirm}
            disabled={isExecuting}
          >
            {isExecuting ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="ai-spinner" /> Applying Change...
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={13} /> Confirm &amp; Apply
              </span>
            )}
          </button>
        </div>
      ) : (
        <div className="ai-change-card-success">
          <CheckCircle2 size={14} color="var(--app-color)" />
          <span>Change applied to live topology</span>
        </div>
      )}
    </div>
  );
}
