import { useCallback, useMemo } from 'react'
import type { ReactFlowInstance } from '@xyflow/react'
import { Position } from '@xyflow/react'
import { humanId } from 'human-id'
import {
  Operator,
  NodeMap,
  NodeHandleId,
  initialBeginValues,
  initialRetrievalValues,
  initialGenerateValues,
  initialMessageValues,
  initialCategorizeValues,
  initialSwitchValues,
  initialRelevantValues,
  initialRewriteQuestionValues,
  initialKeywordExtractValues,
  initialCodeValues,
  initialAgentValues,
  initialNoteValues,
  initialPlaceholderValues,
  initialWaitingDialogueValues,
  initialDuckValues,
  initialWikipediaValues,
  initialInvokeValues,
  initialEmailValues,
  initialIterationValues,
  initialIterationStartValues,
} from '../constant'
import useGraphStore from '../store'
import { generateNodeNamesWithIncreasingIndex, getNodeDragHandle } from '../utils'

export const useInitializeOperatorParams = () => {
  const initialFormValuesMap = useMemo(() => {
    return {
      [Operator.Begin]: initialBeginValues,
      [Operator.Retrieval]: initialRetrievalValues,
      [Operator.Generate]: initialGenerateValues,
      [Operator.Message]: initialMessageValues,
      [Operator.Categorize]: initialCategorizeValues,
      [Operator.Switch]: initialSwitchValues,
      [Operator.Relevant]: initialRelevantValues,
      [Operator.RewriteQuestion]: initialRewriteQuestionValues,
      [Operator.KeywordExtract]: initialKeywordExtractValues,
      [Operator.Code]: initialCodeValues,
      [Operator.Agent]: initialAgentValues,
      [Operator.Tool]: {},
      [Operator.Note]: initialNoteValues,
      [Operator.Placeholder]: initialPlaceholderValues,
      [Operator.WaitingDialogue]: initialWaitingDialogueValues,
      [Operator.DuckDuckGo]: initialDuckValues,
      [Operator.Wikipedia]: initialWikipediaValues,
      [Operator.Invoke]: initialInvokeValues,
      [Operator.Email]: initialEmailValues,
      [Operator.Iteration]: initialIterationValues,
      [Operator.IterationStart]: initialIterationStartValues,
    }
  }, [])

  const initializeOperatorParams = useCallback(
    (operatorName: Operator) => {
      return initialFormValuesMap[operatorName as keyof typeof initialFormValuesMap]
    },
    [initialFormValuesMap],
  )

  return { initializeOperatorParams }
}

export const useGetNodeName = () => {
  const getNodeName = useCallback((type: string) => {
    // 简单的翻译逻辑，后续可以接入i18n
    const nameMap: Record<string, string> = {
      [Operator.Begin]: '开始',
      [Operator.Retrieval]: '检索',
      [Operator.Generate]: '生成',
      [Operator.Message]: '回复',
      [Operator.Categorize]: '分类',
      [Operator.Switch]: '条件',
      [Operator.Relevant]: '相关性',
      [Operator.RewriteQuestion]: '重写问题',
      [Operator.KeywordExtract]: '关键词提取',
      [Operator.Code]: '代码',
      [Operator.Agent]: 'Agent',
      [Operator.Note]: '备注',
      [Operator.DuckDuckGo]: 'DuckDuckGo',
      [Operator.Wikipedia]: 'Wikipedia',
      [Operator.Invoke]: 'HTTP请求',
      [Operator.Email]: '邮件',
    }
    return nameMap[type] || type
  }, [])

  return getNodeName
}

type CanvasMouseEvent = Pick<
  React.MouseEvent<HTMLElement>,
  'clientX' | 'clientY'
>

export function useAddNode(reactFlowInstance?: ReactFlowInstance) {
  const { nodes, addEdge, addNode } = useGraphStore((state) => state)
  const getNodeName = useGetNodeName()
  const { initializeOperatorParams } = useInitializeOperatorParams()

  const addCanvasNode = useCallback(
    (
      type: string,
      params: {
        nodeId?: string
        position: Position
        id?: string
        isFromConnectionDrag?: boolean
      } = {
        position: Position.Right,
      },
    ) =>
      (event?: CanvasMouseEvent): string | undefined => {
        let position = reactFlowInstance?.screenToFlowPosition({
          x: event?.clientX || 0,
          y: event?.clientY || 0,
        })

        const newNode = {
          id: `${type}:${humanId()}`,
          type: NodeMap[type as Operator] || 'ragNode',
          position: position || { x: 0, y: 0 },
          draggable: type === Operator.Placeholder ? false : undefined,
          data: {
            label: type,
            name: generateNodeNamesWithIncreasingIndex(getNodeName(type), nodes),
            form: initializeOperatorParams(type as Operator),
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          dragHandle: getNodeDragHandle(type),
        }

        addNode(newNode)

        // 如果是从连接拖拽创建的，自动连接
        if (params.nodeId && params.id) {
          addEdge({
            source: params.nodeId,
            target: newNode.id,
            sourceHandle: params.id,
            targetHandle: NodeHandleId.End,
          })
        }

        return newNode.id
      },
    [
      addEdge,
      addNode,
      getNodeName,
      initializeOperatorParams,
      nodes,
      reactFlowInstance,
    ],
  )

  return { addCanvasNode }
}

