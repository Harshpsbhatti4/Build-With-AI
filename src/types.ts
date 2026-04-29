export type GateType = 'AND' | 'OR' | 'NOT' | 'XOR' | 'NAND' | 'NOR' | 'SWITCH' | 'BULB';

export interface Position {
  x: number;
  y: number;
}

export interface GateNode {
  id: string;
  type: GateType;
  position: Position;
  inputs: (string | null)[]; // IDs of sensors/outputs connected to these inputs
  value: boolean;
}

export interface Connection {
  id: string;
  fromId: string; // ID of the gate/switch that provides the output
  toId: string;   // ID of the gate/bulb that receives the input
  toInputIndex: number;
}

export interface CircuitState {
  nodes: GateNode[];
  connections: Connection[];
}
