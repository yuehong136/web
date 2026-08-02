import { API_BASE_URL } from '@/constants'
import type {
  CacheToolsRequest,
  CreateMCPServerRequest,
  ExportMCPServerRequest,
  ExportMCPServersResponse,
  ImportMCPServerRequest,
  ListMCPServerRequest,
  ListToolsRequest,
  MCPServer,
  MCPTool,
  MCPToolCallResult,
  PaginatedResponse,
  TestMCPRequest,
  TestToolRequest,
  UpdateMCPServerRequest,
} from '@/types/mcp'
import { apiClient } from './client'

const restBase = { baseURL: `${API_BASE_URL}/api` }
const mcpServersPath = '/mcp/servers'

const mcpServerPath = (mcpId: string) =>
  `${mcpServersPath}/${encodeURIComponent(mcpId)}`

/** MCP 服务器 API。对外保持已有 web 调用形状，内部统一访问 RESTful 资源。 */
export const mcpAPI = {
  listServers: async (
    request: ListMCPServerRequest,
    params: {
      keywords?: string
      page?: number
      page_size?: number
      orderby?: string
      desc?: boolean
    } = {},
  ): Promise<PaginatedResponse<MCPServer>> =>
    apiClient.get<PaginatedResponse<MCPServer>>(mcpServersPath, {
      ...restBase,
      params: {
        ...params,
        mcp_ids: request.mcp_ids?.join(','),
      },
    }),

  getServerDetail: async (mcpId: string): Promise<MCPServer> =>
    apiClient.get<MCPServer>(mcpServerPath(mcpId), {
      ...restBase,
      params: { mode: 'preview' },
    }),

  createServer: async (request: CreateMCPServerRequest): Promise<MCPServer> =>
    apiClient.post<MCPServer>(mcpServersPath, request, restBase),

  updateServer: async (request: UpdateMCPServerRequest): Promise<MCPServer> => {
    const { mcp_id: mcpId, ...payload } = request
    return apiClient.put<MCPServer>(mcpServerPath(mcpId), payload, restBase)
  },

  deleteServers: async (mcpIds: string[]): Promise<boolean> => {
    await Promise.all(
      mcpIds.map((mcpId) =>
        apiClient.delete<boolean>(mcpServerPath(mcpId), restBase),
      ),
    )
    return true
  },

  import: async (
    request: ImportMCPServerRequest,
  ): Promise<{ results: unknown[] }> =>
    apiClient.post<{ results: unknown[] }>(
      `${mcpServersPath}/import`,
      request,
      restBase,
    ),

  export: async (
    request: ExportMCPServerRequest,
  ): Promise<ExportMCPServersResponse> => {
    const exports = await Promise.all(
      request.mcp_ids.map((mcpId) =>
        apiClient.get<ExportMCPServersResponse>(mcpServerPath(mcpId), {
          ...restBase,
          params: { mode: 'download' },
        }),
      ),
    )

    return {
      mcpServers: Object.assign(
        {},
        ...exports.map((result) => result.mcpServers),
      ),
    }
  },

  testConnection: async (request: TestMCPRequest): Promise<MCPTool[]> =>
    apiClient.post<MCPTool[]>(
      `${mcpServersPath}/preview/test`,
      request,
      restBase,
    ),

  listTools: async (
    request: ListToolsRequest,
  ): Promise<Record<string, MCPTool[]>> => {
    const entries = await Promise.all(
      request.mcp_ids.map(async (mcpId) => {
        const tools = await apiClient.get<MCPTool[]>(
          `${mcpServerPath(mcpId)}/tools`,
          {
            ...restBase,
            params: { timeout: request.timeout },
          },
        )
        return [mcpId, tools] as const
      }),
    )
    return Object.fromEntries(entries)
  },

  testTool: async (request: TestToolRequest): Promise<MCPToolCallResult> => {
    const {
      mcp_id: mcpId,
      tool_name: toolName,
      arguments: toolArguments,
      timeout,
    } = request
    return apiClient.post<MCPToolCallResult>(
      `${mcpServerPath(mcpId)}/tools/${encodeURIComponent(toolName)}/test`,
      { arguments: toolArguments, timeout },
      restBase,
    )
  },

  cacheTools: async (
    request: CacheToolsRequest,
  ): Promise<Record<string, MCPTool>> => {
    const { mcp_id: mcpId, tools } = request
    return apiClient.put<Record<string, MCPTool>>(
      `${mcpServerPath(mcpId)}/tools`,
      { tools },
      restBase,
    )
  },
}
