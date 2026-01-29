/**
 * MCP 服务器相关的 TanStack Query Hooks
 * 遵循项目架构：服务器状态使用 TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mcpAPI } from '@/api/mcp'
import type {
  MCPServer,
  MCPTool,
  CreateMCPServerRequest,
  UpdateMCPServerRequest,
  TestMCPRequest,
} from '@/types/mcp'
import { toast } from '@/lib/toast'

// Query Keys
export const mcpQueryKeys = {
  all: ['mcp'] as const,
  servers: () => [...mcpQueryKeys.all, 'servers'] as const,
  serverList: (params?: { keywords?: string; page?: number; page_size?: number }) =>
    [...mcpQueryKeys.servers(), 'list', params] as const,
  serverDetail: (id: string) => [...mcpQueryKeys.servers(), 'detail', id] as const,
  tools: () => [...mcpQueryKeys.all, 'tools'] as const,
  toolsByServers: (mcpIds: string[]) => [...mcpQueryKeys.tools(), mcpIds] as const,
}

/**
 * 从服务器的 variables.tools 中提取工具列表
 */
export const getServerTools = (server: MCPServer): MCPTool[] => {
  const toolsMap = server.variables?.tools as Record<string, MCPTool> | undefined
  if (!toolsMap) return []
  
  return Object.entries(toolsMap).map(([name, tool]) => ({
    name,
    description: tool.description || '',
    inputSchema: tool.inputSchema,
    enabled: tool.enabled,
  }))
}

/**
 * 判断服务器是否有缓存的工具（视为在线）
 */
export const hasServerTools = (server: MCPServer): boolean => {
  const toolsMap = server.variables?.tools as Record<string, MCPTool> | undefined
  return toolsMap ? Object.keys(toolsMap).length > 0 : false
}

/**
 * 获取 MCP 服务器列表
 */
export const useFetchMCPServers = (params?: {
  keywords?: string
  page?: number
  page_size?: number
  enabled?: boolean
}) => {
  const { keywords, page = 1, page_size = 50, enabled = true } = params || {}

  return useQuery({
    queryKey: mcpQueryKeys.serverList({ keywords, page, page_size }),
    queryFn: async () => {
      const response = await mcpAPI.listServers({}, {
        keywords: keywords || undefined,
        page,
        page_size,
      })
      return response
    },
    enabled,
    staleTime: 30 * 1000, // 30 秒内认为数据新鲜
  })
}

/**
 * 获取 MCP 服务器详情
 */
export const useFetchMCPServerDetail = (mcpId: string, enabled = true) => {
  return useQuery({
    queryKey: mcpQueryKeys.serverDetail(mcpId),
    queryFn: () => mcpAPI.getServerDetail(mcpId),
    enabled: enabled && !!mcpId,
  })
}

/**
 * 获取多个服务器的工具列表（用于测试连接）
 * 注意：这会实际调用后端测试接口，请谨慎使用
 */
export const useFetchMCPTools = (mcpIds: string[], enabled = true) => {
  return useQuery({
    queryKey: mcpQueryKeys.toolsByServers(mcpIds),
    queryFn: async () => {
      if (mcpIds.length === 0) return {}
      return mcpAPI.listTools({ mcp_ids: mcpIds })
    },
    enabled: enabled && mcpIds.length > 0,
    staleTime: 60 * 1000, // 1 分钟内认为数据新鲜
  })
}

/**
 * 创建 MCP 服务器
 */
export const useCreateMCPServer = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateMCPServerRequest) => mcpAPI.createServer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mcpQueryKeys.servers() })
      toast.success('服务器创建成功')
    },
    onError: (error: Error) => {
      toast.error(`创建失败: ${error.message}`)
    },
  })
}

/**
 * 更新 MCP 服务器
 */
export const useUpdateMCPServer = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateMCPServerRequest) => mcpAPI.updateServer(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: mcpQueryKeys.servers() })
      queryClient.invalidateQueries({ queryKey: mcpQueryKeys.serverDetail(variables.mcp_id) })
      toast.success('服务器更新成功')
    },
    onError: (error: Error) => {
      toast.error(`更新失败: ${error.message}`)
    },
  })
}

/**
 * 删除 MCP 服务器
 */
export const useDeleteMCPServer = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (mcpIds: string[]) => mcpAPI.deleteServers(mcpIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mcpQueryKeys.servers() })
      toast.success('服务器删除成功')
    },
    onError: (error: Error) => {
      toast.error(`删除失败: ${error.message}`)
    },
  })
}

/**
 * 测试 MCP 连接
 */
export const useTestMCPConnection = () => {
  return useMutation({
    mutationFn: (data: TestMCPRequest) => mcpAPI.testConnection(data),
    onError: (error: Error) => {
      toast.error(`连接测试失败: ${error.message}`)
    },
  })
}

/**
 * 计算 MCP 统计数据（基于列表数据，不调用额外接口）
 */
export const useMCPStats = () => {
  const { data: serversData, isLoading } = useFetchMCPServers({ page_size: 100 })
  
  const servers = serversData?.mcp_servers || []

  // 计算工具总数（从 variables.tools 中获取）
  const totalTools = servers.reduce((sum: number, server: MCPServer) => {
    const tools = getServerTools(server)
    return sum + tools.length
  }, 0)

  // 计算有工具的服务器数（视为活跃/在线）
  const activeServers = servers.filter((server: MCPServer) => hasServerTools(server)).length

  // 计算服务器类型数量
  const serverTypes = new Set(servers.map((s: MCPServer) => s.server_type)).size

  return {
    totalServers: servers.length,
    activeServers,
    totalTools,
    serverTypes,
    isLoading,
  }
}
