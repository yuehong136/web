import type {
  Connection,
  Edge,
  EdgeChange,
  EdgeMouseHandler,
  NodePositionChange,
  NodeChange,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
  OnSelectionChangeFunc,
  OnSelectionChangeParams,
} from '@xyflow/react'
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
} from '@xyflow/react'
import differenceWith from 'lodash/differenceWith.js'
import intersectionWith from 'lodash/intersectionWith.js'
import omit from 'lodash/omit.js'
import lodashSet from 'lodash/set.js'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { NodeHandleId, Operator, SwitchElseTo } from './constant'
import {
  clampIterationChildPosition,
  getFixedIterationStartPosition,
  getIterationChildSize,
  getIterationContentChildren,
  isIterationContainerNode,
  isIterationContentChild,
  isIterationStartNode,
  ITERATION_DEFAULT_SIZE,
  ITERATION_MIN_SIZE,
  ITERATION_RESIZE_PADDING,
  normalizeIterationNodes,
} from './iteration-layout'
import {
  duplicateNodeForm,
  generateDuplicateNode,
  generateNodeNamesWithIncreasingIndex,
  getOperatorIndex,
  isEdgeEqual,
  mapEdgeMouseEvent,
} from './utils'
import { deleteAllDownstreamAgentsAndTool } from './utils/delete-node'
import type { RAGFlowNodeType } from './types'

function getIterationParentIds(
  nodes: RAGFlowNodeType[],
  changes: NodeChange<RAGFlowNodeType>[],
) {
  const lookup = new Map(nodes.map((node) => [node.id, node]))

  return new Set(
    changes.flatMap((change) => {
      if (!('id' in change)) {
        return []
      }

      const node = lookup.get(change.id)
      if (!node?.parentId) {
        return []
      }

      const parent = lookup.get(node.parentId)
      return isIterationContainerNode(parent) ? [node.parentId] : []
    }),
  )
}

function resizeIterationContainers(
  nodes: RAGFlowNodeType[],
  parentIds: Iterable<string>,
) {
  const updates = new Map<
    string,
    Pick<RAGFlowNodeType, 'width' | 'height'>
  >()

  for (const parentId of parentIds) {
    const parent = nodes.find((node) => node.id === parentId)
    if (!parent || !isIterationContainerNode(parent)) {
      continue
    }
    const parentNode = parent as RAGFlowNodeType

    const children = getIterationContentChildren(nodes, parentId)
    if (children.length === 0) {
      continue
    }

    const maxRight = Math.max(
      ...children.map((child) => {
        const size = getIterationChildSize(child)
        return child.position.x + size.width
      }),
    )
    const maxBottom = Math.max(
      ...children.map((child) => {
        const size = getIterationChildSize(child)
        return child.position.y + size.height
      }),
    )

    const currentWidth =
      parentNode.width ??
      parentNode.measured?.width ??
      ITERATION_DEFAULT_SIZE.width
    const currentHeight =
      parentNode.height ??
      parentNode.measured?.height ??
      ITERATION_DEFAULT_SIZE.height
    const nextWidth = Math.max(
      currentWidth,
      ITERATION_MIN_SIZE.width,
      maxRight + ITERATION_RESIZE_PADDING.x,
    )
    const nextHeight = Math.max(
      currentHeight,
      ITERATION_MIN_SIZE.height,
      maxBottom + ITERATION_RESIZE_PADDING.y,
    )

    if (nextWidth > currentWidth || nextHeight > currentHeight) {
      updates.set(parentId, { width: nextWidth, height: nextHeight })
    }
  }

  if (updates.size === 0) {
    return nodes
  }

  return nodes.map((node) => {
    const update = updates.get(node.id)
    return update ? { ...node, ...update } : node
  })
}

function normalizeIterationNodeChanges(
  nodes: RAGFlowNodeType[],
  changes: NodeChange<RAGFlowNodeType>[],
) {
  const lookup = new Map(nodes.map((node) => [node.id, node]))

  return changes.map((change) => {
    if (change.type !== 'position' || !change.position) {
      return change
    }

    const positionChange = change as NodePositionChange
    const node = lookup.get(change.id)
    if (!node?.parentId) {
      return change
    }

    if (isIterationStartNode(node)) {
      return {
        ...positionChange,
        position: getFixedIterationStartPosition(),
      }
    }

    const parent = lookup.get(node.parentId)
    if (!isIterationContainerNode(parent) || !isIterationContentChild(node)) {
      return change
    }

    return {
      ...positionChange,
      position: clampIterationChildPosition(change.position),
    }
  })
}

