import React from 'react';
import { Search, Server, AppWindow, Database, Globe } from 'lucide-react';

const FILTER_TYPES = ['ALL', 'SERVICE', 'APPLICATION', 'DATABASE', 'EXTERNAL'];

export default function SearchFilterBar({
  components,
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeSelect,
  selectedComponentId,
  onSelectComponent
}) {
  const filtered = components.filter((c) => {
    const matchesQuery = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'ALL' || c.type === selectedType;
    return matchesQuery && matchesType;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'SERVICE': return <Server size={13} color="var(--accent-service)" />;
      case 'APPLICATION': return <AppWindow size={13} color="var(--accent-app)" />;
      case 'DATABASE': return <Database size={13} color="var(--accent-db)" />;
      case 'EXTERNAL': return <Globe size={13} color="var(--accent-external)" />;
      default: return <Server size={13} />;
    }
  };

  return (
    <aside className="left-sidebar">
      <div className="sidebar-header">
        <div className="search-input-wrapper">
          <Search size={15} />
          <input
            type="text"
            className="search-input"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="type-filter-chips">
          {FILTER_TYPES.map((type) => (
            <button
              key={type}
              className={`type-chip ${selectedType === type ? 'active' : ''}`}
              onClick={() => onTypeSelect(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="component-list">
        {filtered.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            No components match your search.
          </div>
        ) : (
          filtered.map((comp) => {
            const isSelected = comp.id === selectedComponentId;
            return (
              <div
                key={comp.id}
                className={`component-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectComponent(comp.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getIcon(comp.type)}
                  <span className="component-item-name">{comp.name}</span>
                </div>
                <span className={`type-tag ${comp.type.toLowerCase()}`}>
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
