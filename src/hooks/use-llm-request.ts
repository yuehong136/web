/**
 * LLM Request Hooks
 *
 * 使用 TanStack Query 管理 LLM 模型相关的服务器状态
 */

import { useQuery } from '@tanstack/react-query'
import { llmAPI } from '@/api/llm'
import {
  getLLMModelValue,
  getLLMModelLabel,
  isLLMModelEnabled,
  type LLMValueMode,
  type MyLLMModel,
  type MyLLMProvider,
  type LLMFactoryInterface,
} from '@/stores/model'

// Query Keys 统一管理
export const llmKeys = {
  all: ['llm'] as const,
  myLLMs: () => [...llmKeys.all, 'myLLMs'] as const,
  catalog: () => [...llmKeys.all, 'catalog'] as const,
  factories: () => [...llmKeys.all, 'factories'] as const,
  available: () => [...llmKeys.all, 'available'] as const,
  rerank: () => [...llmKeys.all, 'knowledge-rerank'] as const,
}

type SupportedLLMType = MyLLMModel['type']

export type LLMGroupedSelectOption = {
  label: string
  value: string
  providerName: string
  type: SupportedLLMType
}

export type LLMGroupedOptionGroup = {
  label: string
  providerName: string
  options: LLMGroupedSelectOption[]
}

// 加载中或失败时返回共享的稳定空值（只读）：每次渲染新建 {} / []
// 会让依赖它的 memo/effect 每次渲染都重新执行
const EMPTY_MY_LLMS: MyLLMProvider = {}
const EMPTY_FACTORIES: LLMFactoryInterface[] = []

// 获取我的 LLM 列表
export const useFetchMyLLMs = (options?: {
  staleTime?: number
  refetchOnWindowFocus?: boolean
  includeDetails?: boolean
}) => {
  const { data, isFetching, isPending, fetchStatus, isError, error, refetch } =
    useQuery<MyLLMProvider>({
      queryKey: options?.includeDetails
        ? [...llmKeys.myLLMs(), 'details']
        : llmKeys.myLLMs(),
      queryFn: ({ signal }) =>
        llmAPI.getMyLLMs(
          options?.includeDetails ? { include_details: true } : undefined,
          signal,
        ),
      staleTime: options?.staleTime ?? 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    })

  return {
    myLLMs: isError ? EMPTY_MY_LLMS : (data ?? EMPTY_MY_LLMS),
    isLoading: isFetching,
    isPending,
    isPaused: fetchStatus === 'paused',
    isError,
    error,
    refetch,
  }
}

// 获取可用的 LLM 工厂列表
export const useFetchFactories = () => {
  const { data, isFetching, isError, error, refetch } = useQuery<
    LLMFactoryInterface[]
  >({
    queryKey: llmKeys.factories(),
    queryFn: async ({ signal }) => {
      const response = await llmAPI.getFactories(signal)
      return response
    },
    staleTime: 10 * 60 * 1000, // 工厂列表变化不频繁
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return {
    factories: isError ? EMPTY_FACTORIES : (data ?? EMPTY_FACTORIES),
    isLoading: isFetching,
    isError,
    error,
    refetch,
  }
}

// 获取模型选项（用于下拉选择）
export const useLLMOptions = (type?: 'chat' | 'embedding' | 'rerank') => {
  const { myLLMs, isLoading } = useFetchMyLLMs()

  const options = Object.entries(myLLMs).flatMap(([providerName, provider]) => {
    return (provider.llm || [])
      .filter(
        (model) => (!type || model.type === type) && isLLMModelEnabled(model),
      )
      .map((model) => ({
        label: `${providerName} / ${getLLMModelLabel(model)}`,
        value: getLLMModelValue(model, providerName),
        provider: providerName,
        type: model.type,
      }))
  })

  return { options, isLoading }
}

// 获取模型选项（按 provider 分组，用于 SelectWithSearch）
export const useLLMGroupedOptions = (
  type?: 'chat' | 'embedding' | 'rerank',
  options?: {
    valueMode?: LLMValueMode
  },
) => {
  return useLLMGroupedOptionsByTypes(type ? [type] : undefined, options)
}

export const useLLMGroupedOptionsByTypes = (
  types?: SupportedLLMType[],
  options?: {
    valueMode?: LLMValueMode
  },
) => {
  const { myLLMs, isLoading } = useFetchMyLLMs()
  const allowedTypes = types ? new Set(types) : null
  const valueMode = options?.valueMode || 'name'

  const groupedOptions = Object.entries(myLLMs)
    .map(([providerName, provider]) => {
      const models = (provider.llm || [])
        .filter(
          (model) =>
            (!allowedTypes || allowedTypes.has(model.type)) &&
            isLLMModelEnabled(model),
        )
        .map((model: MyLLMModel) => ({
          label: getLLMModelLabel(model),
          value: getLLMModelValue(model, providerName, valueMode),
          providerName,
          type: model.type,
        }))

      return {
        label: providerName,
        providerName,
        options: models,
      } satisfies LLMGroupedOptionGroup
    })
    .map((group) => ({
      ...group,
      options: [
        ...new Map(
          group.options.map((option) => [option.value, option]),
        ).values(),
      ],
    }))
    .filter((group) => group.options.length > 0)

  return { options: groupedOptions, isLoading }
}

// 获取聊天模型选项
export const useChatModelOptions = () => useLLMOptions('chat')

// 获取 Embedding 模型选项
export const useEmbeddingModelOptions = () => useLLMOptions('embedding')

// 获取 Rerank 模型选项
export const useRerankModelOptions = () => useLLMOptions('rerank')

// 获取分组的聊天模型选项
export const useChatModelGroupedOptions = () => useLLMGroupedOptions('chat')

// 获取分组的 Embedding 模型选项
export const useEmbeddingModelGroupedOptions = () =>
  useLLMGroupedOptions('embedding')

// 获取分组的 Rerank 模型选项
export const useRerankModelGroupedOptions = () => useLLMGroupedOptions('rerank')
