import { GateNode, Connection, GateType } from '../types';

export const evaluateGate = (type: GateType, inputs: boolean[]): boolean => {
  switch (type) {
    case 'AND': return inputs[0] && inputs[1];
    case 'OR': return inputs[0] || inputs[1];
    case 'NOT': return !inputs[0];
    case 'XOR': return inputs[0] !== inputs[1];
    case 'NAND': return !(inputs[0] && inputs[1]);
    case 'NOR': return !(inputs[0] || inputs[1]);
    case 'SWITCH': return false; // Handled separately
    case 'BULB': return inputs[0];
    default: return false;
  }
};

export const simulateCircuit = (nodes: GateNode[], connections: Connection[]): GateNode[] => {
  const newNodes = [...nodes];
  const maxIterations = nodes.length * 2; // Simple way to handle propagation
  
  for (let i = 0; i < maxIterations; i++) {
    let changed = false;
    
    newNodes.forEach((node, idx) => {
      if (node.type === 'SWITCH') return;
      
      const inputConnections = connections.filter(c => c.toId === node.id);
      const inputValues: boolean[] = [];
      
      // Determine input values based on connections
      // We need to know which inputs are connected
      const numInputs = node.type === 'NOT' || node.type === 'BULB' ? 1 : 2;
      
      for (let inputIdx = 0; inputIdx < numInputs; inputIdx++) {
        const conn = inputConnections.find(c => c.toInputIndex === inputIdx);
        if (conn) {
          const fromNode = newNodes.find(n => n.id === conn.fromId);
          inputValues[inputIdx] = fromNode?.value ?? false;
        } else {
          inputValues[inputIdx] = false;
        }
      }
      
      const newValue = evaluateGate(node.type, inputValues);
      if (newValue !== node.value) {
        newNodes[idx] = { ...node, value: newValue };
        changed = true;
      }
    });
    
    if (!changed) break;
  }
  
  return newNodes;
};
