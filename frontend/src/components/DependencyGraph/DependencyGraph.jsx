import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  MarkerType,
  useNodesState,
  useEdgesState,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { 
  Maximize2, 
  LayoutGrid, 
  Eye, 
  EyeOff,
  Focus
} from 'lucide-react';

import CustomNode from './CustomNode';
import Legend from './Legend';
import { getLayoutedElements } from '../../utils/layout';

const nodeTypes = {
  custom: CustomNode
};

function GraphInner({
  graphData,
  selectedComponentId,
  selectedDetails,
  onSelectComponent,
  mode,
  impactData,
  layoutDirection,
  onToggleLayout
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showMinimap, setShowMinimap] = useState(true);

  const { fitView, setCenter, getNode } = useReactFlow();

  // Process nodes and layout
  useEffect(() => {
    if (!graphData || !graphData.nodes) return;

    const statusMap = new Map();
    const distanceMap = new Map();

    // Map direct upstream & downstream neighbors when in NORMAL mode with a selection
    const directUpstreamSet = new Set(
      selectedDetails?.directUpstream?.map(u => u.id) || []
    );
    const directDownstreamSet = new Set(
      selectedDetails?.directDownstream?.map(d => d.id) || []
    );

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

    const rawNodes = graphData.nodes.map(n => {
      let nodeStatus = 'NORMAL';
      let isDirectNeighbor = false;
      let neighborType = null;

      if (mode !== 'NORMAL') {
        if (statusMap.has(n.id)) {
          nodeStatus = statusMap.get(n.id);
        } else {
          nodeStatus = 'UNAFFECTED';
        }
      } else if (selectedComponentId) {
        // Analytical highlighting in Normal Mode
        if (n.id === selectedComponentId) {
          nodeStatus = 'SELECTED';
        } else if (directUpstreamSet.has(n.id)) {
          isDirectNeighbor = true;
          neighborType = 'UPSTREAM';
        } else if (directDownstreamSet.has(n.id)) {
          isDirectNeighbor = true;
          neighborType = 'DOWNSTREAM';
        } else {
          nodeStatus = 'UNCONNECTED_DIMMED';
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
          isSelected: n.id === selectedComponentId,
          isDirectNeighbor,
          neighborType
        },
        position: { x: 0, y: 0 }
      };
    });

    const rawEdges = graphData.edges.map(e => {
      let edgeColor = '#243456';
      let strokeWidth = 1.5;
      let animated = false;

      if (mode !== 'NORMAL') {
        const isImpactedSource = statusMap.has(e.source);
        const isImpactedTarget = statusMap.has(e.target);
        const isImpactEdge = isImpactedSource && isImpactedTarget;

        if (isImpactEdge) {
          edgeColor = mode === 'FAILURE_SIMULATION' ? '#ef4444' : '#f59e0b';
          strokeWidth = 2.5;
          animated = true;
        } else {
          edgeColor = '#141e33';
        }
      } else if (selectedComponentId) {
        // Highlight edges directly touching selected component in normal mode
        if (e.source === selectedComponentId || e.target === selectedComponentId) {
          edgeColor = '#38bdf8';
          strokeWidth = 2.2;
          animated = true;
        } else {
          edgeColor = '#16233b';
        }
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
  }, [graphData, selectedComponentId, selectedDetails, mode, impactData, layoutDirection]);

  // Center on selected component when it changes
  useEffect(() => {
    if (selectedComponentId) {
      const targetNode = getNode(selectedComponentId);
      if (targetNode) {
        setCenter(
          targetNode.position.x + 110,
          targetNode.position.y + 45,
          { zoom: 1, duration: 400 }
        );
      }
    }
  }, [selectedComponentId, getNode, setCenter]);

  const onNodeClick = useCallback((_, node) => {
    onSelectComponent(node.id);
  }, [onSelectComponent]);

  const handleFitView = () => {
    fitView({ padding: 0.2, duration: 300 });
  };

  const handleCenterSelected = () => {
    if (selectedComponentId) {
      const targetNode = getNode(selectedComponentId);
      if (targetNode) {
        setCenter(
          targetNode.position.x + 110,
          targetNode.position.y + 45,
          { zoom: 1.1, duration: 300 }
        );
      }
    }
  };

  return (
    <div className="graph-canvas-container">
      <div className="graph-floating-toolbar">
        <button 
          className="toolbar-btn" 
          onClick={onToggleLayout}
          title="Toggle Hierarchical Flow Direction"
        >
          <LayoutGrid size={13} />
          <span>{layoutDirection === 'LR' ? 'Horizontal (L?R)' : 'Vertical (T?B)'}</span>
        </button>

        <div style={{ width: 1, height: 16, background: 'var(--border-default)' }}></div>

        <button className="toolbar-btn" onClick={handleFitView} title="Fit Entire Topology to Canvas">
          <Maximize2 size={13} />
          <span>Fit View</span>
        </button>

        {selectedComponentId && (
          <button className="toolbar-btn" onClick={handleCenterSelected} title="Center on Selected Component">
            <Focus size={13} color="var(--brand-primary)" />
            <span>Focus</span>
          </button>
        )}

        <button 
          className="toolbar-btn" 
          onClick={() => setShowMinimap(!showMinimap)}
          title="Toggle MiniMap"
        >
          {showMinimap ? <EyeOff size={13} /> : <Eye size={13} />}
          <span>MiniMap</span>
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
        maxZoom={1.8}
      >
        <Background color="#1a2744" gap={24} size={1} />
        <Controls showInteractive={false} style={{ display: 'none' }} />
        {showMinimap && (
          <MiniMap
            nodeColor={(node) => {
              const t = node.data?.type;
              if (t === 'SERVICE') return '#38bdf8';
              if (t === 'APPLICATION') return '#34d399';
              if (t === 'DATABASE') return '#c084fc';
              if (t === 'EXTERNAL') return '#fbbf24';
              return '#64748b';
            }}
            maskColor="rgba(7, 11, 20, 0.85)"
            style={{ 
              background: '#0c1220', 
              border: '1px solid var(--border-default)', 
              borderRadius: '8px',
              bottom: 16,
              right: 16
            }}
          />
        )}
      </ReactFlow>

      <Legend mode={mode} />
    </div>
  );
}

export default function DependencyGraph(props) {
  return <GraphInner {...props} />;
}
