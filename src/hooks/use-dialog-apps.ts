import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { dialogAPI } from '@/api/dialog'
import { queryKeys, invalidateQueries } from '@/lib/query-client'
import { toast } from '@/lib/toast'
import type { DialogApp } from '../types/api'

// 获取对话应用列表
export const useDialogApps = () => {
  return useQuery({
    queryKey: queryKeys.dialogApps.list(),
    queryFn: () => dialogAPI.list(),
  })
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
    }) => dialogAPI.set(data),
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