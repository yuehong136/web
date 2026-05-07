import { useFetchAgent } from '@/hooks/use-agent-request'
import type { VariableOptionGroup } from '@/components/prompt-editor/types'
import { MessageSquareCode } from 'lucide-react'
import { createElement, useCallback, useMemo } from 'react'
import OperatorIcon from '../operator-icon'
import { useBuildNodeOutputOptions } from './use-build-options'
import {
  useFindAgentStructuredOutputLabelByValue,
  useFindAgentStructuredOutputTypeByValue,
} from './use-build-structured-output'
import {
  AgentDialogueMode,
  AgentGlobals,
  BeginId,
  BeginQueryType,
  BeginQueryTypeMap,
  Operator,
  VariableType,
} from '../constant'
import useGraphStore from '../store'
import type { BeginQuery } from '../types'
import { useTranslation } from 'react-i18next'

type FlattenedVariableOption = {
  label: string
  value: string
  groupTitle: string
  type?: string
}

/**
 * 从 inputs 对象构建 BeginQuery 数组
 */
export function buildBeginInputListFromObject(
  inputs: Record<string, BeginQuery> | undefined,
): BeginQuery[] {
  if (!inputs) return []
  return Object.entries(inputs).map(([key, value]) => ({
    ...value,
    key,
  }))
}

/**
 * 获取 Begin 节点的 inputs 数据
 */
export function useSelectBeginNodeDataInputs() {
  const getNode = useGraphStore((state) => state.getNode)

  return buildBeginInputListFromObject(
    getNode(BeginId)?.data?.form?.inputs ?? {},
  )
}

/**
 * 判断是否为任务模式
 */
export function useIsTaskMode(isTask?: boolean) {
  const getNode = useGraphStore((state) => state.getNode)

  return useMemo(() => {
    if (typeof isTask === 'boolean') {
      return isTask
    }
    const node = getNode(BeginId)
    return node?.data?.form?.mode === AgentDialogueMode.Task
  }, [getNode, isTask])
}

/**
 * 获取 Begin 节点查询数据（带回调）
 */
export const useGetBeginNodeDataQuery = () => {
  const getNode = useGraphStore((state) => state.getNode)

  const getBeginNodeDataQuery = useCallback(() => {
    return buildBeginInputListFromObject(
      getNode(BeginId)?.data?.form?.inputs ?? {},
    )
  }, [getNode])

  return getBeginNodeDataQuery
}

/**
 * 获取 Begin 节点的 inputs 列表
 */
export const useGetBeginNodeDataInputs = (): BeginQuery[] => {
  const getNode = useGraphStore((state) => state.getNode)

  const inputs = getNode(BeginId)?.data?.form?.inputs

  const beginNodeDataInputs = useMemo(() => {
    return buildBeginInputListFromObject(inputs ?? {})
  }, [inputs])

  return beginNodeDataInputs
}

/**
 * 检查 Begin 节点查询是否安全（不包含必填的文件类型）
 */
export const useGetBeginNodeDataQueryIsSafe = () => {
  const inputs = useSelectBeginNodeDataInputs()

  return useMemo(() => {
    return !inputs.some((q) => !q.optional && q.type === 'file')
  }, [inputs])
}

function normalizeBeginInputType(type: string) {
  const mappedType = BeginQueryTypeMap[type as keyof typeof BeginQueryTypeMap]

  if (mappedType) {
    return mappedType
  }

  if (type === BeginQueryType.Line || type === BeginQueryType.Paragraph) {
    return VariableType.String
  }

  return type
}

export function useBuildBeginVariableOptions(): VariableOptionGroup[] {
  const { t } = useTranslation()
  const inputs = useSelectBeginNodeDataInputs()

  return useMemo(
    () => [
      {
        label: t('flow.beginInput', 'Begin Input'),
        title: t('flow.beginInput', 'Begin Input'),
        options: inputs.map((input) => ({
          label: input.name,
          value: `begin@${input.key}`,
          parentLabel: t('flow.beginInput', 'Begin Input'),
          icon: createElement(OperatorIcon, { name: Operator.Begin }),
          type: normalizeBeginInputType(input.type),
        })),
      },
    ],
    [inputs, t],
  )
}

const ConversationVariablePrefix = 'env.'
const DefaultSystemGlobals: Record<string, string | number | unknown[]> = {
  [AgentGlobals.SysQuery]: '',
  [AgentGlobals.SysUserId]: '',
  [AgentGlobals.SysConversationTurns]: 0,
  [AgentGlobals.SysFiles]: [],
  [AgentGlobals.SysHistory]: [],
  [AgentGlobals.SysDate]: '',
}

export function useBuildConversationVariableOptions(): VariableOptionGroup[] {
  const { t } = useTranslation()
  const { data } = useFetchAgent()

  return useMemo(
    () => [
      {
        label: t('flow.conversationVariable', 'Conversation Variable'),
        title: t('flow.conversationVariable', 'Conversation Variable'),
        options: Object.entries(data?.dsl?.variables ?? {}).map(
          ([key, value]) => ({
            label: `${ConversationVariablePrefix}${key}`,
            value: `${ConversationVariablePrefix}${key}`,
            parentLabel: t(
              'flow.conversationVariable',
              'Conversation Variable',
            ),
            icon: createElement(MessageSquareCode, { className: 'size-3' }),
            type: value?.type,
          }),
        ),
      },
    ],
    [data?.dsl?.variables, t],
  )
}

