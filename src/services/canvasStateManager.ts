import { Node, Edge } from '@xyflow/react';

export interface CanvasState {
  project_id: string;
  nodes: Node[];
  edges: Edge[];
  assets: any[];
  tasks: any[];
  viewport: any;
  selected_node_id?: string;
  updated_at: number;
}

export function exportCanvasState(projectId: string, nodes: Node[], edges: Edge[], viewport: any = null): CanvasState {
  return {
    project_id: projectId,
    nodes: JSON.parse(JSON.stringify(nodes)),
    edges: JSON.parse(JSON.stringify(edges)),
    assets: [],
    tasks: [],
    viewport,
    updated_at: Date.now()
  };
}
