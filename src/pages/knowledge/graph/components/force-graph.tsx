import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Graph,
  GraphEvent,
  type IElementEvent,
  type NodeData,
  type EdgeData,
  type ComboData,
} from '@antv/g6'
import { useIsDarkTheme } from '@/themes'
import type { KnowledgeGraph } from '@/types/api'
import {
  COMBO_LAYOUT_CONFIG,
  FORCE_LAYOUT_CONFIG,
  DEFAULT_COMBO_LABEL,
} from '../constants'
import { getCategoricalPalette, type ThemeMode } from '@/lib/design-tokens'
import { LayoutMode } from '../types'
import { detectLayoutMode } from '../utils'
import { buildGraphRenderData } from '../graph-data'
import { getGraphTheme } from './graph-theme'
import { buildTypeColorMap } from './graph-node-colors'
import {
  getGraphTooltipData,
  GraphTooltip,
  type GraphTooltipData,
} from './graph-tooltip'
import { buildSelectedNodeStatePatch } from './selection-state'

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

export const ForceGraph = forwardRef<ForceGraphHandle, ForceGraphProps>(
  ({ data, selectedNodeId, onNodeClick, onEdgeClick, onCanvasClick }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const graphRef = useRef<Graph | null>(null)
    const pendingRenderRef = useRef(new WeakMap<Graph, Promise<void>>())
    const selectedNodeIdRef = useRef(selectedNodeId)
    const prevSelectedNodeIdRef = useRef<string | undefined>(undefined)
    const [tooltip, setTooltip] = useState<GraphTooltipData | null>(null)
    const isDark = useIsDarkTheme()
    const theme: ThemeMode = isDark ? 'dark' : 'light'
    selectedNodeIdRef.current = selectedNodeId

    const nodeTypes = useMemo(
      () => [...new Set(data.nodes.map((n) => n.type).filter(Boolean))],
      [data.nodes],
    )
    // theme 作为依赖触发重算：data-viz-categorical-* 的值按主题切换。
    const colorMap = useMemo(
      () => buildTypeColorMap(nodeTypes, theme),
      [nodeTypes, theme],
    )

    const layoutMode = useMemo(() => detectLayoutMode(data), [data])

    const graphData = useMemo(
      () => buildGraphRenderData(data, layoutMode),
      [data, layoutMode],
    )

    const handleGraphError = useCallback((graph: Graph, error: unknown) => {
      if (graph.destroyed || graphRef.current !== graph) return
      console.error(error)
    }, [])

    const runGraphAction = useCallback(
      (action: (graph: Graph) => Promise<void>) => {
        const graph = graphRef.current
        if (!graph || graph.destroyed) return
        void action(graph).catch((error) => handleGraphError(graph, error))
      },
      [handleGraphError],
    )

    const destroyGraph = useCallback((graph: Graph | null) => {
      if (!graph || graph.destroyed) return
      const pendingRender = pendingRenderRef.current.get(graph)
      if (pendingRender) {
        void pendingRender.finally(() => {
          if (!graph.destroyed) {
            graph.destroy()
          }
        })
        return
      }
      graph.destroy()
    }, [])

    const applySelectedState = useCallback(
      (graph: Graph, nodeId?: string) => {
        if (graph.destroyed || graphRef.current !== graph || !graph.rendered)
          return
        const states = buildSelectedNodeStatePatch(
          graph,
          prevSelectedNodeIdRef.current,
          nodeId,
        )
        prevSelectedNodeIdRef.current = nodeId
        if (Object.keys(states).length === 0) return

        void graph.setElementState(states, false).catch((error) => {
          handleGraphError(graph, error)
        })
      },
      [handleGraphError],
    )

    useImperativeHandle(
      ref,
      () => ({
        zoomIn: () =>
          runGraphAction((graph) => graph.zoomBy(1.3, { duration: 300 })),
        zoomOut: () =>
          runGraphAction((graph) => graph.zoomBy(0.7, { duration: 300 })),
        fitView: () =>
          runGraphAction((graph) =>
            graph.fitView(undefined, { duration: 400 }),
          ),
      }),
      [runGraphAction],
    )

    const render = useCallback(() => {
      const container = containerRef.current
      if (!container) return

      const palette = getCategoricalPalette(theme)
      const graphTheme = getGraphTheme(theme)

      const graph = new Graph({
        container,
        autoFit: 'view',
        autoResize: true,
        padding: 60,
        behaviors: [
          'drag-canvas',
          'zoom-canvas',
          'drag-element',
          { type: 'hover-activate', degree: 1 },
          ...(layoutMode === LayoutMode.COMBO
            ? ['collapse-expand' as const]
            : []),
        ],
        plugins: [
          {
            type: 'grid-line',
            size: 40,
            stroke: graphTheme.workspaceBorderColor,
          },
        ],
        layout:
          layoutMode === LayoutMode.COMBO
            ? COMBO_LAYOUT_CONFIG
            : FORCE_LAYOUT_CONFIG,
        node: {
          style: {
            size: (d: NodeData) => {
              const rank = (d.data?.rank as number) || 1
              return Math.min(Math.max(24 + rank * 4, 24), 72)
            },
            fill: (d: NodeData) => {
              const type = d.data?.entityType as string
              return colorMap[type] || palette[0]
            },
            stroke: (d: NodeData) => {
              const type = d.data?.entityType as string
              const base = colorMap[type] || palette[0]
              return `${base}44`
            },
            lineWidth: 2,
            shadowColor: graphTheme.borderColor,
            shadowBlur: 12,
            shadowOffsetY: 4,
            labelText: (d: NodeData) => {
              const label = (d.data?.label as string) || d.id
              return label.length > 10 ? `${label.slice(0, 10)}...` : label
            },
            labelFill: graphTheme.textColor,
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
              stroke: graphTheme.accentColor,
              shadowBlur: 24,
              shadowColor: graphTheme.focusColor,
            },
          },
        },
        edge: {
          style: {
            stroke: graphTheme.edgeColor,
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
            labelFill: graphTheme.textColorSub,
            labelFontSize: 10,
            labelBackground: true,
            labelBackgroundFill: graphTheme.surfaceColor,
            labelBackgroundRadius: 4,
            labelPadding: [2, 6],
          },
          state: {
            active: {
              stroke: graphTheme.edgeActiveColor,
              lineWidth: 2.5,
            },
            inactive: {
              opacity: 0.12,
            },
          },
        },
        combo: {
          style: (d: ComboData) => {
            if (d.data?.label === DEFAULT_COMBO_LABEL) {
              return { stroke: 'transparent', fill: 'transparent' }
            }
            return {
              stroke: graphTheme.workspaceBorderColor,
              fill: graphTheme.surfaceSubtleColor,
              lineWidth: 1,
              lineDash: [4, 4],
            }
          },
        },
      })

      destroyGraph(graphRef.current)
      graphRef.current = graph
      prevSelectedNodeIdRef.current = undefined

      graph.setData(graphData)

      graph.once(GraphEvent.AFTER_LAYOUT, () => {
        if (graph.destroyed || graphRef.current !== graph) return
        void graph
          .fitView(undefined, { duration: 500 })
          .catch((error) => handleGraphError(graph, error))
      })

      graph.on('node:click', (e: IElementEvent) => {
        if (graph.destroyed || graphRef.current !== graph) return
        const nodeId = e.target?.id
        if (nodeId) onNodeClick(String(nodeId))
      })

      graph.on('edge:click', (e: IElementEvent) => {
        if (graph.destroyed || graphRef.current !== graph) return
        const edgeId = e.target?.id
        if (edgeId) onEdgeClick(String(edgeId))
      })

      const showTooltip = (event: IElementEvent) => {
        if (graph.destroyed || graphRef.current !== graph) return
        setTooltip(getGraphTooltipData(graph, event, container))
      }

      const hideTooltip = () => {
        if (graph.destroyed || graphRef.current !== graph) return
        setTooltip(null)
      }

      graph.on('node:pointerover', showTooltip)
      graph.on('node:pointermove', showTooltip)
      graph.on('edge:pointerover', showTooltip)
      graph.on('edge:pointermove', showTooltip)
      graph.on('combo:pointerover', showTooltip)
      graph.on('combo:pointermove', showTooltip)
      graph.on('canvas:pointermove', hideTooltip)
      graph.on('node:drag', hideTooltip)
      graph.on('canvas:click', hideTooltip)

      graph.on('canvas:click', () => {
        if (graph.destroyed || graphRef.current !== graph) return
        onCanvasClick()
      })

      const renderTask = graph
        .render()
        .then(() => {
          applySelectedState(graph, selectedNodeIdRef.current)
        })
        .catch((error) => {
          handleGraphError(graph, error)
        })
        .finally(() => {
          pendingRenderRef.current.delete(graph)
        })
      pendingRenderRef.current.set(graph, renderTask)
    }, [
      graphData,
      colorMap,
      theme,
      onNodeClick,
      onEdgeClick,
      onCanvasClick,
      layoutMode,
      destroyGraph,
      handleGraphError,
      applySelectedState,
    ])

    useEffect(() => {
      if (graphData.nodes.length > 0) {
        render()
      }
      return () => {
        const graph = graphRef.current
        graphRef.current = null
        prevSelectedNodeIdRef.current = undefined
        setTooltip(null)
        destroyGraph(graph)
      }
    }, [render, graphData.nodes.length, destroyGraph])

    useEffect(() => {
      const graph = graphRef.current
      if (!graph) return
      applySelectedState(graph, selectedNodeId)
    }, [applySelectedState, selectedNodeId])

    return (
      <div ref={containerRef} className="relative h-full w-full">
        <GraphTooltip data={tooltip} />
      </div>
    )
  },
)

ForceGraph.displayName = 'ForceGraph'