export function useBuildGlobalWithBeginVariableOptions(): VariableOptionGroup[] {
  const { data } = useFetchAgent()
  const beginOptions = useBuildBeginVariableOptions()

  return useMemo(() => {
    const beginGroup = beginOptions[0]
    if (!beginGroup) {
      return []
    }

    const globals = {
      ...DefaultSystemGlobals,
      ...(data?.dsl?.globals ?? {}),
    }

    const globalOptions = Object.entries(globals)
      .filter(([key]) => !key.startsWith(ConversationVariablePrefix))
      .map(([key, value]) => ({
        label: key,
        value: key,
        parentLabel: beginGroup.title,
        icon: createElement(OperatorIcon, { name: Operator.Begin }),
        type: Array.isArray(value)
          ? `${VariableType.Array}${
              key === AgentGlobals.SysFiles ? `<${VariableType.File}>` : ''
            }`
          : typeof value,
      }))

    return [
      {
        ...beginGroup,
        options: [...beginGroup.options, ...globalOptions],
      },
    ]
  }, [beginOptions, data?.dsl?.globals])
}

export function useBuildPromptVariableOptions(nodeId?: string): VariableOptionGroup[] {
  const clickedNodeId = useGraphStore((state) => state.clickedNodeId)
  const upstreamOptions = useBuildNodeOutputOptions(nodeId || clickedNodeId)
  const globalWithBeginOptions = useBuildGlobalWithBeginVariableOptions()
  const conversationOptions = useBuildConversationVariableOptions()

  return useMemo(
    () => [
      ...globalWithBeginOptions,
      ...conversationOptions,
      ...upstreamOptions,
    ],
    [conversationOptions, globalWithBeginOptions, upstreamOptions],
  )
}

function normalizeVariableReference(value?: string) {
  if (typeof value !== 'string') {
    return ''
  }

  let nextValue = value.trim()

  while (nextValue.startsWith('{') && nextValue.endsWith('}')) {
    nextValue = nextValue.slice(1, -1).trim()
  }

  return nextValue
}

function flattenVariableOptions(
  groups: VariableOptionGroup[],
): FlattenedVariableOption[] {
  return groups.flatMap((group) =>
    group.options.map((option) => ({
      label: option.label,
      value: option.value,
      groupTitle: group.title,
      type: option.type,
    })),
  )
}

function splitVariableReference(value: string) {
  const separatorIndex = value.indexOf('@')

  if (separatorIndex < 0) {
    return { nodeId: value, field: '' }
  }

  return {
    nodeId: value.slice(0, separatorIndex),
    field: value.slice(separatorIndex + 1),
  }
}

export function useGetVariableLabelOrTypeByValue({
  nodeId,
}: {
  nodeId?: string
} = {}) {
  const getNode = useGraphStore((state) => state.getNode)
  const findAgentStructuredOutputTypeByValue =
    useFindAgentStructuredOutputTypeByValue()
  const findAgentStructuredOutputLabelByValue =
    useFindAgentStructuredOutputLabelByValue()
  const optionGroups = useBuildPromptVariableOptions(nodeId)
  const flattenedOptions = useMemo(
    () => flattenVariableOptions(optionGroups),
    [optionGroups],
  )

  const getItem = useCallback(
    (value?: string) => {
      const normalizedValue = normalizeVariableReference(value)

      return flattenedOptions.find((option) => option.value === normalizedValue)
    },
    [flattenedOptions],
  )

  const getFallbackLabel = useCallback(
    (value?: string) => {
      const normalizedValue = normalizeVariableReference(value)

      if (!normalizedValue) {
        return ''
      }

      const { nodeId: sourceNodeId, field } = splitVariableReference(normalizedValue)
      const sourceNode = getNode(sourceNodeId)

      if (!sourceNode) {
        return normalizedValue
      }

      return field
        ? `${sourceNode.data.name}.${field}`
        : sourceNode.data.name
    },
    [getNode],
  )

  const getLabel = useCallback(
    (value?: string) => {
      const item = getItem(value)

      if (item) {
        return `${item.groupTitle}.${item.label}`
      }

      return findAgentStructuredOutputLabelByValue(value) || getFallbackLabel(value)
    },
    [findAgentStructuredOutputLabelByValue, getFallbackLabel, getItem],
  )

  const getType = useCallback(
    (value?: string) => {
      const item = getItem(value)

      if (item?.type) {
        return normalizeBeginInputType(item.type)
      }

      const structuredType = findAgentStructuredOutputTypeByValue(value)
      if (structuredType) {
        return normalizeBeginInputType(structuredType)
      }

      const normalizedValue = normalizeVariableReference(value)

      if (!normalizedValue) {
        return ''
      }

      const { nodeId: sourceNodeId, field } = splitVariableReference(normalizedValue)
      const sourceNode = getNode(sourceNodeId)
      const nextType =
        field && sourceNode?.data?.form
          ? (sourceNode.data.form as { outputs?: Record<string, { type?: string }> })
            .outputs?.[field]?.type
          : undefined

      return nextType ? normalizeBeginInputType(nextType) : undefined
    },
    [findAgentStructuredOutputTypeByValue, getItem, getNode],
  )

  return { getLabel, getType }
}
