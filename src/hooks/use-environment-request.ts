/**
 * API Environment Request Hooks
 *
 * 使用 TanStack Query 管理 API 环境（environments）的服务器状态。
 * 客户端态仅保留 selectedEnvironmentId（持久化）于 src/stores/environmentStore.ts。
 */

import { useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { environmentAPI } from '@/api/environment'
import { useEnvironmentStore } from '@/stores/environmentStore'
import type {
  EnvironmentCreate,
  EnvironmentUpdate,
  EnvironmentVariableCreate,
} from '@/types/api'

// Query Keys 统一管理
export const environmentKeys = {
  all: ['environments'] as const,
  lists: () => [...environmentKeys.all, 'list'] as const,
  list: (params: Record<string, unknown> = {}) =>
    [...environmentKeys.lists(), params] as const,
  details: () => [...environmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...environmentKeys.details(), id] as const,
  global: () => [...environmentKeys.all, 'global'] as const,
}

interface QueryOpts {
  enabled?: boolean
}

// 环境列表 + 自动选默认环境（沿用原 store.loadEnvironments 行为：列表加载后
// 若尚无选中环境，则选中默认/第一个，写入持久化的 selectedEnvironmentId）
export const useFetchEnvironments = (opts: QueryOpts = {}) => {
  const { enabled = true } = opts
  const selectedEnvironmentId = useEnvironmentStore(
    (s) => s.selectedEnvironmentId,
  )
  const selectEnvironment = useEnvironmentStore((s) => s.selectEnvironment)

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: environmentKeys.list(),
    queryFn: () => environmentAPI.getEnvironments(),
    enabled,
  })

  useEffect(() => {
    if (!selectedEnvironmentId && data && data.length > 0) {
      const defaultEnv = data.find((env) => env.is_default) || data[0]
      selectEnvironment(defaultEnv.id)
    }
  }, [selectedEnvironmentId, data, selectEnvironment])

  return {
    environments: data ?? [],
    isLoading: isFetching,
    isError,
    error,
    refetch,
  }
}

// 单个环境详情（含变量）
export const useFetchEnvironment = (
  id?: string | null,
  opts: QueryOpts = {},
) => {
  const { enabled = true } = opts
  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: environmentKeys.detail(id || ''),
    queryFn: () => environmentAPI.getEnvironment(id as string),
    enabled: enabled && !!id,
  })

  return {
    environment: data ?? null,
    isLoading: isFetching,
    isError,
    error,
    refetch,
  }
}

// 全局预设环境
export const useFetchGlobalEnvironments = (opts: QueryOpts = {}) => {
  const { enabled = true } = opts
  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: environmentKeys.global(),
    queryFn: () => environmentAPI.getGlobalEnvironments(),
    enabled,
  })

  return {
    globalEnvironments: data ?? [],
    isLoading: isFetching,
    isError,
    error,
    refetch,
  }
}

// ============ Mutations ============

export const useCreateEnvironment = () => {
  const queryClient = useQueryClient()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (data: EnvironmentCreate) =>
      environmentAPI.createEnvironment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: environmentKeys.lists() })
    },
  })
  return { createEnvironment: mutateAsync, isLoading: isPending }
}

export const useUpdateEnvironment = () => {
  const queryClient = useQueryClient()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EnvironmentUpdate }) =>
      environmentAPI.updateEnvironment(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: environmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: environmentKeys.detail(id) })
    },
  })
  return { updateEnvironment: mutateAsync, isLoading: isPending }
}

export const useDeleteEnvironment = () => {
  const queryClient = useQueryClient()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (id: string) => environmentAPI.deleteEnvironment(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: environmentKeys.lists() })
      queryClient.removeQueries({ queryKey: environmentKeys.detail(id) })
    },
  })
  return { deleteEnvironment: mutateAsync, isLoading: isPending }
}

export const useDuplicateEnvironment = () => {
  const queryClient = useQueryClient()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: ({ id, newName }: { id: string; newName: string }) =>
      environmentAPI.duplicateEnvironment(id, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: environmentKeys.lists() })
    },
  })
  return { duplicateEnvironment: mutateAsync, isLoading: isPending }
}

// 变量增删改（合并为一个 hook，返回与原 store 一致的位置参数函数，消费方调用零改动）
export const useEnvironmentVariableMutations = () => {
  const queryClient = useQueryClient()
  const invalidateDetail = useCallback(
    (environmentId: string) =>
      queryClient.invalidateQueries({
        queryKey: environmentKeys.detail(environmentId),
      }),
    [queryClient],
  )

  const addMutation = useMutation({
    mutationFn: ({
      environmentId,
      data,
    }: {
      environmentId: string
      data: EnvironmentVariableCreate
    }) => environmentAPI.createVariable(environmentId, data),
    onSuccess: (_result, { environmentId }) => invalidateDetail(environmentId),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      environmentId,
      variableId,
      data,
    }: {
      environmentId: string
      variableId: string
      data: Partial<EnvironmentVariableCreate>
    }) => environmentAPI.updateVariable(environmentId, variableId, data),
    onSuccess: (_result, { environmentId }) => invalidateDetail(environmentId),
  })

  const deleteMutation = useMutation({
    mutationFn: ({
      environmentId,
      variableId,
    }: {
      environmentId: string
      variableId: string
    }) => environmentAPI.deleteVariable(environmentId, variableId),
    onSuccess: (_result, { environmentId }) => invalidateDetail(environmentId),
  })

  const addVariable = useCallback(
    (environmentId: string, data: EnvironmentVariableCreate) =>
      addMutation.mutateAsync({ environmentId, data }),
    [addMutation],
  )
  const updateVariable = useCallback(
    (
      environmentId: string,
      variableId: string,
      data: Partial<EnvironmentVariableCreate>,
    ) => updateMutation.mutateAsync({ environmentId, variableId, data }),
    [updateMutation],
  )
  const deleteVariable = useCallback(
    (environmentId: string, variableId: string) =>
      deleteMutation.mutateAsync({ environmentId, variableId }),
    [deleteMutation],
  )

  return { addVariable, updateVariable, deleteVariable }
}

// 组合 hook：选中环境 + 其详情 + 绑定的变量解析工具（供 ApiKeysPage 等使用，
// 替代原 store 的 currentEnvironment/resolveText/getVariableMap，消费方解构形态不变）
export const useEnvironmentResolver = () => {
  const selectedEnvironmentId = useEnvironmentStore(
    (s) => s.selectedEnvironmentId,
  )
  const selectEnvironment = useEnvironmentStore((s) => s.selectEnvironment)
  const { environment: currentEnvironment } = useFetchEnvironment(
    selectedEnvironmentId,
  )

  const getVariableMap = useCallback(
    () =>
      currentEnvironment
        ? environmentAPI.getVariableMap(currentEnvironment)
        : {},
    [currentEnvironment],
  )

  const resolveText = useCallback(
    (text: string) =>
      currentEnvironment
        ? environmentAPI.resolveVariables(
            text,
            environmentAPI.getVariableMap(currentEnvironment),
          )
        : text,
    [currentEnvironment],
  )

  return {
    currentEnvironment,
    selectedEnvironmentId,
    selectEnvironment,
    getVariableMap,
    resolveText,
  }
}
