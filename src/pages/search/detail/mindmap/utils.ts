export interface MindmapTreeNode {
  id?: string
  labelText?: string
  name?: string
  title?: string
  text?: string
  value?: string
  children?: MindmapTreeNode[]
  [key: string]: unknown
}

export interface MindmapFallbackChunk {
  docnm_kwd?: string
  content_with_weight?: string
  highlight?: string
  text?: string
}

interface GraphNode {
  id: string
  label?: string
  name?: string
  title?: string
  text?: string
  value?: string
  [key: string]: unknown
}

interface GraphEdge {
  source?: string
  target?: string
}

/** Names for nodes the payload leaves unnamed, in the interface language. */
export interface MindmapLabels {
  /** A root the payload does not name. */
  root: string
  /** A tree node without any label field. */
  untitled: string
  /** A graph node without a label, numbered from 1. */
  node: (index: number) => string
  /** A retrieved chunk without a document name. */
  untitledDocument: string
}

const ROOT_ID = 'root'

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const toNodeLabel = (
  node: Record<string, unknown>,
  fallback: string,
): string => {
  const labelFields = [
    node.labelText,
    node.label,
    node.name,
    node.title,
    node.text,
    node.value,
    node.id,
  ]
  const resolved = labelFields.find(
    (field) => typeof field === 'string' && field.trim().length > 0,
  )
  return typeof resolved === 'string' ? resolved.trim() : fallback
}

const assignNodeIds = (
  node: MindmapTreeNode,
  labels: MindmapLabels,
  currentId = ROOT_ID,
): MindmapTreeNode => {
  const isRoot = currentId === ROOT_ID
  const originalId =
    typeof node.id === 'string' && node.id.trim() ? node.id : ''
  const labelText = toNodeLabel(
    node,
    originalId || (isRoot ? labels.root : labels.untitled),
  )
  const children = Array.isArray(node.children)
    ? node.children.map((child, childIndex) =>
        assignNodeIds(child, labels, `${currentId}-${childIndex}`),
      )
    : undefined

  return {
    ...node,
    id: currentId,
    labelText,
    originalId,
    children,
  }
}

const fromGraph = (
  nodes: GraphNode[],
  edges: GraphEdge[],
  labels: MindmapLabels,
): MindmapTreeNode | null => {
  if (!nodes.length) return null

  const nodeMap = new Map<string, MindmapTreeNode>()
  const incoming = new Map<string, number>()

  nodes.forEach((node, index) => {
    const id = node.id || `node-${index}`
    nodeMap.set(id, {
      ...node,
      id,
      labelText: toNodeLabel(node, labels.node(index + 1)),
      children: [],
    })
    incoming.set(id, 0)
  })

  edges.forEach((edge) => {
    if (!edge.source || !edge.target) return
    const sourceNode = nodeMap.get(edge.source)
    const targetNode = nodeMap.get(edge.target)
    if (!sourceNode || !targetNode) return
    sourceNode.children = sourceNode.children || []
    sourceNode.children.push(targetNode)
    incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1)
  })

  const rootCandidate = Array.from(nodeMap.values()).find(
    (node) => (incoming.get(node.id || '') || 0) === 0,
  )
  return rootCandidate || Array.from(nodeMap.values())[0]
}

const toTreeNode = (
  payload: unknown,
  labels: MindmapLabels,
): MindmapTreeNode | null => {
  if (!payload) return null

  if (Array.isArray(payload)) {
    if (!payload.length) return null
    return {
      id: ROOT_ID,
      labelText: labels.root,
      children: payload
        .filter((item): item is MindmapTreeNode => isObject(item))
        .map((item) => ({ ...item })),
    }
  }

  if (!isObject(payload)) return null

  if (isObject(payload.data)) return toTreeNode(payload.data, labels)
  if (isObject(payload.root)) return toTreeNode(payload.root, labels)

  const nodes = Array.isArray(payload.nodes)
    ? (payload.nodes as GraphNode[])
    : null
  const edges = Array.isArray(payload.edges)
    ? (payload.edges as GraphEdge[])
    : null
  if (nodes && edges) return fromGraph(nodes, edges, labels)

  if (
    Array.isArray(payload.children) ||
    typeof payload.label === 'string' ||
    typeof payload.name === 'string' ||
    typeof payload.id === 'string'
  ) {
    return payload as MindmapTreeNode
  }

  const candidates = ['tree', 'mindmap', 'mind_map']
  for (const key of candidates) {
    if (isObject(payload[key])) {
      return toTreeNode(payload[key], labels)
    }
  }

  return null
}

export const normalizeMindmapTree = (
  payload: unknown,
  labels: MindmapLabels,
): MindmapTreeNode | null => {
  const tree = toTreeNode(payload, labels)
  if (!tree) return null
  return assignNodeIds(tree, labels, ROOT_ID)
}

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const truncate = (value: string, max = 44) => {
  if (value.length <= max) return value
  return `${value.slice(0, max).trim()}...`
}

export const buildFallbackMindmapTree = (
  question: string,
  chunks: MindmapFallbackChunk[],
  labels: MindmapLabels,
): MindmapTreeNode | null => {
  const normalizedQuestion = question.trim()
  if (!normalizedQuestion) return null

  const grouped = new Map<string, string[]>()
  chunks.forEach((chunk) => {
    const docName = chunk.docnm_kwd?.trim() || labels.untitledDocument
    const raw = chunk.highlight || chunk.content_with_weight || chunk.text || ''
    const snippet = truncate(stripHtml(raw))
    if (!snippet) return
    if (!grouped.has(docName)) grouped.set(docName, [])
    const list = grouped.get(docName)!
    if (list.length < 2) list.push(snippet)
  })

  const docNodes = Array.from(grouped.entries())
    .slice(0, 8)
    .map(([docName, snippets]) => ({
      labelText: docName,
      children: snippets.map((snippet) => ({ labelText: snippet })),
    }))

  return normalizeMindmapTree(
    {
      id: ROOT_ID,
      labelText: normalizedQuestion,
      children: docNodes,
    },
    labels,
  )
}
