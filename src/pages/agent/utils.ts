import type { Edge, XYPosition } from '@xyflow/react'
import { humanId } from 'human-id'
import get from 'lodash/get.js'
import intersectionWith from 'lodash/intersectionWith.js'
import isEqual from 'lodash/isEqual.js'
import isObject from 'lodash/isObject.js'
import omit from 'lodash/omit.js'
import sample from 'lodash/sample.js'
import { Operator, CategorizeAnchorPointPositions } from './constant'
import type {
  RAGFlowNodeType,
  ICategorizeItemResult,
  ICategorizeItem,
  IPosition,
} from './types'
export { hasSubAgent, isBottomSubAgent } from './utils/delete-node'

// ==================== 节点名称生成 ====================

const splitName = (name: string) => {
  const names = name.split('_')
  const type = names.at(0)
  const index = Number(names.at(-1))

  return { type, index }
}

export const generateNodeNamesWithIncreasingIndex = (
  name: string,
  nodes: RAGFlowNodeType[],
) => {
  const templateNameList = nodes
    .filter((x) => {
      const temporaryName = x.data.name

      const { type, index } = splitName(temporaryName)

      return (
        temporaryName.match(/_/g)?.length === 1 &&
        type === name &&
        !isNaN(index)
      )
    })
    .map((x) => {
      const temporaryName = x.data.name
      const { index } = splitName(temporaryName)

      return {
        idx: index,
        name: temporaryName,
      }
    })
    .sort((a, b) => a.idx - b.idx)

  let index: number = 0
  for (let i = 0; i < templateNameList.length; i++) {
    const idx = templateNameList[i]?.idx
    const nextIdx = templateNameList[i + 1]?.idx
    if (idx + 1 !== nextIdx) {
      index = idx + 1
      break
    }
  }

  return `${name}_${index}`
}

// ==================== 节点复制相关 ====================

export const duplicateNodeForm = (nodeData?: RAGFlowNodeType['data']) => {
  const form: Record<string, unknown> = { ...(nodeData?.form ?? {}) }

  // Delete the downstream node corresponding to the to field of the Categorize operator
  if (nodeData?.label === Operator.Categorize) {
    const categoryDescription = (form.category_description ??
      {}) as Record<string, Record<string, unknown>>

    form.category_description = Object.keys(categoryDescription).reduce<
      Record<string, Record<string, unknown>>
    >((pre, cur) => {
      pre[cur] = {
        ...categoryDescription[cur],
        to: undefined,
      }
      return pre
    }, {})
  }

  // Delete the downstream nodes corresponding to the yes and no fields of the Relevant operator
  if (nodeData?.label === Operator.Relevant) {
    form.yes = undefined
    form.no = undefined
  }

  return {
    ...(nodeData ?? { label: '' }),
    form,
  }
}

export const generateDuplicateNode = (
  position?: XYPosition,
  label?: string,
) => {
  const nextPosition = {
    x: (position?.x || 0) + 50,
    y: (position?.y || 0) + 50,
  }

  return {
    selected: false,
    dragging: false,
    id: `${label}:${humanId()}`,
    position: nextPosition,
    dragHandle: getNodeDragHandle(label),
  }
}

export const getNodeDragHandle = (nodeType?: string) => {
  return nodeType === Operator.Note ? '.note-drag-handle' : undefined
}

// ==================== Edge相关工具 ====================

export const isEdgeEqual = (previous: Edge, current: Edge) =>
  previous.source === current.source &&
  previous.target === current.target &&
  previous.sourceHandle === current.sourceHandle

export function mapEdgeMouseEvent(
  edges: Edge[],
  edgeId: string,
  isHovered: boolean,
) {
  const nextEdges = edges.map((element) =>
    element.id === edgeId
      ? {
          ...element,
          data: {
            ...element.data,
            isHovered,
          },
        }
      : element,
  )

  return nextEdges
}

// ==================== Categorize相关 ====================

export const buildCategorizeListFromObject = (
  categorizeItem: ICategorizeItemResult,
) => {
  return Object.keys(categorizeItem)
    .reduce<Array<Omit<ICategorizeItem, 'uuid'>>>((pre, cur) => {
      const item = categorizeItem[cur]
      const examples = Array.isArray(item.examples)
        ? item.examples.map((x) => ({ value: x }))
        : []
      pre.push({
        name: cur,
        ...item,
        examples,
      })
      return pre
    }, [])
    .sort((a, b) => a.index - b.index)
}

export const buildCategorizeObjectFromList = (
  list: Array<ICategorizeItem>,
): ICategorizeItemResult => {
  return list.reduce<ICategorizeItemResult>((pre, cur) => {
    if (cur?.name) {
      pre[cur.name] = {
        ...omit(cur, 'name', 'examples'),
        examples: convertToStringArray(cur.examples),
      }
    }
    return pre
  }, {})
}

export function convertToStringArray(
  list?: Array<{ value: string | number | boolean }>,
): (string | number | boolean)[] {
  if (!Array.isArray(list)) {
    return []
  }
  return list.map((x) => x.value)
}

