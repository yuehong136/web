import { apiClient } from './client'
import type { 
  MCPServer, 
  CreateMCPServerRequest, 
  UpdateMCPServerRequest, 
  ListMCPServerRequest, 
  GetMultipleMCPServerRequest,
  ImportMCPServerRequest,
  ExportMCPServerRequest,
  ListToolsRequest,
  TestToolRequest,
  CacheToolsRequest,
  TestMCPRequest,
  PaginatedResponse,
  MCPTool 
} from '@/types/mcp'

/**
 * MCP服务器相关API
 * 基于现有项目的API架构模式
 */
export const mcpAPI = {
  /**
   * 获取MCP服务器列表
   */
  listServers: async (
    request: ListMCPServerRequest,
    params: {
      keywords?: string
      page?: number
      page_size?: number
      orderby?: string
      desc?: boolean
    } = {}
  ): Promise<PaginatedResponse<MCPServer>> => {
    // 构建查询参数字符串
    const searchParams = new URLSearchParams()
    if (params.keywords) searchParams.append('keywords', params.keywords)
    if (params.page) searchParams.append('page', params.page.toString())
    if (params.page_size) searchParams.append('page_size', params.page_size.toString())
    if (params.orderby) searchParams.append('orderby', params.orderby)
    if (params.desc !== undefined) searchParams.append('desc', params.desc.toString())

    const queryString = searchParams.toString()
    // 端点路径为 v1/mcp_server/list
    const endpoint = `/mcp_server/list${queryString ? '?' + queryString : ''}`
    
    return apiClient.post(endpoint, request)
  },

  /**
   * 获取MCP服务器详情
   */
  getServerDetail: async (mcpId: string): Promise<MCPServer> =>
    apiClient.get(`/v1/mcp_server/detail?mcp_id=${mcpId}`),

  /**
   * 创建MCP服务器
   */
  createServer: async (request: CreateMCPServerRequest): Promise<MCPServer> =>
    apiClient.post('/v1/mcp_server/create', request),

  /**
   * 更新MCP服务器
   */
  updateServer: async (request: UpdateMCPServerRequest): Promise<MCPServer> =>
    apiClient.post('/v1/mcp_server/update', request),

  /**
   * 删除MCP服务器
   */
  deleteServers: async (mcpIds: string[]): Promise<boolean> =>
    apiClient.post('/v1/mcp_server/rm', { mcp_ids: mcpIds }),

  /**
   * 获取服务器工具列表
   */
  listTools: async (request: ListToolsRequest): Promise<Record<string, MCPTool[]>> =>
    apiClient.post('/v1/mcp_server/list_tools', request),

  /**
   * 测试工具
   */
  testTool: async (request: TestToolRequest): Promise<{ content: any[]; isError: boolean }> =>
    apiClient.post('/v1/mcp_server/test_tool', request),

  /**
   * 测试MCP连接
   */
  testConnection: async (request: TestMCPRequest): Promise<MCPTool[]> =>
    apiClient.post('/v1/mcp_server/test_mcp', request),

  /**
   * 批量获取MCP服务器
   */
  getMultiple: async (request: GetMultipleMCPServerRequest): Promise<MCPServer[]> =>
    apiClient.post('/v1/mcp_server/get_multiple', request),

  /**
   * 批量导入MCP服务器
   */
  import: async (request: ImportMCPServerRequest): Promise<{ results: any[] }> =>
    apiClient.post('/v1/mcp_server/import', request),

  /**
   * 批量导出MCP服务器
   */
  export: async (request: ExportMCPServerRequest): Promise<{ mcpServers: Record<string, any> }> =>
    apiClient.post('/v1/mcp_server/export', request),

  /**
   * 缓存MCP工具配置
   */
  cacheTools: async (request: CacheToolsRequest): Promise<Record<string, MCPTool>> =>
    apiClient.post('/v1/mcp_server/cache_tools', request),
}










