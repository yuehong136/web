/**
 * LLM Request Hooks
 * 
 * 使用 TanStack Query 管理 LLM 模型相关的服务器状态
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { llmAPI } from '@/api/llm'
import type { MyLLMProvider, LLMFactoryInterface, AddLlmParams } from '@/stores/model'

// Query Keys 统一管理
export const llmKeys = {
  all: ['llm'] as const,
  myLLMs: () => [...llmKeys.all, 'myLLMs'] as const,
  factories: () => [...llmKeys.all, 'factories'] as const,
}

// 获取我的 LLM 列表
export const useFetchMyLLMs = () => {
  const { data, isFetching, isError, error, refetch } = useQuery<Record<string, any>>({
    queryKey: llmKeys.myLLMs(),
    queryFn: async () => {
      const response = await llmAPI.getMyLLMs()
      return response as any
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

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
  const { data, isFetching, isError, error, refetch } = useQuery<LLMFactoryInterface[]>({
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

// 设置 API Key
export const useSetApiKey = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (params: {
      llmFactory: string
      apiKey: string
      baseUrl?: string
      additionalParams?: Record<string, any>
    }) => {
      await llmAPI.setApiKey(
        params.llmFactory, 
        params.apiKey,
        params.baseUrl,
        params.additionalParams
      )
      return params
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: llmKeys.myLLMs() })
    },
  })

  return {
    setApiKey: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  }
}

// 添加 LLM 模型
export const useAddLLM = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (params: AddLlmParams) => {
      await llmAPI.addLLM(params)
      return params
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: llmKeys.myLLMs() })
    },
  })

  return {
    addLLM: mutateAsync,
    isLoading: isPending,
    isError,
    error,
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

  const options = Object.entries(myLLMs).flatMap(([providerName, provider]: [string, any]) => {
    return (provider.llm || [])
      .filter((model: any) => !type || model.type === type)
      .map((model: any) => ({
        label: `${providerName} / ${model.name}`,
        value: model.name,
        provider: providerName,
        type: model.type,
      }))
  })

  return { options, isLoading }
}

// 获取聊天模型选项
export const useChatModelOptions = () => useLLMOptions('chat')

// 获取 Embedding 模型选项
export const useEmbeddingModelOptions = () => useLLMOptions('embedding')

// 获取 Rerank 模型选项
export const useRerankModelOptions = () => useLLMOptions('rerank')
