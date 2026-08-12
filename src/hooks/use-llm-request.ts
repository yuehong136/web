/**
 * LLM Request Hooks
 *
 * 使用 TanStack Query 管理 LLM 模型相关的服务器状态
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { llmAPI } from '@/api/llm'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'
import {
  buildLLMValue,
  isLLMModelEnabled,
  type LLMValueMode,
  type MyLLMModel,
  type MyLLMProvider,
  type LLMFactoryInterface,
  type AddLlmParams,
  type ModelVerifyResult,
} from '@/stores/model'

// Query Keys 统一管理
export const llmKeys = {
  all: ['llm'] as const,
  myLLMs: () => [...llmKeys.all, 'myLLMs'] as const,
  factories: () => [...llmKeys.all, 'factories'] as const,
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

// 获取我的 LLM 列表
export const useFetchMyLLMs = () => {
  const { data, isFetching, isError, error, refetch } = useQuery<MyLLMProvider>(
    {
      queryKey: llmKeys.myLLMs(),
      queryFn: async () => {
        const response = await llmAPI.getMyLLMs()
        return response as unknown as MyLLMProvider
      },
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  )

  return {
    myLLMs: (data ?? {}) as MyLLMProvider,
    isLoading: isFetching,
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
    queryFn: async () => {
      const response = await llmAPI.getFactories()
      return response
    },
    staleTime: 10 * 60 * 1000, // 工厂列表变化不频繁
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return {
    factories: data ?? [],
    isLoading: isFetching,
    isError,
    error,
    refetch,
  }
}

// 设置 API Key（云服务厂商）；verify 模式返回校验结果且不刷新列表，否则失效 myLLMs
export const useSetApiKey = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    meta: { errorFeedback: MutationErrorFeedback.Local },
    mutationFn: (params: {
      llmFactory: string
      apiKey: string
      baseUrl?: string
      additionalParams?: Record<string, unknown>
      verify?: boolean
    }) =>
      llmAPI.setApiKey(
        params.llmFactory,
        params.apiKey,
        params.baseUrl,
        params.additionalParams,
        params.verify,
      ),
    onSuccess: (_response, params) => {
      if (!params.verify) {
        queryClient.invalidateQueries({ queryKey: llmKeys.myLLMs() })
      }
    },
  })

  // 位置参数包装，保持与原 store.setApiKey 一致的调用签名与返回形态
  const setApiKey = async (
    llmFactory: string,
    apiKey: string,
    baseUrl?: string,
    additionalParams?: Record<string, unknown>,
    verify = false,
  ): Promise<ModelVerifyResult | undefined> => {
    const response = await mutation.mutateAsync({
      llmFactory,
      apiKey,
      baseUrl,
      additionalParams,
      verify,
    })
    if (verify) {
      return {
        isValid: Boolean(response?.success),
        logs: response?.success ? '验证成功' : '验证失败',
      }
    }
    return undefined
  }

  return {
    setApiKey,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

// 添加本地模型；verify 模式返回校验结果且不刷新列表，否则失效 myLLMs
export const useAddLLM = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    meta: { errorFeedback: MutationErrorFeedback.Local },
    mutationFn: ({
      params,
      verify,
    }: {
      params: AddLlmParams
      verify?: boolean
    }) => llmAPI.addLLM(params, verify),
    onSuccess: (_response, { verify }) => {
      if (!verify) {
        queryClient.invalidateQueries({ queryKey: llmKeys.myLLMs() })
      }
    },
  })

  const addLLM = async (
    params: AddLlmParams,
    verify = false,
  ): Promise<ModelVerifyResult | undefined> => {
    const response = await mutation.mutateAsync({ params, verify })
    if (verify) {
      return {
        isValid: Boolean(response?.success),
        logs: response?.success ? '验证成功' : '验证失败',
      }
    }
    return undefined
  }

  return {
    addLLM,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

// 启用/禁用指定模型，成功后失效 myLLMs
export const useEnableLLM = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({
      llmFactory,
      llmName,
      enabled,
    }: {
      llmFactory: string
      llmName: string
      enabled: boolean
    }) => llmAPI.enableLlm(llmFactory, llmName, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: llmKeys.myLLMs() })
    },
  })

  const enableLlm = (llmFactory: string, llmName: string, enabled: boolean) =>
    mutation.mutateAsync({ llmFactory, llmName, enabled })

  return {
    enableLlm,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

// 删除 LLM 工厂
export const useDeleteFactory = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (llmFactory: string) => {
      await llmAPI.deleteFactory(llmFactory)
      return llmFactory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: llmKeys.myLLMs() })
    },
  })

  return {
    deleteFactory: mutateAsync,
    isLoading: isPending,
    isError,
    error,
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
        label: `${providerName} / ${model.name}`,
        value: model.name,
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
  const allowedTypes = types?.length ? new Set(types) : null
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
          label: model.name,
          value: buildLLMValue(model.name, providerName, valueMode),
          providerName,
          type: model.type,
        }))

      return {
        label: providerName,
        providerName,
        options: models,
      } satisfies LLMGroupedOptionGroup
    })
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
