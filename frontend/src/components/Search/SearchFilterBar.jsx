import React, { useRef, useEffect } from 'react';
import { 
  Search, 
  Server, 
  AppWindow, 
  Database, 
  Globe, 
  X,
  Compass
} from 'lucide-react';

const FILTER_TYPES = [
  { id: 'ALL', label: 'All' },
  { id: 'SERVICE', label: 'Services' },
  { id: 'APPLICATION', label: 'Apps' },
  { id: 'DATABASE', label: 'Databases' },
  { id: 'EXTERNAL', label: 'External' }
];

export default function SearchFilterBar({
  components,
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeSelect,
  selectedComponentId,
  onSelectComponent
}) {
  const searchInputRef = useRef(null);

  // Keyboard shortcut Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filtered = components.filter((c) => {
    const matchesQuery = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'ALL' || c.type === selectedType;
    return matchesQuery && matchesType;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'SERVICE': return <Server size={12} color="var(--service-color)" />;
      case 'APPLICATION': return <AppWindow size={12} color="var(--app-color)" />;
      case 'DATABASE': return <Database size={12} color="var(--db-color)" />;
      case 'EXTERNAL': return <Globe size={12} color="var(--external-color)" />;
      default: return <Server size={12} />;
    }
  };

  const getTypeCounts = (typeId) => {
    if (typeId === 'ALL') return components.length;
    return components.filter(c => c.type === typeId).length;
  };

  return (
    <aside className="discovery-sidebar">
      <div className="discovery-header">
        <div className="search-container">
          <Search size={14} className="search-icon-pos" />
          <input
            ref={searchInputRef}
            type="text"
            className="search-input-field"
            placeholder="Search topology..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery ? (
            <button 
              className="btn-icon" 
              style={{ position: 'absolute', right: 6 }} 
              onClick={() => onSearchChange('')}
              title="Clear search"
            >
              <X size={12} />
            </button>
          ) : (
            <span className="search-shortcut-hint">Ctrl K</span>
          )}
        </div>

        <div className="filter-pills-row">
          {FILTER_TYPES.map((type) => (
            <button
              key={type.id}
              className={`filter-pill ${selectedType === type.id ? 'active' : ''}`}
              onClick={() => onTypeSelect(type.id)}
            >
              {type.label} ({getTypeCounts(type.id)})
            </button>
          ))}
        </div>
      </div>

      <div className="component-navigator-list">
        {filtered.length === 0 ? (
          <div style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Compass size={24} style={{ opacity: 0.4, marginBottom: 6 }} />
            <p style={{ fontSize: '0.78rem' }}>No components match your search filter.</p>
          </div>
        ) : (
          filtered.map((comp) => {
            const isSelected = comp.id === selectedComponentId;
            return (
              <div
                key={comp.id}
                className={`nav-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectComponent(comp.id)}
              >
                <div className="nav-item-left">
                  {getIcon(comp.type)}
                  <span className="nav-item-name">{comp.name}</span>
                </div>
                <span className={`nav-item-type-badge ${comp.type.toLowerCase()}`}>
                  {comp.type === 'SERVICE' ? 'API' : comp.type.substring(0, 3)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
