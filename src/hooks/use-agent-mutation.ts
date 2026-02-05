import { useMutation, useQueryClient } from '@tanstack/react-query'
import { agentAPI } from '@/api/agent'
import { agentQueryKeys } from './use-agent-query'
import type { IDebugNodeRequest, ISetAgentRequest } from '@/pages/agent/types'
import { toast } from '@/lib/toast'

export interface UploadCanvasFileParams {
  canvasId: string
  file: File
  onProgress?: (progress: number) => void
  signal?: AbortSignal
}

export const useSetAgent = (options?: { showToast?: boolean }) => {
  const queryClient = useQueryClient()
  const showToast = options?.showToast ?? true

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (params: ISetAgentRequest) => agentAPI.setAgent(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: agentQueryKeys.lists() })
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: agentQueryKeys.detail(variables.id) })
      }
      if (showToast) {
        toast.success('保存成功')
      }
    },
    onError: (err: Error) => {
      if (showToast) {
        toast.error(`保存失败: ${err.message}`)
      }
    },
  })

  return { setAgent: mutateAsync, isLoading: isPending, isError, error }
}

export const useDeleteAgent = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (id: string) => agentAPI.deleteAgent(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: agentQueryKeys.lists() })
      queryClient.removeQueries({ queryKey: agentQueryKeys.detail(id) })
      toast.success('删除成功')
    },
    onError: (err: Error) => {
      toast.error(`删除失败: ${err.message}`)
    },
  })

  return { deleteAgent: mutateAsync, isLoading: isPending, isError, error }
}

export const useResetAgent = () => {
  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (id: string) => agentAPI.resetAgent(id),
    onSuccess: () => {
      toast.success('重置成功')
    },
    onError: (err: Error) => {
      toast.error(`重置失败: ${err.message}`)
    },
  })

  return { resetAgent: mutateAsync, isLoading: isPending, isError, error }
}

export const useUpdateAgentSetting = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (params: {
      id: string
      title: string
      description?: string
      avatar?: string
      permission?: string
    }) => agentAPI.updateSetting(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: agentQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: agentQueryKeys.detail(variables.id) })
      toast.success('更新成功')
    },
    onError: (err: Error) => {
      toast.error(`更新失败: ${err.message}`)
    },
  })

  return { updateAgentSetting: mutateAsync, isLoading: isPending, isError, error }
}

export const useUploadCanvasFile = () => {
  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (params: UploadCanvasFileParams) => {
      const { canvasId, file, onProgress, signal } = params
      if (onProgress || signal) {
        return agentAPI.uploadCanvasFileWithProgress(canvasId, file, onProgress, signal)
      }
      return agentAPI.uploadFile(canvasId, file)
    },
    onError: (err: Error) => {
      toast.error(`上传失败: ${err.message}`)
    },
  })

  return { uploadCanvasFile: mutateAsync, isLoading: isPending, isError, error }
}

export const useDebugSingle = () => {
  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (params: IDebugNodeRequest) => agentAPI.debugSingle(params),
    onError: (err: Error) => {
      toast.error(`调试失败: ${err.message}`)
    },
  })

  return { debugSingle: mutateAsync, isLoading: isPending, isError, error }
}

export const useCancelConversation = () => {
  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (taskId: string) => agentAPI.cancelTask(taskId),
  })

  return { cancelConversation: mutateAsync, isLoading: isPending, isError, error }
}

export const useCancelDataflow = () => {
  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (taskId: string) => agentAPI.cancelDataflow(taskId),
  })

  return { cancelDataflow: mutateAsync, isLoading: isPending, isError, error }
}
