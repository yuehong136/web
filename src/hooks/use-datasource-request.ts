/**
 * Data Source Request Hooks
 *
 * 使用 TanStack Query 管理数据源相关的服务器状态
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useParams } from 'react-router-dom'
import { useMemo, useCallback, useState } from 'react'
import { datasourceAPI, type DataSourceSetRequest } from '@/api/datasource'
import { DataSourceStatus } from '@/pages/settings/datasource/types'
import type {
  IDataSource,
  IDataSourceBase,
  IDataSourceLog,
  DataSourceKey,
  ICategorizedDataSource,
} from '@/pages/settings/datasource/types'
import { useDataSourceInfo } from '@/pages/settings/datasource/constants'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { toast } from '@/lib/toast'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'

// Query Keys 统一管理
export const datasourceKeys = {
  all: ['data-source'] as const,
  lists: () => [...datasourceKeys.all, 'list'] as const,
  list: () => [...datasourceKeys.lists()] as const,
  details: () => [...datasourceKeys.all, 'detail'] as const,
  detail: (id: string) => [...datasourceKeys.details(), id] as const,
  logs: (id: string, page?: number) =>
    [...datasourceKeys.all, 'logs', id, page] as const,
  byKb: (kbId: string) => [...datasourceKeys.all, 'by-kb', kbId] as const,
}

/** Explicitly tests the saved configuration; does not mutate or refresh it. */
export const useTestDataSource = (id: string) => {
  const { t } = useTranslation()
  const mutation = useMutation({
    mutationFn: () => datasourceAPI.connector.test(id),
    meta: { errorFeedback: MutationErrorFeedback.Local },
    onSuccess: () => toast.success(t('datasource.restApi.testSuccess')),
    onError: () => toast.error(t('datasource.restApi.testFailed')),
  })
  return { handleTest: () => mutation.mutate(), isTesting: mutation.isPending }
}

/**
 * 获取数据源列表
 */
export const useListDataSource = () => {
  const { dataSourceInfo } = useDataSourceInfo()

  const {
    data: list,
    isFetching,
    refetch,
  } = useQuery<IDataSource[]>({
    queryKey: datasourceKeys.list(),
    queryFn: async () => {
      const response = await datasourceAPI.connector.list()
      return response
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  // 按数据源类型分组
  const categorizedList = useMemo<ICategorizedDataSource[]>(() => {
    if (!list || list.length === 0) return []

    const categorizedData: Record<DataSourceKey, IDataSourceBase[]> =
      {} as Record<DataSourceKey, IDataSourceBase[]>

    list.forEach((item) => {
      const source = item.source
      if (!categorizedData[source]) {
        categorizedData[source] = []
      }
      categorizedData[source].push(item)
    })

    const result: ICategorizedDataSource[] = []
    Object.keys(categorizedData).forEach((key) => {
      const k = key as DataSourceKey
      if (dataSourceInfo[k]) {
        result.push({
          id: k,
          name: dataSourceInfo[k].name,
          description: dataSourceInfo[k].description,
          icon: dataSourceInfo[k].icon,
          list: categorizedData[k] || [],
        })
      }
    })

    return result
  }, [list, dataSourceInfo])

  return { list: list || [], categorizedList, isFetching, refetch }
}

/**
 * 添加数据源
 */
export const useAddDataSource = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [addingModalVisible, setAddingModalVisible] = useState(false)
  const [addSource, setAddSource] = useState<
    | {
        id: DataSourceKey
        name: string
        description: string
        icon: React.ReactNode
      }
    | undefined
  >()

  const mutation = useMutation({
    mutationFn: (data: DataSourceSetRequest) =>
      datasourceAPI.connector.set(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasourceKeys.lists() })
      message.success(t('common.operationSuccess'))
      setAddingModalVisible(false)
    },
    onError: () => {
      message.error(t('common.operationFailed'))
    },
  })

  const showAddingModal = useCallback((source: typeof addSource) => {
    setAddSource(source)
    setAddingModalVisible(true)
  }, [])

  const hideAddingModal = useCallback(() => {
    setAddingModalVisible(false)
    setAddSource(undefined)
  }, [])

  const handleAddOk = useCallback(
    async (data: DataSourceSetRequest) => {
      await mutation.mutateAsync(data)
    },
    [mutation],
  )

  return {
    addSource,
    addLoading: mutation.isPending,
    addingModalVisible,
    showAddingModal,
    hideAddingModal,
    handleAddOk,
  }
}

/**
 * 删除数据源
 */
export const useDeleteDataSource = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (id: string) => datasourceAPI.connector.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasourceKeys.lists() })
      message.success(t('common.deleted'))
    },
    onError: () => {
      message.error(t('common.operationFailed'))
    },
  })

  return {
    deleteLoading: mutation.isPending,
    handleDelete: mutation.mutate,
    handleDeleteAsync: mutation.mutateAsync,
  }
}

