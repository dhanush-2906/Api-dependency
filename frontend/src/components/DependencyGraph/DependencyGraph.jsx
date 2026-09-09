import React, { useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  MarkerType,
  useNodesState,
  useEdgesState
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import CustomNode from './CustomNode';
import Legend from './Legend';
import { getLayoutedElements } from '../../utils/layout';

const nodeTypes = {
  custom: CustomNode
};

export default function DependencyGraph({
  graphData,
  selectedComponentId,
  onSelectComponent,
  mode,
  impactData,
  layoutDirection = 'LR',
  onToggleLayout
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Process nodes and edges with dynamic statuses based on mode and impactData
  useEffect(() => {
    if (!graphData || !graphData.nodes) return;

    // Map impact statuses
    const statusMap = new Map();
    const distanceMap = new Map();

    if (mode === 'FAILURE_SIMULATION' && impactData) {
      statusMap.set(impactData.rootComponent.id, 'FAILED_ROOT');
      distanceMap.set(impactData.rootComponent.id, 0);

      impactData.directImpact.forEach(item => {
        statusMap.set(item.component.id, 'DIRECT_IMPACT');
        distanceMap.set(item.component.id, 1);
      });

      impactData.indirectImpact.forEach(item => {
        statusMap.set(item.component.id, 'INDIRECT_IMPACT');
        distanceMap.set(item.component.id, item.distance);
      });
    } else if (mode === 'CHANGE_IMPACT_ANALYSIS' && impactData) {
      statusMap.set(impactData.rootComponent.id, 'CHANGE_ROOT');
      distanceMap.set(impactData.rootComponent.id, 0);

      impactData.directImpact.forEach(item => {
        statusMap.set(item.component.id, 'DIRECT_IMPACT');
        distanceMap.set(item.component.id, 1);
      });

      impactData.indirectImpact.forEach(item => {
        statusMap.set(item.component.id, 'INDIRECT_IMPACT');
        distanceMap.set(item.component.id, item.distance);
      });
    }

    // Convert API nodes to React Flow nodes
    const rawNodes = graphData.nodes.map(n => {
      let nodeStatus = 'NORMAL';
      if (mode !== 'NORMAL') {
        if (statusMap.has(n.id)) {
          nodeStatus = statusMap.get(n.id);
        } else {
          nodeStatus = 'UNAFFECTED';
        }
      }

      return {
        id: n.id,
        type: 'custom',
        data: {
          id: n.id,
          name: n.name,
          type: n.type,
          status: nodeStatus,
          distance: distanceMap.get(n.id),
          isSelected: n.id === selectedComponentId
        },
        position: { x: 0, y: 0 }
      };
    });

    // Build edges with styling & animations
    const rawEdges = graphData.edges.map(e => {
      const isImpactedSource = statusMap.has(e.source);
      const isImpactedTarget = statusMap.has(e.target);
      const isImpactPathEdge = mode !== 'NORMAL' && isImpactedSource && isImpactedTarget;

      let edgeColor = '#475569';
      let strokeWidth = 1.5;
      let animated = false;

      if (isImpactPathEdge) {
        edgeColor = mode === 'FAILURE_SIMULATION' ? '#ef4444' : '#f59e0b';
        strokeWidth = 2.5;
        animated = true;
      } else if (mode !== 'NORMAL') {
        edgeColor = '#1e293b';
      }

      return {
        id: e.id,
        source: e.source,
        target: e.target,
        animated,
        style: {
          stroke: edgeColor,
          strokeWidth
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: edgeColor
        }
      };
    });

    const layouted = getLayoutedElements(rawNodes, rawEdges, layoutDirection);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
  }, [graphData, selectedComponentId, mode, impactData, layoutDirection]);

  const onNodeClick = useCallback((_, node) => {
    onSelectComponent(node.id);
  }, [onSelectComponent]);

  return (
    <div className="graph-viewport">
      <div className="graph-layout-controls">
        <button 
          className="btn btn-secondary" 
          onClick={onToggleLayout}
          title="Toggle Graph Flow (Horizontal / Vertical)"
        >
          Layout: {layoutDirection === 'LR' ? 'Horizontal (L?R)' : 'Vertical (T?B)'}
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
      >
        <Background color="#1e293b" gap={20} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => {
            const t = node.data?.type;
            if (t === 'SERVICE') return '#38bdf8';
            if (t === 'APPLICATION') return '#34d399';
            if (t === 'DATABASE') return '#a78bfa';
            if (t === 'EXTERNAL') return '#fbbf24';
            return '#64748b';
          }}
          maskColor="rgba(15, 23, 42, 0.7)"
          style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
        />
      </ReactFlow>

      <Legend mode={mode} />
    </div>
  );
}
