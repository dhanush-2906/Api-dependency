import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { 
  Server, 
  AppWindow, 
  Database, 
  Globe, 
  ShieldAlert, 
  Flame, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

function CustomNode({ data, selected }) {
  const { name, type, status, distance, isSelected } = data;

  const getTypeIcon = () => {
    switch (type) {
      case 'SERVICE': return <Server size={13} />;
      case 'APPLICATION': return <AppWindow size={13} />;
      case 'DATABASE': return <Database size={13} />;
      case 'EXTERNAL': return <Globe size={13} />;
      default: return <Server size={13} />;
    }
  };

  let nodeStateClass = '';
  let statusChip = null;

  if (status === 'FAILED_ROOT') {
    nodeStateClass = 'failed-root';
    statusChip = (
      <span className="node-status-chip failed">
        <ShieldAlert size={10} /> Outage Root
      </span>
    );
  } else if (status === 'CHANGE_ROOT') {
    nodeStateClass = 'change-root';
    statusChip = (
      <span className="node-status-chip change">
        <Flame size={10} /> Modified Source
      </span>
    );
  } else if (status === 'DIRECT_IMPACT') {
    nodeStateClass = 'direct-impact';
    statusChip = (
      <span className="node-status-chip direct">
        Direct Impact · Hop 1
      </span>
    );
  } else if (status === 'INDIRECT_IMPACT') {
    nodeStateClass = 'indirect-impact';
    statusChip = (
      <span className="node-status-chip indirect">
        Indirect · Hop {distance}
      </span>
    );
  } else if (status === 'UNAFFECTED') {
    nodeStateClass = 'unaffected-dimmed';
  }

  const isHighlighted = isSelected || selected;

  return (
    <div className={`enterprise-node ${nodeStateClass} ${isHighlighted ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} style={{ background: '#475569', width: 7, height: 7, border: 'none' }} />
      <Handle type="target" position={Position.Top} id="top" style={{ background: '#475569', width: 7, height: 7, border: 'none' }} />

      <div className="node-top-row">
        <div className={`node-type-indicator ${type.toLowerCase()}`}>
          {getTypeIcon()}
          <span>{type === 'SERVICE' ? 'API Service' : type}</span>
        </div>
        {distance !== undefined && distance > 0 && (
          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
            d={distance}
          </span>
        )}
      </div>

      <div className="node-main-name" title={name}>
        {name}
      </div>

      {statusChip && (
        <div className="node-status-pill-container">
          {statusChip}
        </div>
      )}

      <div className="node-bottom-row">
        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          Provider <ArrowRight size={10} /> Consumer
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>Canonical</span>
      </div>

      <Handle type="source" position={Position.Right} style={{ background: 'var(--brand-primary)', width: 7, height: 7, border: 'none' }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: 'var(--brand-primary)', width: 7, height: 7, border: 'none' }} />
    </div>
  );
}

export default memo(CustomNode);
