export type FlowNodeKind =
  | "start"
  | "end"
  | "process"
  | "subprocess"
  | "decision"
  | "document"
  | "database"
  | "input"
  | "output"
  | "manual"
  | "automatic"
  | "approval"
  | "rejection"
  | "comment"
  | "timer"
  | "event";

export interface FlowNodeData {
  kind: FlowNodeKind;
  title: string;
  responsible?: string;
  department?: string;
  notes?: string;
  color?: string;
}

export interface OrgNodeData {
  name: string;
  role?: string;
  department?: string;
  email?: string;
  phone?: string;
  code?: string;
}

export interface AIFlowResult {
  nodes: {
    id: string;
    kind: FlowNodeKind;
    title: string;
    responsible?: string;
  }[];
  edges: {
    source: string;
    target: string;
    label?: string;
  }[];
  warnings?: string[];
}

export interface AIOrgResult {
  nodes: {
    id: string;
    name: string;
    role?: string;
    department?: string;
  }[];
  edges: {
    source: string;
    target: string;
  }[];
}

export interface ProjectSummary {
  id: string;
  name: string;
  type: "flowchart" | "orgchart";
  author: string;
  status: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface ProjectRecord extends ProjectSummary {
  data: {
    nodes: any[];
    edges: any[];
  };
}
