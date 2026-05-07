import { useMutation, useQueryClient } from '@tanstack/react-query'
import { agentAPI } from '@/api/agent'
import { toast } from '@/lib/toast'
import { adaptAgentFlow, adaptAgentSession } from '@/pages/agent/adapters'
import { agentQueryKeys } from './use-agent-query'
import type {
  DebugAgentNodePayload,
  AgentWebhookTestRequest,
  SetAgentPayload,
} from '@/types/agent'

export interface UploadCanvasFileParams {
  canvasId: string
  file: File | File[]
  onProgress?: (progress: number) => void
  signal?: AbortSignal
}

export const useSetAgent = (options?: { showToast?: boolean }) => {
  const queryClient = useQueryClient()
  const showToast = options?.showToast ?? true

  const mutation = useMutation({
    mutationFn: async (payload: SetAgentPayload) =>
      adaptAgentFlow(await agentAPI.setAgent(payload)),
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: agentQueryKeys.lists() })
      if (variables.id || data.id) {
        void queryClient.invalidateQueries({
          queryKey: agentQueryKeys.detail(variables.id || data.id),
        })
        void queryClient.invalidateQueries({
          queryKey: agentQueryKeys.versions(variables.id || data.id),
        })
      }
      if (showToast) {
        toast.success('保存成功')
      }
    },
    onError: (error: Error) => {
      if (showToast) {
        toast.error(`保存失败: ${error.message}`)
      }
    },
  })

  return {
    setAgent: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

export const useDeleteAgent = () => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (id: string) => agentAPI.deleteAgent(id),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: agentQueryKeys.lists() })
      queryClient.removeQueries({ queryKey: agentQueryKeys.detail(id) })
      toast.success('已删除智能体')
    },
    onError: (error: Error) => {
      toast.error(`删除失败: ${error.message}`)
    },
  })

  return {
    deleteAgent: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

export const useResetAgent = () => {
  const mutation = useMutation({
    mutationFn: async (id: string) => agentAPI.resetAgent(id),
    onSuccess: () => {
      toast.success('执行状态已重置')
    },
    onError: (error: Error) => {
      toast.error(`重置失败: ${error.message}`)
    },
  })

  return {
    resetAgent: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

export const useUpdateAgentSetting = () => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: agentAPI.updateSetting,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: agentQueryKeys.lists() })
      void queryClient.invalidateQueries({
        queryKey: agentQueryKeys.detail(variables.id),
      })
      toast.success('配置已更新')
    },
    onError: (error: Error) => {
      toast.error(`更新失败: ${error.message}`)
    },
  })

  return {
    updateAgentSetting: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

export const useUploadCanvasFile = () => {
  const mutation = useMutation({
    mutationFn: async ({
      canvasId,
      file,
      onProgress,
      signal,
    }: UploadCanvasFileParams) => {
      if (onProgress || signal) {
        if (Array.isArray(file)) {
          throw new Error('批量文件上传暂不支持进度回调')
        }

        return agentAPI.uploadCanvasFileWithProgress(
          canvasId,
          file,
          onProgress,
          signal,
        )
      }

      return agentAPI.uploadFile(canvasId, file)
    },
    onError: (error: Error) => {
      toast.error(`上传失败: ${error.message}`)
    },
  })

  return {
    uploadCanvasFile: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

export const useUploadPublicCanvasFile = () => {
  const mutation = useMutation({
    mutationFn: async ({
      canvasId,
      file,
      onProgress,
      signal,
    }: UploadCanvasFileParams) => {
      if (onProgress || signal) {
        if (Array.isArray(file)) {
          throw new Error('批量文件上传暂不支持进度回调')
        }

        return agentAPI.uploadPublicCanvasFileWithProgress(
          canvasId,
          file,
          onProgress,
          signal,
        )
      }

      return agentAPI.uploadPublicFile(canvasId, file)
    },
    onError: (error: Error) => {
      toast.error(`上传失败: ${error.message}`)
    },
  })

  return {
    uploadCanvasFile: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

export const useTestWebhook = () => {
  const mutation = useMutation({
    mutationFn: async (payload: AgentWebhookTestRequest) =>
      agentAPI.testWebhook(payload),
    onError: (error: Error) => {
      toast.error(`Webhook 测试失败: ${error.message}`)
    },
  })

  return {
    testWebhook: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

export const useDebugSingle = () => {
  const mutation = useMutation({
    mutationFn: async (payload: DebugAgentNodePayload) =>
      agentAPI.debugSingle(payload),
    onError: (error: Error) => {
      toast.error(`调试失败: ${error.message}`)
    },
  })

  return {
    debugSingle: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

export const useCancelConversation = () => {
  const mutation = useMutation({
    mutationFn: async (taskId: string) => agentAPI.cancelTask(taskId),
  })

  return {
    cancelConversation: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

export const useCancelDataflow = () => {
  const mutation = useMutation({
    mutationFn: async (taskId: string) => agentAPI.cancelDataflow(taskId),
  })

  return {
    cancelDataflow: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

export const useCreateAgentSession = (canvasId: string) => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (name: string) =>
      adaptAgentSession(await agentAPI.createSession(canvasId, name)),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...agentQueryKeys.all, 'sessions', canvasId],
      })
    },
  })

  return {
    createAgentSession: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

export const useDeleteAgentSession = (canvasId: string) => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (sessionId: string) =>
      agentAPI.deleteSession(canvasId, sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...agentQueryKeys.all, 'sessions', canvasId],
      })
    },
  })

  return {
    deleteAgentSession: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}
