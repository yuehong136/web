import { useCallback, useMemo } from 'react'
import type { Edge, ReactFlowInstance } from '@xyflow/react'
import { Position } from '@xyflow/react'
import { humanId } from 'human-id'
import { t } from 'i18next'
import { useFetchMyLLMs } from '@/hooks/use-llm-request'
import { findFirstEnabledModelByType } from '@/stores/model'
import {
  Operator,
  NodeMap,
  NodeHandleId,
  initialBeginValues,
  initialRetrievalValues,
  initialMessageValues,
  initialA2UIValues,
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
  initialPubMedValues,
  initialArXivValues,
  initialGoogleValues,
  initialBingValues,
  initialGoogleScholarValues,
  initialGithubValues,
  initialSearXNGValues,
  initialTavilyValues,
  initialTavilyExtractValues,
  initialWenCaiValues,
  initialYahooFinanceValues,
  initialInvokeValues,
  initialExeSqlValues,
  initialCrawlerValues,
  initialEmailValues,
  initialUserFillUpValues,
  initialStringTransformValues,
  initialPDFGeneratorValues,
  initialExcelProcessorValues,
  initialDataOperationsValues,
  initialListOperationsValues,
  initialVariableAssignerValues,
  initialVariableAggregatorValues,
  initialLoopValues,
  initialIterationValues,
  initialIterationStartValues,
  initialFileValues,
  initialParserValues,
  initialTokenizerValues,
  initialSplitterValues,
  initialHierarchicalMergerValues,
  initialExtractorValues,
} from '../constant'
import useGraphStore from '../store'
import {
  clampIterationChildPosition,
  getFixedIterationStartPosition,
  isIterationContainerNode,
  ITERATION_DEFAULT_SIZE,
} from '../iteration-layout'
import type { RAGFlowNodeType } from '../types'
import {
  generateNodeNamesWithIncreasingIndex,
  getNodeDragHandle,
  getRelativePositionToIterationNode,
} from '../utils'

export const useInitializeOperatorParams = () => {
  const { myLLMs } = useFetchMyLLMs()
  const defaultChatModel = useMemo(
    () =>
      findFirstEnabledModelByType(myLLMs, 'chat', {
        valueMode: 'nameWithProvider',
      }) || '',
    [myLLMs],
  )

  const initialFormValuesMap = useMemo(() => {
    return {
      [Operator.Begin]: initialBeginValues,
      [Operator.Retrieval]: initialRetrievalValues,
      [Operator.Message]: initialMessageValues,
      [Operator.A2UI]: initialA2UIValues,
      [Operator.Categorize]: {
        ...initialCategorizeValues,
        llm_id: defaultChatModel,
      },
      [Operator.Switch]: initialSwitchValues,
      [Operator.Relevant]: initialRelevantValues,
      [Operator.RewriteQuestion]: {
        ...initialRewriteQuestionValues,
        llm_id: defaultChatModel,
      },
      [Operator.KeywordExtract]: initialKeywordExtractValues,
      [Operator.Code]: initialCodeValues,
      [Operator.Agent]: {
        ...initialAgentValues,
        llm_id: defaultChatModel,
        sys_prompt: t(
          'flow.sysPromptDefaultValue',
          'You are a helpful AI assistant.',
        ),
      },
      [Operator.Tool]: {},
      [Operator.Note]: initialNoteValues,
      [Operator.Placeholder]: initialPlaceholderValues,
      [Operator.WaitingDialogue]: initialWaitingDialogueValues,
      [Operator.DuckDuckGo]: initialDuckValues,
      [Operator.Wikipedia]: initialWikipediaValues,
      [Operator.PubMed]: initialPubMedValues,
      [Operator.ArXiv]: initialArXivValues,
      [Operator.Google]: initialGoogleValues,
      [Operator.Bing]: initialBingValues,
      [Operator.GoogleScholar]: initialGoogleScholarValues,
      [Operator.GitHub]: initialGithubValues,
      [Operator.SearXNG]: initialSearXNGValues,
      [Operator.TavilySearch]: initialTavilyValues,
      [Operator.TavilyExtract]: initialTavilyExtractValues,
      [Operator.WenCai]: initialWenCaiValues,
      [Operator.YahooFinance]: initialYahooFinanceValues,
      [Operator.Invoke]: initialInvokeValues,
      [Operator.ExeSQL]: initialExeSqlValues,
      [Operator.Crawler]: initialCrawlerValues,
      [Operator.Email]: initialEmailValues,
      [Operator.UserFillUp]: initialUserFillUpValues,
      [Operator.StringTransform]: initialStringTransformValues,
      [Operator.PDFGenerator]: initialPDFGeneratorValues,
      [Operator.ExcelProcessor]: initialExcelProcessorValues,
      [Operator.DataOperations]: initialDataOperationsValues,
      [Operator.ListOperations]: initialListOperationsValues,
      [Operator.VariableAssigner]: initialVariableAssignerValues,
      [Operator.VariableAggregator]: initialVariableAggregatorValues,
      [Operator.Loop]: initialLoopValues,
      [Operator.LoopStart]: {},
      [Operator.ExitLoop]: {},
      [Operator.Iteration]: initialIterationValues,
      [Operator.IterationStart]: initialIterationStartValues,
      [Operator.File]: initialFileValues,
      [Operator.Parser]: initialParserValues,
      [Operator.Tokenizer]: initialTokenizerValues,
      [Operator.Splitter]: initialSplitterValues,
      [Operator.HierarchicalMerger]: initialHierarchicalMergerValues,
      [Operator.Extractor]: {
        ...initialExtractorValues,
        llm_id: defaultChatModel,
      },
    }
  }, [defaultChatModel])

  const initializeOperatorParams = useCallback(
    (operatorName: Operator, position: Position = Position.Right) => {
      const initialValues =
        initialFormValuesMap[operatorName as keyof typeof initialFormValuesMap]

      if (operatorName === Operator.Agent && position === Position.Bottom) {
        return {
          ...initialValues,
          description: t(
            'flow.descriptionMessage',
            'This is an agent for a specific task.',
          ),
          user_prompt: t(
            'flow.userPromptDefaultValue',
            'This is the order you need to send to the agent.',
          ),
        }
      }

      return initialValues
    },
    [initialFormValuesMap],
  )

  return { initializeOperatorParams, initialFormValuesMap }
}

