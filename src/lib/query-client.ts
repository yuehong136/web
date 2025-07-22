import { QueryClient } from '@tanstack/react-query'

const queryConfig = {
  queries: {
    retry: (failureCount, error: any) => {
      // 不重试认证错误
      if (error?.status === 401 || error?.status === 403) {
        return false
      }
      // 最多重试2次
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5分钟
    gcTime: 10 * 60 * 1000, // 10分钟 (原cacheTime)
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
  mutations: {
    retry: false,
    onError: (error: any) => {
      // 全局错误处理
      console.error('Query error:', error)
    },
  },
}

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
})

// 查询键工厂
export const queryKeys = {
  // 用户相关
  user: {
    all: ['user'] as const,
    info: () => [...queryKeys.user.all, 'info'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
  },
  
  // 对话相关
  conversations: {
    all: ['conversations'] as const,
    lists: () => [...queryKeys.conversations.all, 'list'] as const,
    list: (filters: Record<string, any>) => 
      [...queryKeys.conversations.lists(), { filters }] as const,
    details: () => [...queryKeys.conversations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.conversations.details(), id] as const,
    messages: (id: string) => [...queryKeys.conversations.detail(id), 'messages'] as const,
  },
  
  // 知识库相关
  knowledgeBases: {
    all: ['knowledgeBases'] as const,
    lists: () => [...queryKeys.knowledgeBases.all, 'list'] as const,
    list: (filters: Record<string, any>) => 
      [...queryKeys.knowledgeBases.lists(), { filters }] as const,
    details: () => [...queryKeys.knowledgeBases.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.knowledgeBases.details(), id] as const,
    graph: (id: string) => [...queryKeys.knowledgeBases.detail(id), 'graph'] as const,
  },
  
  // 文档相关
  documents: {
    all: ['documents'] as const,
    lists: () => [...queryKeys.documents.all, 'list'] as const,
    list: (kbId: string, filters: Record<string, any>) => 
      [...queryKeys.documents.lists(), kbId, { filters }] as const,
    details: () => [...queryKeys.documents.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.documents.details(), id] as const,
  },
  
  // MCP服务器相关
  mcpServers: {
    all: ['mcpServers'] as const,
    lists: () => [...queryKeys.mcpServers.all, 'list'] as const,
    list: (filters: Record<string, any>) => 
      [...queryKeys.mcpServers.lists(), { filters }] as const,
    details: () => [...queryKeys.mcpServers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.mcpServers.details(), id] as const,
    tools: (id: string) => [...queryKeys.mcpServers.detail(id), 'tools'] as const,
  },
  
  // 大语言模型相关
  llms: {
    all: ['llms'] as const,
    lists: () => [...queryKeys.llms.all, 'list'] as const,
    list: (filters: Record<string, any>) => 
      [...queryKeys.llms.lists(), { filters }] as const,
    details: () => [...queryKeys.llms.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.llms.details(), id] as const,
  },
  
  // 工作流相关
  workflows: {
    all: ['workflows'] as const,
    lists: () => [...queryKeys.workflows.all, 'list'] as const,
    list: (filters: Record<string, any>) => 
      [...queryKeys.workflows.lists(), { filters }] as const,
    details: () => [...queryKeys.workflows.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.workflows.details(), id] as const,
    executions: (id: string) => [...queryKeys.workflows.detail(id), 'executions'] as const,
  },
  
  // 系统统计相关
  stats: {
    all: ['stats'] as const,
    system: () => [...queryKeys.stats.all, 'system'] as const,
    api: () => [...queryKeys.stats.all, 'api'] as const,
    usage: (timeRange: string) => [...queryKeys.stats.all, 'usage', timeRange] as const,
  },
} as const

// 查询失效帮助函数
export const invalidateQueries = {
  user: () => queryClient.invalidateQueries({ queryKey: queryKeys.user.all }),
  conversations: () => queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all }),
  knowledgeBases: () => queryClient.invalidateQueries({ queryKey: queryKeys.knowledgeBases.all }),
  documents: () => queryClient.invalidateQueries({ queryKey: queryKeys.documents.all }),
  mcpServers: () => queryClient.invalidateQueries({ queryKey: queryKeys.mcpServers.all }),
  llms: () => queryClient.invalidateQueries({ queryKey: queryKeys.llms.all }),
  workflows: () => queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all }),
  stats: () => queryClient.invalidateQueries({ queryKey: queryKeys.stats.all }),
}