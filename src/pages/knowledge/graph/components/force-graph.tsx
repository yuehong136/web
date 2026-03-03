import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'
import { Graph, type IElementEvent, type ElementDatum, type NodeData, type EdgeData } from '@antv/g6'
import { useIsDarkTheme } from '@/themes'
import type { KnowledgeGraph } from '@/types/api'
import { NODE_TYPE_PALETTE, NODE_TYPE_PALETTE_DARK } from '../constants'

interface ForceGraphProps {
  data: KnowledgeGraph
  selectedNodeId?: string
  onNodeClick: (nodeId: string) => void
  onEdgeClick: (edgeId: string) => void
  onCanvasClick: () => void
}

export interface ForceGraphHandle {
  zoomIn: () => void
  zoomOut: () => void
  fitView: () => void
}

function buildTypeColorMap(types: string[], isDark: boolean) {
  const palette = isDark ? NODE_TYPE_PALETTE_DARK : NODE_TYPE_PALETTE
  const map: Record<string, string> = {}
  types.forEach((t, i) => {
    map[t] = palette[i % palette.length]
  })
  return map
}

export const ForceGraph = forwardRef<ForceGraphHandle, ForceGraphProps>(
  ({ data, selectedNodeId, onNodeClick, onEdgeClick, onCanvasClick }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const graphRef = useRef<Graph | null>(null)
    const isDark = useIsDarkTheme()

    const nodeTypes = useMemo(
      () => [...new Set(data.nodes.map((n) => n.type).filter(Boolean))],
      [data.nodes],
    )
    const colorMap = useMemo(
      () => buildTypeColorMap(nodeTypes, isDark),
      [nodeTypes, isDark],
    )

    const graphData = useMemo(() => {
      return {
        nodes: data.nodes.map((n) => ({
          id: n.id,
          data: {
            label: n.label,
            entityType: n.type,
            properties: n.properties,
            rank: n.properties?.rank ?? n.properties?.weight ?? 1,
          },
        })),
        edges: data.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          data: {
            label: e.label,
            weight: e.properties?.weight ?? 1,
            properties: e.properties,
          },
        })),
      }
    }, [data])

    useImperativeHandle(ref, () => ({
      zoomIn: () => graphRef.current?.zoomBy(1.3, { duration: 300 }),
      zoomOut: () => graphRef.current?.zoomBy(0.7, { duration: 300 }),
      fitView: () => graphRef.current?.fitView(undefined, { duration: 400 }),
    }))

    const textColor = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)'
    const textColorSub = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)'
    const edgeColor = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)'
    const edgeActiveColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)'

    const render = useCallback(() => {
      if (!containerRef.current) return

      const graph = new Graph({
        container: containerRef.current,
        autoFit: 'view',
        autoResize: true,
        padding: 60,
        behaviors: [
          'drag-canvas',
          'zoom-canvas',
          'drag-element',
          { type: 'hover-activate', degree: 1 },
        ],
        plugins: [
          {
            type: 'tooltip',
            enterable: true,
            getContent: (_e: IElementEvent, items: ElementDatum[]) => {
              if (!Array.isArray(items) || items.length === 0) return undefined
              const item = items[0]
              if (item?.data?.label) {
                return `<div style="padding:6px 10px;font-size:13px;max-width:260px;line-height:1.5;color:${textColor};background:${isDark ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.97)'};border-radius:8px;border:1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'};box-shadow:0 4px 16px ${isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.08)'}">
                  <div style="font-weight:600;margin-bottom:2px">${item.data.label}</div>
                  ${item.data.entityType ? `<div style="font-size:11px;color:${textColorSub}">${item.data.entityType}</div>` : ''}
                </div>`
              }
              if (item?.id) {
                return `<div style="padding:4px 8px;font-size:12px;color:${textColorSub};background:${isDark ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.97)'};border-radius:6px;border:1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}">${item.id}</div>`
              }
              return undefined
            },
          },
          {
            type: 'grid-line',
            size: 40,
            stroke: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
          },
        ],
        layout: {
          type: 'd3-force',
          preventOverlap: true,
          nodeSize: 60,
          linkDistance: 180,
          forceSimulation: {
            alphaDecay: 0.02,
            alphaMin: 0.001,
          },
        },
        node: {
          style: {
            size: (d: NodeData) => {
              const rank = (d.data?.rank as number) || 1
              return Math.min(Math.max(24 + rank * 4, 24), 72)
            },
            fill: (d: NodeData) => {
              const type = d.data?.entityType as string
              return colorMap[type] || (isDark ? '#818cf8' : '#6366f1')
            },
            stroke: (d: NodeData) => {
              const type = d.data?.entityType as string
              const base = colorMap[type] || (isDark ? '#818cf8' : '#6366f1')
              return `${base}44`
            },
            lineWidth: 2,
            shadowColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.08)',
            shadowBlur: 12,
            shadowOffsetY: 4,
            labelText: (d: NodeData) => {
              const label = (d.data?.label as string) || d.id
              return label.length > 10 ? `${label.slice(0, 10)}...` : label
            },
            labelFill: textColor,
            labelFontSize: 11,
            labelFontWeight: 500,
            labelOffsetY: 4,
            labelPlacement: 'center',
            labelWordWrap: true,
            labelMaxWidth: 80,
          },
          state: {
            active: {
              lineWidth: 3,
              shadowBlur: 20,
            },
            inactive: {
              opacity: 0.25,
            },
            selected: {
              lineWidth: 4,
              stroke: isDark ? '#a78bfa' : '#6366f1',
              shadowBlur: 24,
              shadowColor: isDark ? 'rgba(167,139,250,0.4)' : 'rgba(99,102,241,0.3)',
            },
          },
        },
        edge: {
          style: {
            stroke: edgeColor,
            lineWidth: (d: EdgeData) => {
              const weight = Number(d.data?.weight) || 1
              return Math.min(Math.max(weight * 1.5, 1), 5)
            },
            endArrow: true,
            endArrowSize: 6,
            labelText: (d: EdgeData) => {
              const label = d.data?.label as string
              if (!label) return ''
              return label.length > 12 ? `${label.slice(0, 12)}...` : label
            },
            labelFill: textColorSub,
            labelFontSize: 10,
            labelBackground: true,
            labelBackgroundFill: isDark ? 'rgba(20,20,25,0.8)' : 'rgba(255,255,255,0.8)',
            labelBackgroundRadius: 4,
            labelPadding: [2, 6],
          },
          state: {
            active: {
              stroke: edgeActiveColor,
              lineWidth: 2.5,
            },
            inactive: {
              opacity: 0.12,
            },
          },
        },
      })

      if (graphRef.current) {
        graphRef.current.destroy()
      }
      graphRef.current = graph

      graph.setData(graphData)
      graph.render()

      graph.on('node:click', (e: IElementEvent) => {
        const nodeId = e.target?.id
        if (nodeId) onNodeClick(String(nodeId))
      })

      graph.on('edge:click', (e: IElementEvent) => {
        const edgeId = e.target?.id
        if (edgeId) onEdgeClick(String(edgeId))
      })

      graph.on('canvas:click', () => {
        onCanvasClick()
      })
    }, [graphData, colorMap, isDark, textColor, textColorSub, edgeColor, edgeActiveColor, onNodeClick, onEdgeClick, onCanvasClick])

    useEffect(() => {
      if (graphData.nodes.length > 0) {
        render()
      }
      return () => {
        if (graphRef.current) {
          graphRef.current.destroy()
          graphRef.current = null
        }
      }
    }, [render, graphData.nodes.length])

    useEffect(() => {
      const graph = graphRef.current
      if (!graph) return
      try {
        graph.setElementState(
          Object.fromEntries(graph.getNodeData().map((n) => [n.id, []])),
        )
        if (selectedNodeId) {
          graph.setElementState({ [selectedNodeId]: ['selected'] })
        }
      } catch {
        // graph not ready yet
      }
    }, [selectedNodeId])

    return (
      <div
        ref={containerRef}
        className="w-full h-full"
      />
    )
  },
)

ForceGraph.displayName = 'ForceGraph'
