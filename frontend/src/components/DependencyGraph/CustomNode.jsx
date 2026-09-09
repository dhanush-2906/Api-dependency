import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Server, AppWindow, Database, Globe, AlertTriangle, Flame, ArrowUpRight, ShieldAlert } from 'lucide-react';

function CustomNode({ data, selected }) {
  const { name, type, status, distance, isSelected } = data;

  const getTypeIcon = () => {
    switch (type) {
      case 'SERVICE': return <Server size={14} color="var(--accent-service)" />;
      case 'APPLICATION': return <AppWindow size={14} color="var(--accent-app)" />;
      case 'DATABASE': return <Database size={14} color="var(--accent-db)" />;
      case 'EXTERNAL': return <Globe size={14} color="var(--accent-external)" />;
      default: return <Server size={14} />;
    }
  };

  let nodeStatusClass = '';
  let statusBadge = null;

  if (status === 'FAILED_ROOT') {
    nodeStatusClass = 'failed-root';
    statusBadge = <span className="node-status-badge status-badge-failed"><ShieldAlert size={10} /> Failed Outage</span>;
  } else if (status === 'CHANGE_ROOT') {
    nodeStatusClass = 'change-root';
    statusBadge = <span className="node-status-badge status-badge-change"><Flame size={10} /> Modified</span>;
  } else if (status === 'DIRECT_IMPACT') {
    nodeStatusClass = 'direct-impact';
    statusBadge = <span className="node-status-badge status-badge-direct">Direct (Hop 1)</span>;
  } else if (status === 'INDIRECT_IMPACT') {
    nodeStatusClass = 'indirect-impact';
    statusBadge = <span className="node-status-badge status-badge-indirect">Indirect (Hop {distance})</span>;
  } else if (status === 'UPSTREAM_CONTEXT') {
    nodeStatusClass = 'upstream-context';
    statusBadge = <span className="node-status-badge status-badge-upstream">Upstream Context</span>;
  } else if (status === 'UNAFFECTED') {
    nodeStatusClass = 'unaffected-dimmed';
  }

  const selectedClass = isSelected || selected ? 'selected' : '';

  return (
    <div className={`custom-node ${nodeStatusClass} ${selectedClass}`}>
      <Handle type="target" position={Position.Left} style={{ background: '#64748b', width: 8, height: 8 }} />
      <Handle type="target" position={Position.Top} id="top" style={{ background: '#64748b', width: 8, height: 8 }} />
      
      <div className="node-header">
        <div className="node-icon-title">
          {getTypeIcon()}
          <span className="node-title" title={name}>{name}</span>
        </div>
        <span className={`type-tag ${type.toLowerCase()}`}>
          {type === 'SERVICE' ? 'API' : type.substring(0, 3)}
        </span>
      </div>

      {statusBadge && <div style={{ marginTop: '4px' }}>{statusBadge}</div>}

      <div className="node-footer">
        <span>Provider ? Consumer</span>
        {distance !== undefined && distance > 0 && <span>Dist: {distance}</span>}
      </div>

      <Handle type="source" position={Position.Right} style={{ background: '#38bdf8', width: 8, height: 8 }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: '#38bdf8', width: 8, height: 8 }} />
    </div>
  );
}

export default memo(CustomNode);
