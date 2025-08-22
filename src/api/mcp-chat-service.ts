/**
 * MCP聊天服务API接口
 * 对接后端 /v1/llm/chat_service_sse 接口
 */

import { apiClient } from './client'
import { parseStreamResponse } from '@/components/chat/StreamResponseParser'

/**
 * MCP聊天服务请求参数
 */
export interface MCPChatServiceRequest {
  // 基础聊天参数
  prompt: string
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  llm_name: string
  stream: boolean
  gen_conf: Record<string, any>
  image?: string
  tavily_api_key?: string
  
  // MCP 集成相关（可选）
  mcp_ids?: string[]
  mcp_timeout?: number
  verbose_tool_use?: boolean
  files?: string[]
  // 结构化输出控制
  structured_output?: boolean
}

/**
 * MCP服务器列表请求参数
 */
export interface ListMCPServerRequest {
  mcp_ids?: string[]
}

/**
 * MCP服务器列表查询参数
 */
export interface ListMCPServerParams {
  keywords?: string
  page?: number
  page_size?: number
  orderby?: string
  desc?: boolean
}

/**
 * MCP服务器信息
 */
export interface MCPServerInfo {
  id: string
  name: string
  server_type: string
  url: string
  description: string
  variables?: Record<string, any>
  update_date: string
}

/**
 * MCP服务器列表响应
 */
export interface MCPServerListResponse {
  mcp_servers: MCPServerInfo[]
  total: number
}

/**
 * SSE响应数据格式
 */
export interface SSEResponse {
  retcode: number
  retmsg: string
  data: string | boolean
}

/**
 * 解析后的工具调用信息
 */
export interface ParsedToolCall {
  id?: string
  name: string
  args: Record<string, any>
  arguments?: Record<string, any>
  result: string
  status?: 'pending' | 'running' | 'success' | 'error'
  timestamp?: string
}

/**
 * MCP聊天服务API
 */
export const mcpChatAPI = {
  /**
   * 获取MCP服务器列表
   */
  listMCPServers: async (
    request: ListMCPServerRequest = {},
    params: ListMCPServerParams = {}
  ): Promise<MCPServerListResponse> => {
    const searchParams = new URLSearchParams()
    if (params.keywords) searchParams.append('keywords', params.keywords)
    if (params.page !== undefined) searchParams.append('page', params.page.toString())
    if (params.page_size !== undefined) searchParams.append('page_size', params.page_size.toString())
    if (params.orderby) searchParams.append('orderby', params.orderby)
    if (params.desc !== undefined) searchParams.append('desc', params.desc.toString())

    const queryString = searchParams.toString()
    const endpoint = `/mcp/list${queryString ? '?' + queryString : ''}`
    
    const response = await apiClient.post<any>(endpoint, request)
    
    // 确保返回正确的数据格式
    if (response.data) {
      return response.data
    }
    // 如果直接返回的就是数据，不包含额外的包装
    return response as MCPServerListResponse
  },

  /**
   * 发送聊天消息（流式响应）
   */
  sendMessage: (request: MCPChatServiceRequest) => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    const fullUrl = `${baseURL}/v1/llm/enhanced_chat_sse`
    const token = localStorage.getItem('auth_token')
    
    // 自动根据mcp_ids设置structured_output
    const hasToolCalls = request.mcp_ids && request.mcp_ids.length > 0;
    const useStructuredOutput = request.structured_output !== undefined 
      ? request.structured_output 
      : hasToolCalls;

    // 构建请求数据
    const requestData = {
      prompt: request.prompt || '',
      messages: request.messages,
      llm_name: request.llm_name,
      stream: true, // 强制使用流式响应
      gen_conf: request.gen_conf || {},
      image: request.image || '',
      tavily_api_key: request.tavily_api_key || '',
      // MCP相关参数
      mcp_ids: request.mcp_ids || [],
      mcp_timeout: request.mcp_timeout || 10.0,
      verbose_tool_use: request.verbose_tool_use !== undefined ? request.verbose_tool_use : false,
      files: request.files || [],
      // 结构化输出控制
      structured_output: useStructuredOutput
    }
    
    return fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(requestData)
    })
  },

  /**
   * 发送聊天消息（非流式响应）
   */
  sendMessageSync: async (request: MCPChatServiceRequest): Promise<string> => {
    // 自动根据mcp_ids设置structured_output  
    const hasToolCalls = request.mcp_ids && request.mcp_ids.length > 0;
    const useStructuredOutput = request.structured_output !== undefined 
      ? request.structured_output 
      : hasToolCalls;
      
    const requestData = {
      prompt: request.prompt || '',
      messages: request.messages,
      llm_name: request.llm_name,
      stream: false, // 非流式响应
      gen_conf: request.gen_conf || {},
      image: request.image || '',
      tavily_api_key: request.tavily_api_key || '',
      // MCP相关参数
      mcp_ids: request.mcp_ids || [],
      mcp_timeout: request.mcp_timeout || 10.0,
      verbose_tool_use: request.verbose_tool_use !== undefined ? request.verbose_tool_use : false,
      files: request.files || [],
      // 结构化输出控制
      structured_output: useStructuredOutput
    }
    
    const response = await apiClient.post<any>('/llm/enhanced_chat_sse', requestData)
    
    // 处理响应数据
    if (response.data) {
      return response.data
    }
    return response as string
  }
}

/**
 * 解析流式响应中的工具调用 - 实时解析版本
 * @param content 响应内容
 * @returns 解析后的内容和工具调用
 */
export function parseToolCalls(content: string): {
  content: string
  toolCalls: ParsedToolCall[]
  isToolAnalyzing?: boolean
  toolCallCount?: number
} {
  // 使用新的统一解析器
  const parsedResponse = parseStreamResponse(content)
  
  // 为了兼容性，添加时间戳和ID（如果没有的话）
  const enhancedToolCalls = parsedResponse.toolCalls.map(call => ({
    ...call,
    id: call.id || `${Date.now()}_${Math.random()}`,
    timestamp: call.timestamp || new Date().toLocaleTimeString()
  }))
  
  return {
    content: parsedResponse.content,
    toolCalls: enhancedToolCalls,
    isToolAnalyzing: false, // 暂时设为false，如需要可后续扩展
    toolCallCount: enhancedToolCalls.length
  }
}
