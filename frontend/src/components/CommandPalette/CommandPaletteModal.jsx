import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Server, 
  AppWindow, 
  Database, 
  Globe, 
  ShieldAlert, 
  GitPullRequest, 
  RotateCcw, 
  Maximize2, 
  LayoutGrid, 
  FileCheck,
  Zap,
  AlertOctagon,
  Flame,
  ArrowRight,
  X
} from 'lucide-react';

export default function CommandPaletteModal({
  isOpen,
  onClose,
  components,
  selectedComponentId,
  onSelectComponent,
  onSimulateFailure,
  onAnalyzeChange,
  onResetSimulation,
  onToggleLayout,
  onOpenValidation,
  metrics
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Build searchable items
  const componentItems = components
    .filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.type.toLowerCase().includes(query.toLowerCase()))
    .map(c => ({
      type: 'COMPONENT',
      id: c.id,
      title: c.name,
      subtitle: `${c.type === 'SERVICE' ? 'API Service' : c.type} · Select & inspect in topology`,
      icon: c.type === 'SERVICE' ? <Server size={14} color="var(--service-color)" /> :
            c.type === 'APPLICATION' ? <AppWindow size={14} color="var(--app-color)" /> :
            c.type === 'DATABASE' ? <Database size={14} color="var(--db-color)" /> :
            <Globe size={14} color="var(--external-color)" />,
      action: () => {
        onSelectComponent(c.id);
        onClose();
      }
    }));

  const actionItems = [];
  const selectedComp = components.find(c => c.id === selectedComponentId);

  if (selectedComp) {
    actionItems.push({
      type: 'ACTION',
      id: 'action-fail',
      title: `Simulate Outage on ${selectedComp.name}`,
      subtitle: 'Calculate downstream blast radius & consumer impact',
      icon: <ShieldAlert size={14} color="#ef4444" />,
      action: () => {
        onSimulateFailure(selectedComp.id);
        onClose();
      }
    });

    actionItems.push({
      type: 'ACTION',
      id: 'action-change',
      title: `Analyze Change Impact on ${selectedComp.name}`,
      subtitle: 'Identify dependent systems requiring validation',
      icon: <GitPullRequest size={14} color="#f59e0b" />,
      action: () => {
        onAnalyzeChange(selectedComp.id);
        onClose();
      }
    });
  }

  if (metrics?.criticalServiceCandidate) {
    actionItems.push({
      type: 'ACTION',
      id: 'action-focus-critical',
      title: `Focus on Critical Candidate: ${metrics.criticalServiceCandidate.name}`,
      subtitle: `Score: ${metrics.criticalServiceCandidate.criticalityScore} downstream reach`,
      icon: <AlertOctagon size={14} color="#ef4444" />,
      action: () => {
        onSelectComponent(metrics.criticalServiceCandidate.id);
        onClose();
      }
    });
  }

  if (metrics?.mostConnectedService) {
    actionItems.push({
      type: 'ACTION',
      id: 'action-focus-connected',
      title: `Focus on Most Connected: ${metrics.mostConnectedService.name}`,
      subtitle: `${metrics.mostConnectedService.connections} in/out links`,
      icon: <Zap size={14} color="#f59e0b" />,
      action: () => {
        onSelectComponent(metrics.mostConnectedService.id);
        onClose();
      }
    });
  }

  actionItems.push({
    type: 'ACTION',
    id: 'action-layout',
    title: 'Toggle Graph Layout (Horizontal / Vertical)',
    subtitle: 'Switch hierarchical flow layout',
    icon: <LayoutGrid size={14} color="var(--brand-primary)" />,
    action: () => {
      onToggleLayout();
      onClose();
    }
  });

  actionItems.push({
    type: 'ACTION',
    id: 'action-reset',
    title: 'Reset Active Simulation',
    subtitle: 'Return to normal ecosystem exploration',
    icon: <RotateCcw size={14} color="var(--text-secondary)" />,
    action: () => {
      onResetSimulation();
      onClose();
    }
  });

  actionItems.push({
    type: 'ACTION',
    id: 'action-validation',
    title: 'View Dataset Validation & Integrity Report',
    subtitle: 'Check loaded YAML schemas and relationship normalization',
    icon: <FileCheck size={14} color="#10b981" />,
    action: () => {
      onOpenValidation();
      onClose();
    }
  });

  const filteredActions = actionItems.filter(a => 
    a.title.toLowerCase().includes(query.toLowerCase()) || 
    a.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  const allItems = [...filteredActions, ...componentItems];

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < allItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : allItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        allItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="palette-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="palette-search-row">
          <Search size={16} color="var(--text-muted)" />
          <input
            ref={inputRef}
            type="text"
            className="palette-search-input"
            placeholder="Type a component name or action command..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <button className="btn-icon" onClick={onClose} title="Close palette (Esc)">
            <X size={14} />
          </button>
        </div>

        <div className="palette-results-list">
          {allItems.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No components or commands match "{query}".
            </div>
          ) : (
            allItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id || idx}
                  className={`palette-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="palette-item-icon">
                    {item.icon}
                  </div>
                  <div className="palette-item-text">
                    <span className="palette-item-title">{item.title}</span>
                    <span className="palette-item-sub">{item.subtitle}</span>
                  </div>
                  {isSelected && <ArrowRight size={12} color="var(--brand-primary)" style={{ marginLeft: 'auto' }} />}
                </div>
              );
            })
          )}
        </div>

        <div className="palette-footer">
          <span><kbd>?</kbd> <kbd>?</kbd> to navigate</span>
          <span><kbd>?</kbd> to select</span>
          <span><kbd>esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
