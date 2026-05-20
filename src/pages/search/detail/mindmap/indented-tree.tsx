import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'
import { Rect } from '@antv/g'
import {
  Badge,
  BaseBehavior,
  BaseNode,
  CommonEvent,
  ExtensionCategory,
  Graph,
  NodeEvent,
  Polyline,
  register,
  subStyleProps,
  treeToGraphData,
} from '@antv/g6'
import { useIsDarkTheme } from '@/themes'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import type { MindmapTreeNode } from './utils'

const ROOT_ID = 'root'
const TREE_EVENT = {
  COLLAPSE_EXPAND: 'search-mindmap-collapse-expand',
}

const NODE_COLORS = [
  '#0EA5E9',
  '#14B8A6',
  '#22C55E',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
]

let extensionRegistered = false

const warnedTokens = new Set<string>()

const readCssVar = (token: string, fallback: string) => {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--color-${token}`)
    .trim()
  // 失败即响：token 名失效（被删除 / 拼错 / 动态拼接出错）时 --color-* 会解析为空，
  // 静态 lint 无法覆盖运行期拼接，这里在 dev 下按 token 去重告警，使静默回退变成可见信号。
  if (import.meta.env.DEV && !value && !warnedTokens.has(token)) {
    warnedTokens.add(token)
    console.warn(
      `[design-token] --color-${token} 解析为空，回退到 ${fallback}。请确认 token 名是否有效。`,
    )
  }
  return value || fallback
}

class SearchIndentedNode extends BaseNode {
  constructor(options: any) {
    Object.assign(options.style, {
      ports: [
        { key: 'in', placement: 'right-bottom' as any },
        { key: 'out', placement: 'left-bottom' as any },
      ],
    })
    super(options)
  }

  get childrenData() {
    return (this.attributes as any).context?.model.getChildrenData(this.id)
  }

  override getKeyStyle(attributes: any) {
    const [width, height] = this.getSize(attributes)
    const keyStyle = super.getKeyStyle(attributes)
    return {
      width,
      height,
      ...keyStyle,
      fill: 'transparent',
    }
  }

  override drawKeyShape(attributes: any, container: any) {
    const keyStyle = this.getKeyStyle(attributes)
    return this.upsert('key', Rect, keyStyle, container)
  }

  override getLabelStyle(attributes: any) {
    if (attributes.label === false || !attributes.labelText) return false
    return subStyleProps(this.getGraphicStyle(attributes), 'label') as any
  }

  drawIconArea(attributes: any, container: any) {
    const [, height] = this.getSize(attributes)
    this.upsert(
      'icon-area',
      Rect,
      {
        fill: 'transparent',
        height: 30,
        width: 14,
        x: -7,
        y: height,
        zIndex: -1,
      },
      container,
    )
  }

  bindEvent(target: any, type: string, listener: (event: any) => void) {
    if (target && !Reflect.has(target, '__mindmapBind__')) {
      Reflect.set(target, '__mindmapBind__', true)
      target.addEventListener(type, listener)
    }
  }

  getCountStyle(attributes: any) {
    const { collapsed, color } = attributes
    if (!collapsed) return false
    const [, height] = this.getSize(attributes)
    return {
      backgroundFill: color,
      cursor: 'pointer',
      fill: '#fff',
      fontSize: 9,
      padding: [0, 10],
      text: `${this.childrenData?.length || 0}`,
      textAlign: 'center',
      y: height + 8,
    }
  }

  drawCountShape(attributes: any, container: any) {
    const countStyle = this.getCountStyle(attributes)
    const button = this.upsert('count', Badge, countStyle as any, container)
    this.bindEvent(button, CommonEvent.CLICK, (event: any) => {
      event.stopPropagation()
      attributes.context.graph.emit(TREE_EVENT.COLLAPSE_EXPAND, {
        id: this.id,
        collapsed: false,
      })
    })
  }

  shouldShowCollapse(attributes: any) {
    return (
      !attributes.collapsed &&
      Array.isArray(this.childrenData) &&
      this.childrenData.length > 0
    )
  }

  getCollapseStyle(attributes: any) {
    const { showIcon, color } = attributes
    if (!this.shouldShowCollapse(attributes)) return false
    const [, height] = this.getSize(attributes)
    return {
      visibility: showIcon ? 'visible' : 'hidden',
      backgroundFill: color,
      backgroundHeight: 12,
      backgroundWidth: 12,
      cursor: 'pointer',
      fill: '#fff',
      fontSize: 10,
      text: '−',
      textAlign: 'center',
      x: -1,
      y: height + 8,
    }
  }

  drawCollapseShape(attributes: any, container: any) {
    const iconStyle = this.getCollapseStyle(attributes)
    const button = this.upsert(
      'collapse-expand',
      Badge,
      iconStyle as any,
      container,
    )
    this.bindEvent(button, CommonEvent.CLICK, (event: any) => {
      event.stopPropagation()
      attributes.context.graph.emit(TREE_EVENT.COLLAPSE_EXPAND, {
        id: this.id,
        collapsed: !attributes.collapsed,
      })
    })
  }

  override render(attributes = this.parsedAttributes, container = this) {
    super.render(attributes, container)
    this.drawCountShape(attributes, container)
    this.drawIconArea(attributes, container)
    this.drawCollapseShape(attributes, container)
  }
}

class SearchIndentedEdge extends Polyline {
  override getControlPoints(attributes: any): any {
    const [sourcePoint, targetPoint] = this.getEndpoints(attributes, false)
    const [sourceX] = sourcePoint as [number, number]
    const [, targetY] = targetPoint as [number, number]
    return [[sourceX, targetY]]
  }
}

class CollapseExpandBehavior extends BaseBehavior {
  private status: 'idle' | 'busy' = 'idle'

  constructor(context: any, options: any) {
    super(context, options)
    this.bindEvents()
  }

  override update(options: any) {
    this.unbindEvents()
    super.update(options)
    this.bindEvents()
  }

  bindEvents() {
    const { graph } = this.context
    graph.on(NodeEvent.POINTER_ENTER, this.showIcon)
    graph.on(NodeEvent.POINTER_LEAVE, this.hideIcon)
    graph.on(TREE_EVENT.COLLAPSE_EXPAND, this.onCollapseExpand)
  }

  unbindEvents() {
    const { graph } = this.context
    graph.off(NodeEvent.POINTER_ENTER, this.showIcon)
    graph.off(NodeEvent.POINTER_LEAVE, this.hideIcon)
    graph.off(TREE_EVENT.COLLAPSE_EXPAND, this.onCollapseExpand)
  }

  showIcon = (event: any) => this.setIconVisibility(event, true)

  hideIcon = (event: any) => this.setIconVisibility(event, false)

  setIconVisibility = (event: any, visible: boolean) => {
    if (this.status !== 'idle') return
    const id = event?.target?.id
    if (!id) return
    const { graph, element } = this.context
    graph.updateNodeData([{ id, style: { showIcon: visible } }])
    element?.draw({ animation: false, silence: true })
  }

  onCollapseExpand = async (event: any) => {
    this.status = 'busy'
    const { graph } = this.context
    const id = event?.id
    const collapsed = event?.collapsed
    if (!id) {
      this.status = 'idle'
      return
    }
    if (collapsed) await graph.collapseElement(id)
    else await graph.expandElement(id)
    this.status = 'idle'
  }
}

const ensureRegisterExtensions = () => {
  if (extensionRegistered) return
  try {
    register(ExtensionCategory.NODE, 'search-indented', SearchIndentedNode)
  } catch {
    // ignore duplicate registration in hot reload
  }
  try {
    register(ExtensionCategory.EDGE, 'search-indented', SearchIndentedEdge)
  } catch {
    // ignore duplicate registration in hot reload
  }
  try {
    register(
      ExtensionCategory.BEHAVIOR,
      'search-collapse-expand',
      CollapseExpandBehavior,
    )
  } catch {
    // ignore duplicate registration in hot reload
  }
  extensionRegistered = true
}

export interface IndentedTreeRef {
  fitView: () => void
  collapseAll: () => Promise<void>
  expandAll: () => Promise<void>
}

interface IndentedTreeProps {
  data: MindmapTreeNode
  visible: boolean
}

const applyAllExpandState = async (graph: Graph, collapsed: boolean) => {
  const nodeData = (graph.getNodeData?.() || []) as Array<{ id?: string }>
  const ids = nodeData
    .map((node) => node.id)
    .filter((id): id is string => !!id && id !== ROOT_ID)
  const method = collapsed
    ? graph.collapseElement.bind(graph)
    : graph.expandElement.bind(graph)
  for (const id of ids) {
    try {
      await method(id)
    } catch {
      // ignore and continue
    }
  }
}

const IndentedTree = forwardRef<IndentedTreeRef, IndentedTreeProps>(
  ({ data, visible }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const graphRef = useRef<Graph | null>(null)
    const isDark = useIsDarkTheme()
    const theme = useMemo(() => {
      const palette = [
        readCssVar('data-viz-categorical-1', NODE_COLORS[0]),
        readCssVar('data-viz-categorical-2', NODE_COLORS[2]),
        readCssVar('data-viz-categorical-3', NODE_COLORS[1]),
        readCssVar('data-viz-categorical-4', NODE_COLORS[3]),
        readCssVar('data-viz-categorical-5', NODE_COLORS[4]),
        readCssVar('data-viz-categorical-6', NODE_COLORS[5]),
      ]

      return {
        palette,
        rootBackground: '#576286',
        rootText: '#fff',
        nodeBackground: isDark ? '#1E293B' : '#F1F5F9',
        nodeText: isDark ? '#E2E8F0' : '#1E293B',
        selectedBackground: isDark ? '#082F49' : '#e8f7ff',
        selectedText: '#40A8FF',
      }
    }, [isDark])
    const getNodeDepthById = useCallback((nodeId: string) => {
      if (!nodeId || nodeId === ROOT_ID) return 0
      return Math.max(nodeId.split('-').length - 1, 0)
    }, [])

    const renderGraph = useCallback(
      async (treeData: MindmapTreeNode) => {
        const container = containerRef.current
        if (!container) return

        ensureRegisterExtensions()
        graphRef.current?.destroy()

        const graph = new Graph({
          container,
          x: 60,
          node: {
            type: 'search-indented',
            style: {
              size: (datum: any) => {
                const text = (datum?.style?.labelText ||
                  datum?.labelText ||
                  datum?.originalId ||
                  '') as string
                const isRoot = datum?.id === ROOT_ID
                const width = Math.max(text.length * 6 + 10, isRoot ? 100 : 60)
                return [width, 20]
              },
              labelBackground: true,
              labelPadding: [2, 6],
              labelBackgroundRadius: 4,
              labelBackgroundFill: (datum: any) =>
                datum.id === ROOT_ID
                  ? theme.rootBackground
                  : theme.nodeBackground,
              labelFill: (datum: any) =>
                datum.id === ROOT_ID ? theme.rootText : theme.nodeText,
              labelFontWeight: (datum: any) =>
                datum.id === ROOT_ID ? 700 : 400,
              labelFontSize: (datum: any) => (datum.id === ROOT_ID ? 13 : 12),
              labelText: (datum: any) =>
                datum.style?.labelText ||
                datum.labelText ||
                datum.originalId ||
                (datum.id === ROOT_ID ? 'Mind Map' : ''),
              labelTextAlign: (datum: any) =>
                datum.id === ROOT_ID ? 'center' : 'left',
              labelTextBaseline: 'top',
              color: (datum: any) => {
                const depth = Number(datum?.depth ?? getNodeDepthById(datum.id))
                return theme.palette[depth % theme.palette.length]
              },
            },
            state: {
              selected: {
                lineWidth: 0,
                labelFill: theme.selectedText,
                labelBackground: true,
                labelFontWeight: 'normal',
                labelBackgroundFill: theme.selectedBackground,
                labelBackgroundRadius: 10,
              },
            },
          },
          edge: {
            type: 'search-indented',
            style: {
              radius: 16,
              lineWidth: 2,
              sourcePort: 'out',
              targetPort: 'in',
              stroke: (datum: any) => {
                const depth = Number(
                  datum?.sourceNode?.depth ?? getNodeDepthById(datum.source),
                )
                return theme.palette[depth % theme.palette.length]
              },
            },
          },
          layout: {
            type: 'indented',
            direction: 'LR',
            isHorizontal: true,
            indent: 40,
            getHeight: () => 20,
            getVGap: () => 10,
          },
          behaviors: [
            'drag-canvas',
            'zoom-canvas',
            'scroll-canvas',
            'search-collapse-expand',
            {
              type: 'click-select',
              enable: (event: any) =>
                event.targetType === 'node' && event.target.id !== ROOT_ID,
            },
          ],
        })

        graphRef.current = graph
        graph.setData(treeToGraphData(treeData as any))
        await graph.render()
        graph.fitView()
      },
      [getNodeDepthById, theme],
    )

    useImperativeHandle(
      ref,
      () => ({
        fitView: () => {
          graphRef.current?.fitView()
        },
        collapseAll: async () => {
          if (!graphRef.current) return
          await applyAllExpandState(graphRef.current, true)
        },
        expandAll: async () => {
          if (!graphRef.current) return
          await applyAllExpandState(graphRef.current, false)
        },
      }),
      [],
    )

    useEffect(() => {
      if (!data || !visible) return
      renderGraph(data)
      return () => {
        graphRef.current?.destroy()
        graphRef.current = null
      }
    }, [data, renderGraph, visible])

    useEffect(() => {
      if (!visible) return
      const container = containerRef.current
      const graph = graphRef.current
      if (!container || !graph) return

      const observer = new ResizeObserver(() => {
        graph.resize?.()
        graph.fitView()
      })
      observer.observe(container)
      return () => observer.disconnect()
    }, [visible])

    return (
      <ErrorBoundary
        fallback={(error, retry) => (
          <div className="gap-space-sm flex h-full flex-col items-center justify-center">
            <p className="text-sm text-status-error">{error.message}</p>
            <button
              type="button"
              onClick={retry}
              className="rounded-radius-md px-space-sm py-space-xs border border-border-default text-sm text-text-secondary hover:text-text-primary"
            >
              重试渲染
            </button>
          </div>
        )}
      >
        <div ref={containerRef} className="h-full w-full" />
      </ErrorBoundary>
    )
  },
)

IndentedTree.displayName = 'IndentedTree'

export default memo(IndentedTree)