export const useGetNodeName = () => {
  const getNodeName = useCallback((type: string) => {
    // 简单的翻译逻辑，后续可以接入i18n
    const nameMap: Record<string, string> = {
      [Operator.Begin]: '开始',
      [Operator.Retrieval]: '检索',
      [Operator.Message]: '回复',
      [Operator.A2UI]: 'A2UI 卡片',
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

export function useAddNode(
  reactFlowInstance?: ReactFlowInstance<RAGFlowNodeType, Edge>,
) {
  const {
    edges,
    nodes,
    addEdge,
    addNode,
    getNode,
    getParentIdById,
    resizeIterationContainer,
  } = useGraphStore((state) => state)
  const getNodeName = useGetNodeName()
  const { initializeOperatorParams } = useInitializeOperatorParams()

  const resolveParentContext = useCallback(
    (
      type: string,
      sourceNodeId: string | undefined,
      absPosition: { x: number; y: number } | undefined,
    ) => {
      const isIteration =
        type === Operator.Iteration || type === Operator.Loop
      if (isIteration || !absPosition) return undefined

      if (sourceNodeId) {
        const sourceParentId = getParentIdById(sourceNodeId)
        if (sourceParentId) {
          const parent = getNode(sourceParentId)
          if (parent) {
            const halfW = (parent.width || 0) / 2
            return {
              parentId: sourceParentId,
              position: {
                x: absPosition.x - parent.position.x + halfW,
                y: absPosition.y - parent.position.y,
              },
            }
          }
        }
      }

      return getRelativePositionToIterationNode(nodes, absPosition)
    },
    [getNode, getParentIdById, nodes],
  )

  const resolveFallbackPosition = useCallback(
    (sourceNodeId?: string, position = Position.Right) => {
      if (!sourceNodeId) {
        return undefined
      }

      const sourceNode = getNode(sourceNodeId)
      if (!sourceNode) {
        return undefined
      }

      const width = sourceNode.width || 208
      const height = sourceNode.height || 96
      const horizontalGap = width + 72
      const verticalGap = height + 72

      switch (position) {
        case Position.Left:
          return {
            x: sourceNode.position.x - horizontalGap,
            y: sourceNode.position.y,
          }
        case Position.Top:
          return {
            x: sourceNode.position.x,
            y: sourceNode.position.y - verticalGap,
          }
        case Position.Bottom:
          return {
            x: sourceNode.position.x,
            y: sourceNode.position.y + verticalGap,
          }
        case Position.Right:
        default:
          return {
            x: sourceNode.position.x + horizontalGap,
            y: sourceNode.position.y,
          }
      }
    },
    [getNode],
  )

  const resolveSubAgentPosition = useCallback(
    (sourceNodeId?: string) => {
      if (!sourceNodeId) {
        return undefined
      }

      const sourceNode = getNode(sourceNodeId)
      if (!sourceNode) {
        return undefined
      }

      const childAgentIds = edges
        .filter(
          (edge) =>
            edge.source === sourceNodeId &&
            edge.sourceHandle === NodeHandleId.AgentBottom,
        )
        .map((edge) => edge.target)

      const childAgentXPositions = nodes
        .filter((node) => childAgentIds.includes(node.id))
        .map((node) => node.position.x)

      const maxX = Math.max(...childAgentXPositions)

      return {
        x: childAgentXPositions.length > 0 ? maxX + 262 : sourceNode.position.x + 82,
        y: sourceNode.position.y + 140,
      }
    },
    [edges, getNode, nodes],
  )

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
        const absPosition =
          event && reactFlowInstance
            ? reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
              })
            : undefined
        const isBottomSubAgent =
          type === Operator.Agent && params.position === Position.Bottom
        const fallbackPosition =
          !event && params.nodeId
            ? isBottomSubAgent
              ? resolveSubAgentPosition(params.nodeId)
              : resolveFallbackPosition(params.nodeId, params.position)
            : undefined
        const nextPosition = absPosition || fallbackPosition

        const isIteration =
          type === Operator.Iteration || type === Operator.Loop

        const parentCtx = isBottomSubAgent
          ? undefined
          : resolveParentContext(type, params.nodeId, nextPosition)
        const parentNode = parentCtx?.parentId
          ? getNode(parentCtx.parentId)
          : undefined
        const sourceNode = params.nodeId ? getNode(params.nodeId) : undefined
        const nextNodePosition =
          parentCtx && isIterationContainerNode(parentNode)
            ? clampIterationChildPosition(parentCtx.position)
            : parentCtx?.position || nextPosition || { x: 0, y: 0 }

        const newNode = {
          id: `${type}:${humanId()}`,
          type: NodeMap[type as Operator] || 'ragNode',
          position: nextNodePosition,
          draggable: type === Operator.Placeholder ? false : undefined,
          ...(parentCtx
            ? {
                parentId: parentCtx.parentId,
                extent: 'parent' as const,
              }
            : {}),
          data: {
            label: type,
            name: generateNodeNamesWithIncreasingIndex(getNodeName(type), nodes),
            form: initializeOperatorParams(type as Operator, params.position),
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          dragHandle: getNodeDragHandle(type),
          ...(isBottomSubAgent && sourceNode?.parentId
            ? {
                parentId: sourceNode.parentId,
                extent: 'parent' as const,
              }
            : {}),
          ...(isIteration
            ? {
                width: ITERATION_DEFAULT_SIZE.width,
                height: ITERATION_DEFAULT_SIZE.height,
              }
            : {}),
        } as unknown as RAGFlowNodeType

        addNode(newNode)

        if (parentCtx) {
          resizeIterationContainer(parentCtx.parentId)
        }

        if (isIteration) {
          const startType =
            type === Operator.Loop ? Operator.LoopStart : Operator.IterationStart
          const startNode = {
            id: `${startType}:${humanId()}`,
            type: NodeMap[startType as Operator] || 'iterationStartNode',
            position: getFixedIterationStartPosition(),
            parentId: newNode.id,
            extent: 'parent' as const,
            draggable: false,
            expandParent: false,
            data: {
              label: startType,
              name: startType,
              form: initializeOperatorParams(startType as Operator) || {},
            },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
          } as unknown as RAGFlowNodeType
          addNode(startNode)
        }

        if (isBottomSubAgent && params.nodeId) {
          addEdge({
            source: params.nodeId,
            target: newNode.id,
            sourceHandle: NodeHandleId.AgentBottom,
            targetHandle: NodeHandleId.AgentTop,
          })
        } else if (params.nodeId && params.id) {
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
      getNode,
      getNodeName,
      initializeOperatorParams,
      nodes,
      reactFlowInstance,
      resolveFallbackPosition,
      resolveParentContext,
      resolveSubAgentPosition,
      resizeIterationContainer,
    ],
  )

  const addNoteNode = useCallback(
    (mouse: { clientX: number; clientY: number }) => {
      addCanvasNode(Operator.Note)({ clientX: mouse.clientX, clientY: mouse.clientY })
    },
    [addCanvasNode],
  )

  return { addCanvasNode, addNoteNode }
}
