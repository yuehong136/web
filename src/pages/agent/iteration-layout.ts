import { Operator } from './constant'
import type { RAGFlowNodeType } from './types'

export const ITERATION_DEFAULT_SIZE = { width: 500, height: 250 } as const
export const ITERATION_MIN_SIZE = { width: 320, height: 160 } as const
export const ITERATION_FALLBACK_CHILD_SIZE = { width: 220, height: 90 } as const
export const ITERATION_RESIZE_PADDING = { x: 60, y: 60 } as const
export const ITERATION_START_OFFSET = { x: 24, y: 108 } as const

const ITERATION_START_NODE_WIDTH = 36
const ITERATION_START_CONTENT_GAP = 56
const ITERATION_CONTENT_TOP_PADDING = 24

export const ITERATION_CHILD_MIN_POSITION = {
  x:
    ITERATION_START_OFFSET.x +
    ITERATION_START_NODE_WIDTH +
    ITERATION_START_CONTENT_GAP,
  y: ITERATION_CONTENT_TOP_PADDING,
} as const

const ITERATION_CONTAINER_LABELS = new Set([
  Operator.Iteration,
  Operator.Loop,
])

const ITERATION_START_LABELS = new Set([
  Operator.IterationStart,
  Operator.LoopStart,
])

type NodeWithLabel = Pick<RAGFlowNodeType, 'data'>
type SizedNode = Pick<RAGFlowNodeType, 'measured' | 'width' | 'height'>

export function isIterationContainerLabel(label?: string) {
  return !!label && ITERATION_CONTAINER_LABELS.has(label as Operator)
}

export function isIterationStartLabel(label?: string) {
  return !!label && ITERATION_START_LABELS.has(label as Operator)
}

export function isIterationContainerNode(node?: NodeWithLabel | null) {
  return isIterationContainerLabel(node?.data?.label)
}

export function isIterationStartNode(node?: NodeWithLabel | null) {
  return isIterationStartLabel(node?.data?.label)
}

export function getFixedIterationStartPosition() {
  return { ...ITERATION_START_OFFSET }
}

export function clampIterationChildPosition(
  position?: { x: number; y: number },
) {
  if (!position) {
    return position
  }

  return {
    x: Math.max(ITERATION_CHILD_MIN_POSITION.x, position.x),
    y: Math.max(ITERATION_CHILD_MIN_POSITION.y, position.y),
  }
}

export function getIterationChildSize(node?: SizedNode | null) {
  return {
    width:
      node?.measured?.width ??
      node?.width ??
      ITERATION_FALLBACK_CHILD_SIZE.width,
    height:
      node?.measured?.height ??
      node?.height ??
      ITERATION_FALLBACK_CHILD_SIZE.height,
  }
}

export function isIterationContentChild(node?: RAGFlowNodeType | null) {
  return !!node?.parentId && node.draggable !== false && !isIterationStartNode(node)
}

export function getIterationContentChildren(
  nodes: RAGFlowNodeType[],
  parentId: string,
) {
  return nodes.filter(
    (node) => node.parentId === parentId && isIterationContentChild(node),
  )
}

export function normalizeIterationNodes(nodes: RAGFlowNodeType[]) {
  const lookup = new Map(nodes.map((node) => [node.id, node]))

  return nodes.map((node) => {
    if (isIterationStartNode(node) && node.parentId) {
      return {
        ...node,
        position: getFixedIterationStartPosition(),
        draggable: false,
        expandParent: false,
      }
    }

    if (!node.parentId) {
      return node
    }

    const parent = lookup.get(node.parentId)
    if (!isIterationContainerNode(parent)) {
      return node
    }

    return {
      ...node,
      position: isIterationContentChild(node)
        ? clampIterationChildPosition(node.position)
        : node.position,
      expandParent: false,
    }
  })
}