/**
 * 获取数据源详情
 */
export const useFetchDataSourceDetail = (id?: string) => {
  const [searchParams] = useSearchParams()
  const targetId = id || searchParams.get('id') || ''

  const { data, isFetching, refetch } = useQuery<IDataSource>({
    queryKey: datasourceKeys.detail(targetId),
    refetchInterval: (query) =>
      query.state.data?.status === DataSourceStatus.RUNNING ||
      query.state.data?.status === DataSourceStatus.SCHEDULED
        ? 5_000
        : false,
    queryFn: async () => {
      const response = await datasourceAPI.connector.get(targetId)
      return response
    },
    enabled: !!targetId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  return { data, isFetching, refetch }
}

/**
 * 获取数据源日志
 */
export const useDataSourceLogs = (id: string, autoRefresh = false) => {
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 })

  const { data, isFetching, refetch } = useQuery<{
    logs: IDataSourceLog[]
    total: number
  }>({
    queryKey: datasourceKeys.logs(id, pagination.page),
    queryFn: async () => {
      const response = await datasourceAPI.connector.logs(id, {
        page: pagination.page,
        page_size: pagination.pageSize,
      })
      return response
    },
    enabled: !!id,
    refetchInterval: autoRefresh ? 5_000 : false,
    staleTime: 1 * 60 * 1000,
  })

  return {
    logs: data?.logs || [],
    total: data?.total || 0,
    isFetching,
    refetch,
    pagination: { ...pagination, total: data?.total || 0 },
    setPagination,
  }
}

/**
 * 暂停/恢复数据源
 */
export const useUpdateDataSourceStatus = (id?: string) => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const targetId = id || searchParams.get('id') || ''
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (status: '2' | '5') =>
      datasourceAPI.connector.update(targetId, { status }),
    onSuccess: (detail) => {
      queryClient.setQueryData(datasourceKeys.detail(targetId), detail)
      queryClient.invalidateQueries({ queryKey: datasourceKeys.all })
      message.success(t('common.operationSuccess'))
    },
    onError: () => {
      message.error(t('common.operationFailed'))
    },
  })

  return {
    updateStatus: mutation.mutate,
    isLoading: mutation.isPending,
  }
}

/**
 * 重建数据源
 */
export const useDataSourceRebuild = () => {
  const { t } = useTranslation()
  const { id: kbId } = useParams()

  const mutation = useMutation({
    mutationFn: (sourceId: string) =>
      datasourceAPI.connector.rebuild(sourceId, kbId as string),
    onSuccess: () => {
      message.success(t('common.operationSuccess'))
    },
    onError: () => {
      message.error(t('common.operationFailed'))
    },
  })

  return {
    handleRebuild: mutation.mutate,
    isLoading: mutation.isPending,
  }
}

/**
 * 获取知识库关联的数据源列表
 */
export const useDataSourceByKb = (kbId: string) => {
  const { data, isFetching, refetch } = useQuery<IDataSourceBase[]>({
    queryKey: datasourceKeys.byKb(kbId),
    queryFn: async () => {
      const response = await datasourceAPI.connector.listByKb(kbId)
      return response
    },
    enabled: !!kbId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  return { dataSources: data || [], isFetching, refetch }
}

/**
 * 链接/解除链接数据源到知识库
 */
export const useLinkDataSource = (kbId: string) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const linkMutation = useMutation({
    mutationFn: ({
      connectorId,
      autoParse,
    }: {
      connectorId: string
      autoParse?: boolean
    }) => datasourceAPI.connector.link(connectorId, kbId, autoParse),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasourceKeys.byKb(kbId) })
      message.success(t('common.operationSuccess'))
    },
    onError: () => {
      message.error(t('common.operationFailed'))
    },
  })

  const unlinkMutation = useMutation({
    mutationFn: (connectorId: string) =>
      datasourceAPI.connector.unlink(connectorId, kbId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasourceKeys.byKb(kbId) })
      message.success(t('common.operationSuccess'))
    },
    onError: () => {
      message.error(t('common.operationFailed'))
    },
  })

  const updateAutoMutation = useMutation({
    mutationFn: ({
      connectorId,
      autoParse,
    }: {
      connectorId: string
      autoParse: boolean
    }) => datasourceAPI.connector.updateAutoParse(connectorId, kbId, autoParse),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasourceKeys.byKb(kbId) })
    },
    onError: () => {
      message.error(t('common.operationFailed'))
    },
  })

  return {
    link: linkMutation.mutate,
    unlink: unlinkMutation.mutate,
    updateAutoParse: updateAutoMutation.mutate,
    isLinking: linkMutation.isPending,
    isUnlinking: unlinkMutation.isPending,
  }
}
