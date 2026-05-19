import type { Graph, IElementEvent } from '@antv/g6'

export interface GraphTooltipData {
  id: string
  title: string
  subtitle?: string
  x: number
  y: number
}

function getPointerPosition(event: IElementEvent, container: HTMLElement) {
  const { left, top } = container.getBoundingClientRect()
  const client = event.client

  return {
    x: Math.max((client?.x ?? left) - left, 0),
    y: Math.max((client?.y ?? top) - top, 0),
  }
}

export function getGraphTooltipData(
  graph: Graph,
  event: IElementEvent,
  container: HTMLElement,
): GraphTooltipData | null {
  const id = event.target?.id
  if (!id) return null

  const elementId = String(id)
  const elementType = graph.getElementType(elementId)
  const position = getPointerPosition(event, container)

  if (elementType === 'node') {
    const node = graph.getNodeData(elementId)
    const data = node.data ?? {}
    return {
      id: elementId,
      title: String(data.label ?? node.id),
      subtitle: data.entityType ? String(data.entityType) : undefined,
      ...position,
    }
  }

  if (elementType === 'edge') {
    const edge = graph.getEdgeData(elementId)
    return {
      id: elementId,
      title: String(edge.data?.label ?? edge.id),
      subtitle: `${edge.source} -> ${edge.target}`,
      ...position,
    }
  }

  if (elementType === 'combo') {
    const combo = graph.getComboData(elementId)
    return {
      id: elementId,
      title: String(combo.data?.label ?? combo.id),
      ...position,
    }
  }

  return null
}

interface GraphTooltipProps {
  data: GraphTooltipData | null
}

export function GraphTooltip({ data }: GraphTooltipProps) {
  if (!data) return null

  return (
    <div
      role="tooltip"
      className="rounded-radius-lg shadow-elevation-high pointer-events-none absolute z-20 max-w-64 border border-components-card-border bg-components-card-bg px-3 py-2 text-sm text-text-primary"
      style={{
        left: data.x,
        top: data.y,
        transform: 'translate(12px, -50%)',
      }}
    >
      <div className="truncate font-semibold">{data.title}</div>
      {data.subtitle && (
        <div className="mt-0.5 truncate text-xs uppercase text-text-muted">
          {data.subtitle}
        </div>
      )}
    </div>
  )
}
