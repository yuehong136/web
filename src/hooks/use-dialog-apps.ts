import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { dialogAPI, type DialogListResponse } from '@/api/dialog'
import { queryKeys, invalidateQueries } from '@/lib/query-client'
import { toast } from '@/lib/toast'
import type { DialogApp } from '../types/api'
import { useDebouncedValue } from './useDebouncedValue'

// 分页参数类型
interface PaginationState {
  current: number
  pageSize: number
}

// 获取对话应用列表（带分页和搜索，与 ragflow 保持一致）
export const useFetchDialogList = (
  initialPageSize = 30,
  options?: { enabled?: boolean },
) => {
  const [searchString, setSearchString] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pageSize: initialPageSize,
  })

  const debouncedSearchString = useDebouncedValue(searchString, 500)

  const handleInputChange = useCallback((value: string) => {
    setSearchString(value)
    // 搜索时重置到第一页
    setPagination(prev => ({ ...prev, current: 1 }))
  }, [])

  const { data, isFetching, isError, error, refetch } = useQuery<DialogListResponse>({
    queryKey: queryKeys.dialogApps.list({
      keywords: debouncedSearchString,
      page: pagination.current,
      page_size: pagination.pageSize,
    }),
    queryFn: () => dialogAPI.list({
      keywords: debouncedSearchString,
      page: pagination.current,
      page_size: pagination.pageSize,
    }),
    // 使用 placeholderData 而不是 initialData，确保触发真实的 API 请求
    placeholderData: { dialogs: [], total: 0 },
    staleTime: 0,
    gcTime: 5 * 60 * 1000, // 5 分钟
    refetchOnWindowFocus: false,
    enabled: options?.enabled ?? true,
  })

  return {
    data: data ?? { dialogs: [], total: 0 },
    loading: isFetching,
    isError,
    error,
    refetch,
    searchString,
    handleInputChange,
    pagination,
    setPagination,
  }
}

// 获取对话应用列表（简化版，向后兼容）
export const useDialogApps = (options?: { enabled?: boolean }) => {
  const { data, loading, isError, error, refetch } = useFetchDialogList(100, options)
  return {
    data: data.dialogs,
    isLoading: loading,
    isError,
    error,
    refetch,
  }
}

// 获取对话应用详情
export const useDialogApp = (dialogId: string) => {
  return useQuery({
    queryKey: queryKeys.dialogApps.detail(dialogId),
    queryFn: () => dialogAPI.getDetail(dialogId),
    enabled: !!dialogId,
  })
}

// 创建或更新对话应用
export const useSetDialogApp = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: {
      dialog_id?: string
      name: string
      description: string
      icon: string
      prompt_config?: any
      kb_ids?: string[]
    }) => {
      // 如果没有提供 prompt_config，添加一个默认的不包含 {knowledge} 的配置
      const requestData = {
        ...data,
        prompt_config: data.prompt_config || {
          system: '你是一个智能助手，请提供有帮助的回答。',
          prologue: '您好，我是您的助手！',
          empty_response: '',
          parameters: []
        },
        kb_ids: data.kb_ids || []
      }
      return dialogAPI.set(requestData)
    },
    onSuccess: (dialogApp, variables) => {
      // 更新缓存
      if (variables.dialog_id) {
        queryClient.setQueryData(
          queryKeys.dialogApps.detail(variables.dialog_id),
          dialogApp
        )
      }
      
      // 使对话应用列表查询失效
      invalidateQueries.dialogApps()
      
      toast.success(variables.dialog_id ? '应用更新成功' : '应用创建成功')
      return dialogApp
    },
    onError: (error: any) => {
      console.error('Dialog app creation error:', error)
      toast.error(error.message || '操作失败')
    },
  })
}

// 创建对话应用 (兼容旧接口)
export const useCreateDialogApp = () => {
  return useSetDialogApp()
}

// 更新对话应用
export const useUpdateDialogApp = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ dialogId, data }: { 
      dialogId: string
      data: Partial<DialogApp>
    }) => dialogAPI.update(dialogId, data),
    onSuccess: (updatedDialogApp) => {
      // 更新缓存
      queryClient.setQueryData(
        queryKeys.dialogApps.detail(updatedDialogApp.id),
        updatedDialogApp
      )
      
      // 使对话应用列表查询失效
      invalidateQueries.dialogApps()
      
      toast.success('应用更新成功')
    },
    onError: (error: any) => {
      toast.error(error.message || '更新应用失败')
    },
  })
}

// 删除对话应用
export const useDeleteDialogApps = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (dialogIds: string[]) => 
      dialogAPI.remove(dialogIds),
    onSuccess: (_, dialogIds) => {
      // 从缓存中移除
      dialogIds.forEach(dialogId => {
        queryClient.removeQueries({
          queryKey: queryKeys.dialogApps.detail(dialogId)
        })
      })
      
      // 使对话应用列表查询失效
      invalidateQueries.dialogApps()
      
      toast.success('应用删除成功')
    },
    onError: (error: any) => {
      toast.error(error.message || '删除应用失败')
    },
  })
}

// 导出对话应用模版
export const useExportDialogApps = () => {
  return useMutation({
    mutationFn: (dialogIds: string[]) => dialogAPI.exportTemplates(dialogIds),
    onSuccess: () => {
      toast.success('模版导出成功')
    },
    onError: (error: any) => {
      toast.error(error.message || '模版导出失败')
    },
  })
}

// 导入对话应用模版
export const useImportDialogApps = () => {
  return useMutation({
    mutationFn: (file: File) => dialogAPI.importTemplates(file),
    onSuccess: (result) => {
      const { imported, failed } = result
      if (imported.length > 0) {
        invalidateQueries.dialogApps()
      }
      if (failed.length > 0) {
        toast.error(`${failed.length} 个模版导入失败`)
      } else {
        toast.success(`成功导入 ${imported.length} 个应用`)
      }
    },
    onError: (error: any) => {
      toast.error(error.message || '模版导入失败')
    },
  })
}
