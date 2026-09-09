import React, { useState, useEffect } from 'react';
import { X, Server, AppWindow, Database, Globe, PlusCircle, Edit3 } from 'lucide-react';
import ComponentSelector from './ComponentSelector';

const COMPONENT_TYPES = [
  { value: 'SERVICE', label: 'Service / API', Icon: Server, color: 'var(--service-color)' },
  { value: 'APPLICATION', label: 'Application', Icon: AppWindow, color: 'var(--app-color)' },
  { value: 'DATABASE', label: 'Database', Icon: Database, color: 'var(--db-color)' },
  { value: 'EXTERNAL', label: 'External', Icon: Globe, color: 'var(--external-color)' }
];

/**
 * ComponentModal — Add or Edit component modal
 * Props:
 *   mode: 'add' | 'edit'
 *   isOpen: boolean
 *   onClose: () => void
 *   onSubmit: (data) => Promise<void>
 *   allComponents: [{id, name, type}]
 *   initialData: { id, name, type, dependencies, consumers } | null
 *   isSubmitting: boolean
 */
export default function ComponentModal({
  mode = 'add',
  isOpen,
  onClose,
  onSubmit,
  allComponents = [],
  initialData = null,
  isSubmitting = false
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState('SERVICE');
  const [dependencies, setDependencies] = useState([]);
  const [consumers, setConsumers] = useState([]);
  const [errors, setErrors] = useState([]);

  // Pre-fill for edit mode
  useEffect(() => {
    if (isOpen && mode === 'edit' && initialData) {
      setName(initialData.name || '');
      setType(initialData.type || 'SERVICE');
      // Get dependency names from directUpstream
      setDependencies(initialData.directUpstream ? initialData.directUpstream.map(u => u.name) : []);
      setConsumers(initialData.directDownstream ? initialData.directDownstream.map(d => d.name) : []);
    } else if (isOpen && mode === 'add') {
      setName('');
      setType('SERVICE');
      setDependencies([]);
      setConsumers([]);
    }
    setErrors([]);
  }, [isOpen, mode, initialData]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = [];
    if (!name.trim()) errs.push('Component name is required.');
    if (name.trim().length < 2) errs.push('Name must be at least 2 characters.');
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    await onSubmit({ name: name.trim(), type, dependencies, consumers });
  };

  const isEdit = mode === 'edit';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel ecosystem-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isEdit
              ? <Edit3 size={16} color="var(--brand-primary)" />
              : <PlusCircle size={16} color="var(--app-color)" />
            }
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
              {isEdit ? `Edit Component` : 'Add New Component'}
            </span>
          </div>
          <button className="btn-icon" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="ecosystem-form">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="form-errors">
              {errors.map((err, i) => (
                <div key={i} className="form-error-item">{err}</div>
              ))}
            </div>
          )}

          {/* Name */}
          <div className="form-group">
            <label className="form-label">Component Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. notification-service"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={isEdit && !initialData?.isUserCreated}
              autoFocus
            />
            {isEdit && !initialData?.isUserCreated && (
              <p className="form-hint">Name cannot be changed for dataset-defined components.</p>
            )}
          </div>

          {/* Type */}
          <div className="form-group">
            <label className="form-label">Component Type *</label>
            <div className="type-selector-grid">
              {COMPONENT_TYPES.map(({ value, label, Icon, color }) => (
                <button
                  key={value}
                  type="button"
                  className={`type-selector-card ${type === value ? 'selected' : ''}`}
                  onClick={() => setType(value)}
                  style={{ '--type-color': color }}
                >
                  <Icon size={18} color={type === value ? color : 'var(--text-muted)'} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dependencies (upstream providers) */}
          <div className="form-group">
            <label className="form-label">
              Dependencies
              <span className="form-label-hint">Services this component depends on (upstream)</span>
            </label>
            <ComponentSelector
              allComponents={allComponents}
              selected={dependencies}
              onChange={setDependencies}
              excludeId={isEdit ? initialData?.id : null}
              placeholder="Pick upstream providers..."
            />
          </div>

          {/* Consumers (downstream) */}
          <div className="form-group">
            <label className="form-label">
              Consumers
              <span className="form-label-hint">Services that depend on this component (downstream)</span>
            </label>
            <ComponentSelector
              allComponents={allComponents}
              selected={consumers}
              onChange={setConsumers}
              excludeId={isEdit ? initialData?.id : null}
              placeholder="Pick downstream consumers..."
            />
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting
                ? (isEdit ? 'Saving...' : 'Adding...')
                : (isEdit ? 'Save Changes' : 'Add Component')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