export function convertToObjectArray(
  list: (string | number | boolean)[] | undefined,
): Array<{ value: string | number | boolean }> {
  if (!Array.isArray(list)) {
    return []
  }
  return list.map((x) => ({ value: x }))
}

export const buildNewPositionMap = (
  currentKeys: string[],
  previousPositionMap: Record<string, IPosition>,
) => {
  const indexesInUse = Object.values(previousPositionMap).map((x) => x.idx)
  const previousKeys = Object.keys(previousPositionMap)
  const intersectionKeys = intersectionWith(
    previousKeys,
    currentKeys,
    (categoryDataKey: string, positionMapKey: string) =>
      categoryDataKey === positionMapKey,
  )
  const currentDifferenceKeys = currentKeys.filter(
    (x) => !intersectionKeys.some((y: string) => y === x),
  )
  const newPositionMap = currentDifferenceKeys.reduce<
    Record<string, IPosition>
  >((pre, cur) => {
    const effectiveIdxes = CategorizeAnchorPointPositions.map(
      (_item, idx) => idx,
    ).filter((x) => !indexesInUse.some((y) => y === x))
    const idx = sample(effectiveIdxes)
    if (idx !== undefined) {
      indexesInUse.push(idx)
      pre[cur] = { ...CategorizeAnchorPointPositions[idx], idx }
    }

    return pre
  }, {})

  return { intersectionKeys, newPositionMap }
}

export const isKeysEqual = (currentKeys: string[], previousKeys: string[]) => {
  return isEqual(currentKeys.sort(), previousKeys.sort())
}

// ==================== Switch相关 ====================

export const getOperatorIndex = (handleTitle: string) => {
  return handleTitle.split(' ').at(-1)
}

export const generateSwitchHandleText = (idx: number) => {
  return `Case ${idx + 1}`
}

// ==================== ID替换为文本 ====================

export const replaceIdWithText = (
  obj: Record<string, unknown> | unknown[] | unknown,
  getNameById: (id?: string) => string | undefined,
): unknown => {
  if (isObject(obj)) {
    const ret: Record<string, unknown> | unknown[] = Array.isArray(obj)
      ? []
      : {}
    Object.keys(obj as Record<string, unknown>).forEach((key) => {
      const val = (obj as Record<string, unknown>)[key]
      const text = typeof val === 'string' ? getNameById(val) : undefined
      ;(ret as Record<string, unknown>)[key] = text
        ? text
        : replaceIdWithText(val, getNameById)
    })

    return ret
  }

  return obj
}

// ==================== Iteration节点相关 ====================

export function getRelativePositionToIterationNode(
  nodes: RAGFlowNodeType[],
  position?: XYPosition,
) {
  if (!position) {
    return
  }

  const iterationNodes = nodes.filter(
    (node) => node.data.label === Operator.Iteration,
  )

  for (const iterationNode of iterationNodes) {
    const {
      position: { x, y },
      width,
      height,
    } = iterationNode
    const halfWidth = (width || 0) / 2
    if (
      position.x >= x - halfWidth &&
      position.x <= x + halfWidth &&
      position.y >= y &&
      position.y <= y + (height || 0)
    ) {
      return {
        parentId: iterationNode.id,
        position: { x: position.x - x + halfWidth, y: position.y - y },
      }
    }
  }
}

// ==================== 表单相关 ====================

export const getOtherFieldValues = (
  form: any,
  formListName: string = 'items',
  field: any,
  latestField: string,
) =>
  (form.getFieldValue([formListName]) ?? [])
    .map((x: any) => {
      return get(x, latestField)
    })
    .filter(
      (x: string) =>
        x !== form.getFieldValue([formListName, field.name, latestField]),
    )

// ==================== 节点类型判断 ====================

export const needsSingleStepDebugging = (label: string) => {
  const NoDebugOperatorsList = [
    Operator.Begin,
    Operator.Message,
    Operator.RewriteQuestion,
    Operator.Switch,
    Operator.Iteration,
    Operator.IterationStart,
  ]
  return !NoDebugOperatorsList.some((x) => (label as Operator) === x)
}

export function showCopyIcon(label: string) {
  const NoCopyOperatorsList = [Operator.Begin]
  return !NoCopyOperatorsList.some((x) => (label as Operator) === x)
}

// ==================== Agent Tool相关 ====================

export function getAgentNodeTools(agentNode?: RAGFlowNodeType) {
  const tools: any[] = get(agentNode, 'data.form.tools', [])
  return tools
}

export function getAgentNodeMCP(agentNode?: RAGFlowNodeType) {
  const mcp: any[] = get(agentNode, 'data.form.mcp', [])
  return mcp
}

export function buildBeginQueryWithObject(
  inputs: Record<string, any>,
  values: any[],
) {
  const nextInputs = Object.keys(inputs).reduce<Record<string, any>>(
    (pre, key) => {
      const item = values.find((x) => x.key === key)
      if (item) {
        pre[key] = { ...item }
      }
      return pre
    },
    {},
  )

  return nextInputs
}

// ==================== 其他工具 ====================

export const getDrawerWidth = () => {
  return window.innerWidth > 1278 ? '40%' : 470
}

export const receiveMessageError = (res: any) =>
  res && (res?.response.status !== 200 || res?.data?.code !== 0)
