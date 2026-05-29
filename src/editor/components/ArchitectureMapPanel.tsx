import { useEffect, useState } from 'react';
import { useArchMapStore, ArchNode } from '@/store/useArchMapStore';
import { useEditorStore } from '@/store/useEditorStore';
import { RefreshCw, Play, Info, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export function ArchitectureMapPanel() {
  const { nodes, edges, filterType, isBuilding, buildMap, selectNode, selectedNode, setFilter } = useArchMapStore();
  const { openFile } = useEditorStore();
  const [hoveredNode, setHoveredNode] = useState<ArchNode | null>(null);

  useEffect(() => {
    if (nodes.length === 0 && !isBuilding) {
      void buildMap();
    }
  }, [buildMap, nodes.length, isBuilding]);

  const getColor = (type: string) => {
    switch (type) {
      case 'component': return '#3b82f6'; // Blue
      case 'store': return '#f97316'; // Orange
      case 'route': return '#22c55e'; // Green
      case 'api': return '#a855f7'; // Purple
      case 'hook': return '#14b8a6'; // Teal
      case 'service': return '#ec4899'; // Pink
      default: return '#6b7280'; // Gray
    }
  };

  const filteredNodes = nodes.filter(node => filterType === 'all' || node.type === filterType);
  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  
  // Only show edges linking visible nodes
  const filteredEdges = edges.filter(edge => filteredNodeIds.has(edge.from) && filteredNodeIds.has(edge.to));

  const handleNodeClick = (node: ArchNode) => {
    selectNode(node.id);
    openFile(node.path);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d1117', color: '#e2e8f0', padding: '14px', gap: '12px', minHeight: 0 }}>
      
      {/* Filters & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {(['all', 'component', 'store', 'route', 'api', 'hook'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              style={{
                background: filterType === type ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${filterType === type ? '#3b82f650' : '#1f2937'}`,
                borderRadius: '4px', color: filterType === type ? '#60a5fa' : '#9ca3af',
                fontSize: '10px', fontWeight: 600, padding: '3px 8px', cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              {type}
            </button>
          ))}
        </div>

        <button
          onClick={() => buildMap()}
          disabled={isBuilding}
          style={{
            background: 'rgba(59, 130, 246, 0.15)', border: '1px solid #3b82f630',
            borderRadius: '4px', color: '#60a5fa', fontSize: '10.5px', fontWeight: 600,
            padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
          }}
        >
          <RefreshCw size={11} className={isBuilding ? 'animate-spin' : ''} />
          Scan
        </button>
      </div>

      {/* SVG Canvas Workspace */}
      <div style={{ flex: 1, border: '1px solid #1f2937', borderRadius: '8px', background: '#070a0f', position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        {isBuilding ? (
          <div style={{ display: 'flex', flex: 1, height: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#4b5563' }}>
            <RefreshCw size={24} className="animate-spin" color="#3b82f6" />
            <span style={{ fontSize: '12px' }}>Tracing imports & parsing dependency nodes...</span>
          </div>
        ) : filteredNodes.length === 0 ? (
          <div style={{ display: 'flex', flex: 1, height: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#4b5563' }}>
            <Info size={24} />
            <span style={{ fontSize: '12px' }}>No modules found in the active workspace structure.</span>
          </div>
        ) : (
          <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 500 500">
            {/* Arrowhead Marker */}
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#1f2937" />
              </marker>
            </defs>

            {/* Render Edges */}
            {filteredEdges.map((edge, idx) => {
              const fromNode = nodes.find(n => n.id === edge.from);
              const toNode = nodes.find(n => n.id === edge.to);
              if (!fromNode || !toNode || fromNode.x === undefined || toNode.x === undefined) return null;

              return (
                <line
                  key={idx}
                  x1={fromNode.x}
                  y1={fromNode.y!}
                  x2={toNode.x}
                  y2={toNode.y!}
                  stroke="#1f2937"
                  strokeWidth="1.5"
                  markerEnd="url(#arrow)"
                />
              );
            })}

            {/* Render Nodes */}
            {filteredNodes.map(node => {
              const isSelected = selectedNode === node.id;
              const nodeColor = getColor(node.type);

              return (
                <g key={node.id} style={{ cursor: 'pointer' }} onClick={() => handleNodeClick(node)} onMouseEnter={() => setHoveredNode(node)} onMouseLeave={() => setHoveredNode(null)}>
                  {/* Outer ring for selected node */}
                  {isSelected && (
                    <circle cx={node.x} cy={node.y} r={12} fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
                  )}
                  {/* Node Circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={8}
                    fill={nodeColor}
                    stroke="#070a0f"
                    strokeWidth="1.5"
                    style={{ transition: 'r 150ms' }}
                  />
                  {/* Label */}
                  <text
                    x={node.x! + 12}
                    y={node.y! + 4}
                    fill={isSelected ? '#ffffff' : '#9ca3af'}
                    fontSize="9.5"
                    fontWeight={isSelected ? 'bold' : 'normal'}
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {/* Hover Tooltip Overlay */}
        {hoveredNode && (
          <div style={{
            position: 'absolute', bottom: '10px', left: '10px', right: '10px',
            background: 'rgba(17, 24, 39, 0.95)', border: '1px solid #1f2937',
            borderRadius: '6px', padding: '8px 10px', backdropFilter: 'blur(8px)', zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#e2e8f0' }}>{hoveredNode.label}</span>
              <span style={{
                fontSize: '8px', fontWeight: 700, textTransform: 'uppercase',
                color: getColor(hoveredNode.type), background: `${getColor(hoveredNode.type)}20`,
                padding: '1px 4px', borderRadius: '3px'
              }}>{hoveredNode.type}</span>
            </div>
            <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px', wordBreak: 'break-all' }}>
              Path: {hoveredNode.path}
            </div>
          </div>
        )}
      </div>

      {/* Legend & Guides */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid #1f2937', borderRadius: '6px', padding: '6px 10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { label: 'Component', color: '#3b82f6' },
            { label: 'Store', color: '#f97316' },
            { label: 'Route', color: '#22c55e' },
            { label: 'API', color: '#a855f7' },
            { label: 'Hook', color: '#14b8a6' }
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#6b7280' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: '9px', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '3px' }}>
          <MapPin size={10} />
          <span>Click node to open file</span>
        </div>
      </div>

    </div>
  );
}
export default ArchitectureMapPanel;
