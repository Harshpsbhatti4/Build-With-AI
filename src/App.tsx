import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Cpu, 
  Zap, 
  Power, 
  Lightbulb, 
  Trash2, 
  Plus, 
  Maximize2, 
  Minimize2,
  RefreshCw,
  Info
} from 'lucide-react';
import { GateNode, Connection, GateType, Position } from './types.ts';
import { simulateCircuit, evaluateGate } from './logic/simulator.ts';

const GATE_WIDTH = 120;
const GATE_HEIGHT = 80;

const INITIAL_NODES: GateNode[] = [
  { id: 'sw1', type: 'SWITCH', position: { x: 100, y: 100 }, inputs: [], value: false },
  { id: 'sw2', type: 'SWITCH', position: { x: 100, y: 250 }, inputs: [], value: true },
  { id: 'gate1', type: 'AND', position: { x: 300, y: 175 }, inputs: [null, null], value: false },
  { id: 'bulb1', type: 'BULB', position: { x: 500, y: 175 }, inputs: [null], value: false },
];

const INITIAL_CONNECTIONS: Connection[] = [
  { id: 'c1', fromId: 'sw1', toId: 'gate1', toInputIndex: 0 },
  { id: 'c2', fromId: 'sw2', toId: 'gate1', toInputIndex: 1 },
  { id: 'c3', fromId: 'gate1', toId: 'bulb1', toInputIndex: 0 },
];