export type RFState = {
  nodes: RAGFlowNodeType[]
  edges: Edge[]
  selectedNodeIds: string[]
  selectedEdgeIds: string[]
  clickedNodeId: string // currently selected node
  clickedToolId: string // currently selected tool id
  onNodesChange: OnNodesChange<RAGFlowNodeType>
  onEdgesChange: OnEdgesChange
  onEdgeMouseEnter?: EdgeMouseHandler<Edge>
  onEdgeMouseLeave?: EdgeMouseHandler<Edge>
  onConnect: OnConnect
  setNodes: (nodes: RAGFlowNodeType[]) => void
  setEdges: (edges: Edge[]) => void
  setEdgesByNodeId: (nodeId: string, edges: Edge[]) => void
  updateNodeForm: (
    nodeId: string,
    values: unknown,
    path?: (string | number)[],
  ) => RAGFlowNodeType[]
  onSelectionChange: OnSelectionChangeFunc
  addNode: (nodes: RAGFlowNodeType) => void
  getNode: (id?: string | null) => RAGFlowNodeType | undefined
  updateNode: (node: RAGFlowNodeType) => void
  addEdge: (connection: Connection) => void
  getEdge: (id: string) => Edge | undefined
  updateFormDataOnConnect: (connection: Connection) => void
  updateSwitchFormData: (
    source: string,
    sourceHandle?: string | null,
    target?: string | null,
    isConnecting?: boolean,
  ) => void
  duplicateNode: (id: string, name: string) => void
  duplicateIterationNode: (id: string, name: string) => void
  deleteEdge: () => void
  deleteEdgeById: (id: string) => void
  deleteNodeById: (id: string) => void
  deleteAgentDownstreamNodesById: (id: string) => void
  deleteAgentToolNodeById: (id: string) => void
  deleteIterationNodeById: (id: string) => void
  findNodeByName: (operatorName: Operator) => RAGFlowNodeType | undefined
  updateMutableNodeFormItem: (id: string, field: string, value: unknown) => void
  getOperatorTypeFromId: (id?: string | null) => string | undefined
  getParentIdById: (id?: string | null) => string | undefined
  updateNodeName: (id: string, name: string) => void
  generateNodeName: (name: string) => string
  setClickedNodeId: (id?: string) => void
  setClickedToolId: (id?: string) => void
  findUpstreamNodeById: (id?: string | null) => RAGFlowNodeType | undefined
  deleteEdgesBySourceAndSourceHandle: (
    source: string,
    sourceHandle: string,
  ) => void
  findAgentToolNodeById: (id: string | null) => string | undefined
  selectNodeIds: (nodeIds: string[]) => void
  hasChildNode: (nodeId: string) => boolean
  hasDownstreamNode: (nodeId: string) => boolean
  hasUpstreamNode: (nodeId: string) => boolean
  resizeIterationContainer: (parentId: string) => void
}

