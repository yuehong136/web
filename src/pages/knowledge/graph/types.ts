import type { KnowledgeGraph } from '@/types/api'

export type GraphNode = KnowledgeGraph['nodes'][number]
export type GraphEdge = KnowledgeGraph['edges'][number]

export type SelectedElement =
  | { type: 'node'; data: GraphNode; neighbors: GraphNode[]; edges: GraphEdge[] }
  | { type: 'edge'; data: GraphEdge; source: GraphNode | undefined; target: GraphNode | undefined }

export interface GraphStats {
  nodeCount: number
  edgeCount: number
  nodeTypes: string[]
}

export enum LayoutMode {
  COMBO = 'combo',
  FORCE = 'force',
}