export default function App() {
  const [nodes, setNodes] = useState<GateNode[]>(INITIAL_NODES);
  const [connections, setConnections] = useState<Connection[]>(INITIAL_CONNECTIONS);
  const [activePort, setActivePort] = useState<{ nodeId: string, type: 'input' | 'output', index?: number } | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 });
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Simulation effect
  useEffect(() => {
    const updatedNodes = simulateCircuit(nodes, connections);
    if (JSON.stringify(updatedNodes) !== JSON.stringify(nodes)) {
      setNodes(updatedNodes);
    }
  }, [nodes, connections]);

  const addNode = (type: GateType) => {
    const newNode: GateNode = {
      id: `${type.toLowerCase()}-${Date.now()}`,
      type,
      position: { x: 300, y: 300 },
      inputs: type === 'NOT' || type === 'BULB' ? [null] : type === 'SWITCH' ? [] : [null, null],
      value: false,
    };
    setNodes([...nodes, newNode]);
    setSelectedNodeId(newNode.id);
  };

  const removeNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
    setConnections(connections.filter(c => c.fromId !== id && c.toId !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const toggleSwitch = (id: string) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, value: !n.value } : n));
  };

  const handlePortClick = (nodeId: string, portType: 'input' | 'output', index?: number) => {
    if (!activePort) {
      setActivePort({ nodeId, type: portType, index });
    } else {
      const start = activePort;
      const end = { nodeId, type: portType, index };

      if (start.type === 'output' && end.type === 'input') {
        const existing = connections.find(c => c.toId === end.nodeId && c.toInputIndex === end.index);
        const newConn = {
          id: `c-${Date.now()}`,
          fromId: start.nodeId,
          toId: end.nodeId,
          toInputIndex: end.index ?? 0
        };
        setConnections(prev => existing ? [...prev.filter(c => c.id !== existing.id), newConn] : [...prev, newConn]);
      } else if (start.type === 'input' && end.type === 'output') {
        setConnections(prev => [...prev, {
          id: `c-${Date.now()}`,
          fromId: end.nodeId,
          toId: start.nodeId,
          toInputIndex: start.index ?? 0
        }]);
      }
      setActivePort(null);
    }
  };

  const deleteConnection = (id: string) => {
    setConnections(connections.filter(c => c.id !== id));
  };

  const updateNodePosition = (id: string, pos: Position) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, position: pos } : n));
  };

  const getPortPosition = (nodeId: string, type: 'input' | 'output', index = 0): Position => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    if (type === 'output') return { x: node.position.x + GATE_WIDTH, y: node.position.y + GATE_HEIGHT / 2 };
    const numInputs = node.type === 'NOT' || node.type === 'BULB' ? 1 : 2;
    const spacing = GATE_HEIGHT / (numInputs + 1);
    return { x: node.position.x, y: node.position.y + spacing * (index + 1) };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (workspaceRef.current) {
      const rect = workspaceRef.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="flex h-screen w-full bg-[var(--bg)] text-[var(--zinc-100)] flex-col" onMouseMove={handleMouseMove}>
      {/* Editorial Header */}
      <header className="flex justify-between items-end px-10 pt-10 pb-6 border-b border-zinc-800 bg-[var(--bg)] z-50">
        <div className="flex flex-col">
          <h1 className="text-6xl font-serif font-light tracking-tighter leading-none italic">LogiCraft.Lab</h1>
          <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 font-bold mt-2 ml-1">VLSI Systems Simulator — Beta 1.0</p>
        </div>
        <div className="flex gap-12 text-[11px] font-mono tracking-wider">
          <div className="flex flex-col">
            <span className="text-zinc-600 mb-1">CLOCK SPEED</span>
            <span className="text-zinc-200 uppercase">2.4 GHz [INT]</span>
          </div>
          <div className="flex flex-col">
            <span className="text-zinc-600 mb-1">VOLTAGE RAIL</span>
            <span className="text-zinc-200 uppercase">0.85V VDD</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-zinc-600 mb-1">SIMULATION STATUS</span>
            <span className="text-[var(--success)] flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[var(--success)] rounded-full animate-pulse"></span>
              ACTIVE_SYNC
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Library Rail */}
        <nav className="w-[220px] border-r border-zinc-800 flex flex-col p-8 bg-[var(--bg)]">
          <span className="section-label mb-8">LIBRARY.VLD</span>
          <ul className="space-y-6">
            {['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR'].map((type, idx) => (
              <li 
                key={type}
                onClick={() => addNode(type as GateType)}
                className="flex items-center justify-between group cursor-pointer"
              >
                <span className="text-lg font-serif italic text-zinc-500 group-hover:text-zinc-100 transition-colors">{type} Gate</span>
                <span className="text-[10px] font-mono text-zinc-700">0x0{idx + 1}</span>
              </li>
            ))}
          </ul>
          
          <div className="mt-8 pt-8 border-t border-zinc-800 border-dashed">
             <span className="section-label mb-6">COMPONENTS</span>
             <div className="space-y-6">
               <div onClick={() => addNode('SWITCH')} className="flex items-center justify-between group cursor-pointer">
                 <span className="text-lg font-serif italic text-zinc-500 group-hover:text-zinc-100 uppercase">Switch</span>
                 <Power className="w-3 h-3 text-zinc-700 group-hover:text-[var(--accent)]" />
               </div>
               <div onClick={() => addNode('BULB')} className="flex items-center justify-between group cursor-pointer">
                 <span className="text-lg font-serif italic text-zinc-500 group-hover:text-zinc-100 uppercase">Led Bulb</span>
                 <Lightbulb className="w-3 h-3 text-zinc-700 group-hover:text-[var(--accent)]" />
               </div>
             </div>
          </div>

          <div className="mt-auto">
            <div className="p-4 bg-zinc-900 rounded-sm border border-zinc-800">
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                <strong className="text-zinc-300 block mb-1 uppercase tracking-wide">Pro Tip</strong>
                Click workspace to deselect. Drag gates to rearrange logic paths.
              </p>
            </div>
            <button 
              onClick={() => { setNodes([]); setConnections([]); }}
              className="mt-4 w-full text-[10px] font-mono uppercase text-zinc-600 hover:text-red-500 text-left transition-colors"
            >
              [PURGE WORKSPACE]
            </button>
          </div>
        </nav>

        {/* Center Canvas */}
        <main className="flex-1 relative bg-[#080809] overflow-hidden" onClick={() => { setSelectedNodeId(null); activePort && setActivePort(null); }} ref={workspaceRef}>
          <div className="absolute inset-0 grid-bg pointer-events-none" />
          
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <filter id="glow-editorial">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            {connections.map(conn => {
              const start = getPortPosition(conn.fromId, 'output');
              const end = getPortPosition(conn.toId, 'input', conn.toInputIndex);
              const isActive = nodes.find(n => n.id === conn.fromId)?.value ?? false;
              const path = `M ${start.x} ${start.y} C ${start.x + 80} ${start.y}, ${end.x - 80} ${end.y}, ${end.x} ${end.y}`;
              return (
                <g key={conn.id}>
                  <path 
                    d={path} fill="none" 
                    stroke={isActive ? 'var(--accent)' : 'var(--zinc-800)'} 
                    strokeWidth="1.5"
                    filter={isActive ? 'url(#glow-editorial)' : ''}
                    className="transition-colors duration-300"
                  />
                  <path 
                    d={path} fill="none" stroke="transparent" strokeWidth="12"
                    className="pointer-events-auto cursor-pointer opacity-0 hover:opacity-10"
                    onClick={(e) => { e.stopPropagation(); deleteConnection(conn.id); }}
                  />
                </g>
              );
            })}
            {activePort && (
              <line 
                x1={getPortPosition(activePort.nodeId, activePort.type, activePort.index).x}
                y1={getPortPosition(activePort.nodeId, activePort.type, activePort.index).y}
                x2={mousePos.x} y2={mousePos.y}
                stroke="var(--accent)" strokeWidth="1" strokeDasharray="4 2"
              />
            )}
          </svg>

          {nodes.map(node => (
            <motion.div
              key={node.id} drag dragMomentum={false}
              onDrag={(e, info) => updateNodePosition(node.id, { x: node.position.x + info.delta.x, y: node.position.y + info.delta.y })}
              onMouseDown={(e) => { e.stopPropagation(); setSelectedNodeId(node.id); }}
              style={{ x: node.position.x, y: node.position.y, width: GATE_WIDTH, height: GATE_HEIGHT }}
              className="absolute z-10"
            >
              <div className={`
                relative w-full h-full p-4 bg-[var(--zinc-900)] border border-zinc-800 transition-all group
                ${selectedNodeId === node.id ? 'border-[var(--accent)] shadow-[0_0_15px_rgba(249,115,22,0.15)]' : 'hover:border-zinc-500'}
                ${node.type === 'BULB' ? 'rounded-full scale-75' : node.type === 'SWITCH' ? 'rounded-lg' : 'rounded-none'}
                flex flex-col items-center justify-center
              `}>
                <span className="mono-label absolute -top-4 left-0">{node.id.split('-')[0]}</span>
                
                {node.type === 'SWITCH' ? (
                  <button onClick={(e) => { e.stopPropagation(); toggleSwitch(node.id); }} className="relative">
                    <Power className={`w-8 h-8 transition-colors ${node.value ? 'text-[var(--accent)]' : 'text-zinc-700'}`} />
                    {node.value && <div className="absolute top-0 left-0 w-8 h-8 bg-[var(--accent)] opacity-20 blur-xl animate-pulse" />}
                  </button>
                ) : node.type === 'BULB' ? (
                   <Lightbulb className={`w-12 h-12 transition-all duration-500 ${node.value ? 'text-[var(--accent)] fill-[var(--accent)] scale-110 drop-shadow-[0_0_10px_var(--accent-glow)]' : 'text-zinc-800'}`} />
                ) : (
                  <span className="text-2xl font-serif italic leading-none">{node.type}</span>
                )}

                <button onClick={(e) => { e.stopPropagation(); removeNode(node.id); }} className="absolute -top-2 -right-2 p-1 bg-black text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all">
                  <Trash2 className="w-3 h-3" />
                </button>

                {/* Ports */}
                {(node.type !== 'SWITCH') && (
                  <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-around -translate-x-1 h-full py-3">
                    {Array.from({ length: node.type === 'NOT' || node.type === 'BULB' ? 1 : 2 }).map((_, i) => (
                      <div 
                        key={`${node.id}-in-${i}`}
                        className={`port-editorial ${activePort?.nodeId === node.id && activePort?.type === 'input' && activePort?.index === i ? 'port-active-editorial' : ''}`}
                        onClick={(e) => { e.stopPropagation(); handlePortClick(node.id, 'input', i); }}
                      />
                    ))}
                  </div>
                )}
                {(node.type !== 'BULB') && (
                  <div className="absolute right-0 top-0 bottom-0 flex items-center translate-x-1">
                    <div 
                      className={`port-editorial ${activePort?.nodeId === node.id && activePort?.type === 'output' ? 'port-active-editorial' : ''}`}
                      onClick={(e) => { e.stopPropagation(); handlePortClick(node.id, 'output'); }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </main>

        {/* Right Sidebar: Inspector */}
        <aside className="w-[280px] border-l border-zinc-800 p-8 flex flex-col bg-[var(--bg)]">
          <div className="mb-10">
            <span className="section-label mb-6">PROPERTIES</span>
            {selectedNode ? (
              <div className="space-y-6">
                <div className="flex flex-col">
                  <label className="mono-label mb-1">Entity ID</label>
                  <span className="text-sm font-serif italic">{selectedNode.id}</span>
                </div>
                <div className="flex flex-col">
                  <label className="mono-label mb-1">Gate Logic</label>
                  <span className="text-sm font-serif italic">{selectedNode.type} FUNCTION</span>
                </div>
                <div className="flex flex-col">
                  <label className="mono-label mb-1">Current State</label>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded w-fit ${selectedNode.value ? 'text-[var(--success)] bg-[var(--success)]/10' : 'text-zinc-600 bg-zinc-800'}`}>
                    {selectedNode.value ? 'HIGH (1)' : 'LOW (0)'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <label className="mono-label mb-1">Propagation Delay</label>
                  <span className="text-sm font-serif italic">{selectedNode.type === 'SWITCH' ? '0' : '12.5'} ps</span>
                </div>
              </div>
            ) : (
              <p className="text-[10px] font-mono text-zinc-600 italic">Select a node to inspect its local netlist properties.</p>
            )}
          </div>

          <div>
             <span className="section-label mb-6">TRUTH TABLE</span>
             {selectedNode && !['SWITCH', 'BULB'].includes(selectedNode.type) ? (
               <table className="w-full text-left font-mono text-[10px]">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="py-2 font-normal text-zinc-500">A</th>
                    {selectedNode.type !== 'NOT' && <th className="py-2 font-normal text-zinc-500">B</th>}
                    <th className="py-2 font-normal text-zinc-100">Q ({selectedNode.type})</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-400">
                  {[0, 1].map(a => (
                    selectedNode.type === 'NOT' ? (
                      <tr key={a} className={`border-b border-zinc-900/50 ${(selectedNode.inputs[0] === null && a === 0) || (selectedNode.value === (a === 0)) ? 'bg-zinc-800/30' : ''}`}>
                        <td className="py-2">{a}</td>
                        <td className={`py-2 ${evaluateGate(selectedNode.type, [a === 1]) ? 'text-[var(--accent)]' : ''}`}>{evaluateGate(selectedNode.type, [a === 1]) ? '1' : '0'}</td>
                      </tr>
                    ) : (
                      [0, 1].map(b => {
                        const q = evaluateGate(selectedNode.type, [a === 1, b === 1]);
                        return (
                          <tr key={`${a}-${b}`} className="border-b border-zinc-900/50">
                            <td className="py-2">{a}</td>
                            <td className="py-2">{b}</td>
                            <td className={`py-2 ${q ? 'text-[var(--accent)]' : ''}`}>{q ? '1' : '0'}</td>
                          </tr>
                        );
                      })
                    )
                  ))}
                </tbody>
              </table>
             ) : (
               <p className="text-[10px] font-mono text-zinc-600 italic">No truth table available for current selection.</p>
             )}
          </div>

          <div className="mt-auto pt-8 border-t border-zinc-800">
            <div className="flex flex-col">
              <span className="section-label mb-2">THERMAL ENVELOPE</span>
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="w-1/4 h-full bg-zinc-400"></div>
              </div>
              <div className="flex justify-between mt-2 text-[8px] font-mono text-zinc-500 uppercase">
                <span>Cool</span>
                <span>Critical</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Footer Rail */}
      <footer className="h-8 bg-zinc-900/50 border-t border-zinc-800 flex items-center px-10 justify-between">
        <div className="flex gap-6">
          <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Workspace: CMOS_XOR_V1.vl</span>
          <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Memory: {nodes.length * 0.4 + 4.2}GB / 16GB</span>
        </div>
        <div className="text-[9px] font-mono text-zinc-400">
          READY. REENTRANT SIMULATION ENGINE ACTIVE.
        </div>
      </footer>
    </div>
  );
}