const useGraphStore = create<RFState>()(
  immer((set, get) => ({
    nodes: [] as RAGFlowNodeType[],
    edges: [] as Edge[],
    selectedNodeIds: [] as string[],
    selectedEdgeIds: [] as string[],
    clickedNodeId: '',
    clickedToolId: '',

    onNodesChange: (changes) => {
      const normalizedChanges = normalizeIterationNodeChanges(
        get().nodes,
        changes,
      )
      const nextNodes = normalizeIterationNodes(
        applyNodeChanges(normalizedChanges, get().nodes),
      )
      const resizedNodes = resizeIterationContainers(
        nextNodes,
        getIterationParentIds(nextNodes, normalizedChanges),
      )

      set({
        nodes: resizedNodes,
      })
    },

    onEdgesChange: (changes: EdgeChange[]) => {
      set({
        edges: applyEdgeChanges(changes, get().edges),
      })
    },

    onEdgeMouseEnter: (_event, edge) => {
      const { edges, setEdges } = get()
      const edgeId = edge.id
      setEdges(mapEdgeMouseEvent(edges, edgeId, true))
    },

    onEdgeMouseLeave: (_event, edge) => {
      const { edges, setEdges } = get()
      const edgeId = edge.id
      setEdges(mapEdgeMouseEvent(edges, edgeId, false))
    },

    onConnect: (connection: Connection) => {
      const { updateFormDataOnConnect } = get()
      const newEdges = addEdge(connection, get().edges)
      set({
        edges: newEdges,
      })
      updateFormDataOnConnect(connection)
    },

    onSelectionChange: ({ nodes, edges }: OnSelectionChangeParams) => {
      set({
        selectedEdgeIds: edges.map((x) => x.id),
        selectedNodeIds: nodes.map((x) => x.id),
      })
    },

    setNodes: (nodes: RAGFlowNodeType[]) => {
      set({ nodes: normalizeIterationNodes(nodes) })
    },

    setEdges: (edges: Edge[]) => {
      set({ edges })
    },

    setEdgesByNodeId: (nodeId: string, currentDownstreamEdges: Edge[]) => {
      const { edges, setEdges } = get()
      const previousDownstreamEdges = edges.filter(
        (x) => x.source === nodeId,
      )
      const isDifferent =
        previousDownstreamEdges.length !== currentDownstreamEdges.length ||
        !previousDownstreamEdges.every((x) =>
          currentDownstreamEdges.some(
            (y) =>
              y.source === x.source &&
              y.target === x.target &&
              y.sourceHandle === x.sourceHandle,
          ),
        ) ||
        !currentDownstreamEdges.every((x) =>
          previousDownstreamEdges.some(
            (y) =>
              y.source === x.source &&
              y.target === x.target &&
              y.sourceHandle === x.sourceHandle,
          ),
        )

      const intersectionDownstreamEdges = intersectionWith(
        previousDownstreamEdges,
        currentDownstreamEdges,
        isEdgeEqual,
      )
      if (isDifferent) {
        const irrelevantEdges = edges.filter((x) => x.source !== nodeId)
        const selfAddedDownstreamEdges = differenceWith(
          currentDownstreamEdges,
          intersectionDownstreamEdges,
          isEdgeEqual,
        )
        setEdges([
          ...irrelevantEdges,
          ...intersectionDownstreamEdges,
          ...selfAddedDownstreamEdges,
        ])
      }
    },

    addNode: (node: RAGFlowNodeType) => {
      set({ nodes: normalizeIterationNodes(get().nodes.concat(node)) })
    },

    updateNode: (node) => {
      const { nodes } = get()
      const nextNodes = nodes.map((x) => {
        if (x.id === node.id) {
          return node
        }
        return x
      })
      set({ nodes: normalizeIterationNodes(nextNodes) })
    },

    getNode: (id?: string | null) => {
      return get().nodes.find((x) => x.id === id)
    },

    getOperatorTypeFromId: (id?: string | null) => {
      return get().getNode(id)?.data?.label
    },

    getParentIdById: (id?: string | null) => {
      return get().getNode(id)?.parentId
    },

    addEdge: (connection: Connection) => {
      set({
        edges: addEdge(connection, get().edges),
      })
      get().updateFormDataOnConnect(connection)
    },

    getEdge: (id: string) => {
      return get().edges.find((x) => x.id === id)
    },

    updateFormDataOnConnect: (connection: Connection) => {
      const { getOperatorTypeFromId, updateSwitchFormData } = get()
      const { source, target, sourceHandle } = connection
      const operatorType = getOperatorTypeFromId(source)
      if (source) {
        switch (operatorType) {
          case Operator.Switch: {
            updateSwitchFormData(source, sourceHandle, target, true)
            break
          }
          default:
            break
        }
      }
    },

    duplicateNode: (id: string, name: string) => {
      const { getNode, addNode, generateNodeName, duplicateIterationNode } =
        get()
      const node = getNode(id)

      if (!node) {
        return
      }

      if (node.data.label === Operator.Iteration) {
        duplicateIterationNode(id, name)
        return
      }

      addNode({
        ...node,
        data: {
          ...duplicateNodeForm(node.data),
          name: generateNodeName(name),
        },
        ...generateDuplicateNode(node.position, node.data.label),
      })
    },

    duplicateIterationNode: (id: string, name: string) => {
      const { getNode, generateNodeName, nodes } = get()
      const node = getNode(id)

      if (!node) {
        return
      }

      const iterationNode: RAGFlowNodeType = {
        ...node,
        data: {
          ...node.data,
          name: generateNodeName(name),
        },
        ...generateDuplicateNode(node.position, node.data.label),
      }

      const children: RAGFlowNodeType[] = nodes
        .filter((x) => x.parentId === node.id)
        .map((x) => ({
          ...x,
          data: {
            ...duplicateNodeForm(x.data),
            name: generateNodeName(x.data.name),
          },
          ...omit(generateDuplicateNode(x.position, x.data.label), [
            'position',
          ]),
          parentId: iterationNode.id,
          position: isIterationStartNode(x)
            ? getFixedIterationStartPosition()
            : x.position,
        }))

      set({
        nodes: normalizeIterationNodes(nodes.concat(iterationNode, ...children)),
      })
    },

    deleteEdge: () => {
      const { edges, selectedEdgeIds } = get()
      set({
        edges: edges.filter((edge) =>
          selectedEdgeIds.every((x) => x !== edge.id),
        ),
      })
    },

    deleteEdgeById: (id: string) => {
      const {
        edges,
        updateNodeForm,
        getOperatorTypeFromId,
        updateSwitchFormData,
      } = get()
      const currentEdge = edges.find((x) => x.id === id)

      if (currentEdge) {
        const { source, sourceHandle, target } = currentEdge
        const operatorType = getOperatorTypeFromId(source)
        switch (operatorType) {
          case Operator.Relevant:
            updateNodeForm(source, {
              [sourceHandle as string]: undefined,
            })
            break
          case Operator.Switch: {
            updateSwitchFormData(source, sourceHandle, target, false)
            break
          }
          default:
            break
        }
      }
      set({
        edges: edges.filter((edge) => edge.id !== id),
      })
    },

    deleteNodeById: (id: string) => {
      const {
        nodes,
        edges,
        getOperatorTypeFromId,
        deleteAgentDownstreamNodesById,
      } = get()
      if (getOperatorTypeFromId(id) === Operator.Agent) {
        deleteAgentDownstreamNodesById(id)
        return
      }
      set({
        nodes: nodes.filter((node) => node.id !== id),
        edges: edges
          .filter((edge) => edge.source !== id)
          .filter((edge) => edge.target !== id),
      })
    },

    deleteAgentDownstreamNodesById: (id) => {
      const { edges, nodes } = get()

      const { downstreamAgentAndToolNodeIds, downstreamAgentAndToolEdges } =
        deleteAllDownstreamAgentsAndTool(id, edges)

      set({
        nodes: nodes.filter(
          (node) =>
            !downstreamAgentAndToolNodeIds.some((x) => x === node.id) &&
            node.id !== id,
        ),
        edges: edges.filter(
          (edge) =>
            edge.source !== id &&
            edge.target !== id &&
            !downstreamAgentAndToolEdges.some((x) => x.id === edge.id),
        ),
      })
    },

    deleteAgentToolNodeById: (id) => {
      const { edges, deleteEdgeById, deleteNodeById } = get()

      const edge = edges.find(
        (x) => x.source === id && x.sourceHandle === NodeHandleId.Tool,
      )

      if (edge) {
        deleteEdgeById(edge.id)
        deleteNodeById(edge.target)
      }
    },

    deleteIterationNodeById: (id: string) => {
      const { nodes, edges } = get()
      const children = nodes.filter((node) => node.parentId === id)
      set({
        nodes: nodes.filter((node) => node.id !== id && node.parentId !== id),
        edges: edges.filter(
          (edge) =>
            edge.source !== id &&
            edge.target !== id &&
            !children.some(
              (child) => edge.source === child.id && edge.target === child.id,
            ),
        ),
      })
    },

    findNodeByName: (name: Operator) => {
      return get().nodes.find((x) => x.data.label === name)
    },

    updateNodeForm: (
      nodeId: string,
      values: unknown,
      path: (string | number)[] = [],
    ) => {
      const nextNodes = get().nodes.map((node) => {
        if (node.id === nodeId) {
          let nextForm: Record<string, unknown> = { ...node.data.form }
          if (path.length === 0) {
            nextForm = Object.assign(nextForm, values)
          } else {
            lodashSet(nextForm, path, values)
          }
          return {
            ...node,
            data: {
              ...node.data,
              form: nextForm,
            },
          } as RAGFlowNodeType
        }

        return node
      })
      set({
        nodes: nextNodes,
      })

      return nextNodes
    },

    updateSwitchFormData: (source, sourceHandle, target, isConnecting) => {
      const { updateNodeForm, edges, getOperatorTypeFromId } = get()
      if (sourceHandle) {
        const currentHandleTargets = edges
          .filter(
            (x) =>
              x.source === source &&
              x.sourceHandle === sourceHandle &&
              typeof x.target === 'string' &&
              getOperatorTypeFromId(x.target) !== Operator.Placeholder,
          )
          .map((x) => x.target)

        let targets: string[] = currentHandleTargets
        const nextTarget =
          target && getOperatorTypeFromId(target) !== Operator.Placeholder
            ? target
            : undefined
        if (nextTarget) {
          if (!isConnecting) {
            targets = currentHandleTargets.filter((x) => x !== nextTarget)
          }
        }

        if (sourceHandle === SwitchElseTo) {
          updateNodeForm(source, targets, [SwitchElseTo])
        } else {
          const operatorIndex = getOperatorIndex(sourceHandle)
          if (operatorIndex) {
            updateNodeForm(source, targets, [
              'conditions',
              Number(operatorIndex) - 1,
              'to',
            ])
          }
        }
      }
    },

    updateMutableNodeFormItem: (id: string, field: string, value: unknown) => {
      const { nodes } = get()
      const idx = nodes.findIndex((x) => x.id === id)
      if (idx >= 0) {
        lodashSet(nodes, [idx, 'data', 'form', field], value)
      }
    },

    updateNodeName: (id, name) => {
      if (id) {
        set({
          nodes: get().nodes.map((node) => {
            if (node.id === id) {
              node.data.name = name
            }
            return node
          }),
        })
      }
    },

    setClickedNodeId: (id?: string) => {
      set({ clickedNodeId: id })
    },

    generateNodeName: (name: string) => {
      const { nodes } = get()
      return generateNodeNamesWithIncreasingIndex(name, nodes)
    },

    setClickedToolId: (id?: string) => {
      set({ clickedToolId: id })
    },

    findUpstreamNodeById: (id) => {
      const { edges, getNode } = get()
      const edge = edges.find((x) => x.target === id)
      return getNode(edge?.source)
    },

    deleteEdgesBySourceAndSourceHandle: (source, sourceHandle) => {
      const { edges, setEdges } = get()
      setEdges(
        edges.filter(
          (edge) =>
            !(edge.source === source && edge.sourceHandle === sourceHandle),
        ),
      )
    },

    findAgentToolNodeById: (id) => {
      const { edges } = get()
      return edges.find(
        (edge) =>
          edge.source === id && edge.sourceHandle === NodeHandleId.Tool,
      )?.target
    },

    selectNodeIds: (nodeIds) => {
      const { nodes, setNodes } = get()
      setNodes(
        nodes.map((node) => ({
          ...node,
          selected: nodeIds.includes(node.id),
        })),
      )
    },

    hasChildNode: (nodeId) => {
      const { edges } = get()
      return edges.some((edge) => edge.source === nodeId)
    },

    hasDownstreamNode: (nodeId) => {
      const { edges } = get()
      return edges.some((edge) => edge.source === nodeId)
    },

    hasUpstreamNode: (nodeId) => {
      const { edges } = get()
      return edges.some((edge) => edge.target === nodeId)
    },

    resizeIterationContainer: (parentId) => {
      const { nodes, updateNode, getNode } = get()
      const parent = getNode(parentId)
      if (!parent) return

      const children = getIterationContentChildren(nodes, parentId)
      if (children.length === 0) return

      const maxRight = Math.max(
        ...children.map((child) => {
          const size = getIterationChildSize(child)
          return child.position.x + size.width
        }),
      )
      const maxBottom = Math.max(
        ...children.map((child) => {
          const size = getIterationChildSize(child)
          return child.position.y + size.height
        }),
      )

      const neededWidth = Math.max(
        ITERATION_MIN_SIZE.width,
        maxRight + ITERATION_RESIZE_PADDING.x,
      )
      const neededHeight = Math.max(
        ITERATION_MIN_SIZE.height,
        maxBottom + ITERATION_RESIZE_PADDING.y,
      )
      const curWidth = parent.width || ITERATION_DEFAULT_SIZE.width
      const curHeight = parent.height || ITERATION_DEFAULT_SIZE.height

      if (neededWidth > curWidth || neededHeight > curHeight) {
        const newWidth = Math.max(curWidth, neededWidth)
        const newHeight = Math.max(curHeight, neededHeight)
        // Only update width/height — NodeResizeControl writes to node.width
        // (not node.style), so keeping style in sync would desync the two
        // and cause user-driven resizes to snap back.
        updateNode({
          ...parent,
          width: newWidth,
          height: newHeight,
        })
      }
    },
  })),
)

export default useGraphStore
