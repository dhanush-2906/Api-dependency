import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Check, ChevronDown } from 'lucide-react';

/**
 * ComponentSelector — searchable multi-select for choosing components
 * Props:
 *   allComponents: [{id, name, type}]  - all available components
 *   selected: string[]                  - array of component names (strings)
 *   onChange: (names: string[]) => void
 *   excludeId: string                   - component ID to exclude from list (self)
 *   placeholder: string
 */
export default function ComponentSelector({
  allComponents = [],
  selected = [],
  onChange,
  excludeId = null,
  placeholder = 'Select components...'
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);

  const available = allComponents.filter(c => {
    if (excludeId && c.id === excludeId) return false;
    return true;
  });

  const filtered = available.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  const isSelected = (name) => selected.includes(name);

  const toggle = (name) => {
    if (isSelected(name)) {
      onChange(selected.filter(n => n !== name));
    } else {
      onChange([...selected, name]);
    }
  };

  const removeTag = (name) => {
    onChange(selected.filter(n => n !== name));
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="comp-selector" ref={wrapperRef}>
      <div
        className={`comp-selector-trigger ${open ? 'focused' : ''}`}
        onClick={() => setOpen(prev => !prev)}
      >
        <div className="comp-selector-tags">
          {selected.length === 0 ? (
            <span className="comp-selector-placeholder">{placeholder}</span>
          ) : (
            selected.map(name => (
              <span key={name} className="comp-selector-tag">
                {name}
                <button
                  className="comp-selector-tag-remove"
                  onClick={(e) => { e.stopPropagation(); removeTag(name); }}
                  title={`Remove ${name}`}
                >
                  <X size={10} />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown size={13} className={`comp-selector-chevron ${open ? 'rotated' : ''}`} />
      </div>

      {open && (
        <div className="comp-selector-dropdown">
          <div className="comp-selector-search">
            <Search size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Filter..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onClick={e => e.stopPropagation()}
              autoFocus
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.78rem',
                flex: 1,
                padding: 0
              }}
            />
          </div>

          <div className="comp-selector-list">
            {filtered.length === 0 ? (
              <div className="comp-selector-empty">No components found</div>
            ) : (
              filtered.map(c => (
                <div
                  key={c.id}
                  className={`comp-selector-option ${isSelected(c.name) ? 'selected' : ''}`}
                  onClick={() => toggle(c.name)}
                >
                  <span className={`comp-selector-option-dot ${c.type.toLowerCase()}`} />
                  <span className="comp-selector-option-name">{c.name}</span>
                  <span className="comp-selector-option-type">{c.type}</span>
                  {isSelected(c.name) && <Check size={12} className="comp-selector-check" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
