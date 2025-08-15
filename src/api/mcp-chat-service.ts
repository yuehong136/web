/**
 * MCP聊天服务API接口
 * 对接后端 /v1/llm/chat_service_sse 接口
 */

import { apiClient } from './client'

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
  mcp_react?: boolean     // 是否启用 ReAct 闭环（多轮：计划→工具→反思→总结）
  mcp_max_rounds?: number  // 闭环最多轮数
  mcp_parallelism?: number // 单轮并发工具调用数
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
  name: string
  args: Record<string, any>
  result: string
  status?: 'pending' | 'running' | 'success' | 'error'
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
    const fullUrl = `${baseURL}/v1/llm/chat_service_sse`
    const token = localStorage.getItem('auth_token')
    
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
      mcp_react: request.mcp_react !== undefined ? request.mcp_react : false,
      mcp_max_rounds: request.mcp_max_rounds || 3,
      mcp_parallelism: request.mcp_parallelism || 3
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
      mcp_react: request.mcp_react !== undefined ? request.mcp_react : false,
      mcp_max_rounds: request.mcp_max_rounds || 3,
      mcp_parallelism: request.mcp_parallelism || 3
    }
    
    const response = await apiClient.post<any>('/llm/chat_service_sse', requestData)
    
    // 处理响应数据
    if (response.data) {
      return response.data
    }
    return response as string
  }
}

/**
 * 解析流式响应中的工具调用
 * @param content 响应内容
 * @returns 解析后的内容和工具调用
 */
export function parseToolCalls(content: string): {
  content: string
  toolCalls: ParsedToolCall[]
} {
  const toolCallsMap = new Map<string, ParsedToolCall>()
  let cleanContent = content
  
  // 匹配所有的 <tool_call> 标签
  const toolCallRegex = /<tool_call>(.*?)<\/tool_call>/gs
  let match
  
  while ((match = toolCallRegex.exec(content)) !== null) {
    try {
      const toolCallData = JSON.parse(match[1])
      // 使用工具名和参数的组合作为唯一标识
      const toolId = `${toolCallData.name}_${JSON.stringify(toolCallData.args || {})}`
      
      // 如果是同一个工具调用，更新状态（后面的覆盖前面的）
      // "Begin to call..." 表示运行中，其他表示完成
      const isRunning = toolCallData.result === 'Begin to call...'
      
      // 如果Map中已存在该工具，且新的是完成状态，则更新
      // 如果Map中不存在，或新的状态更"完整"，则添加/更新
      const existingCall = toolCallsMap.get(toolId)
      if (!existingCall || (!isRunning && existingCall.status === 'running')) {
        toolCallsMap.set(toolId, {
          name: toolCallData.name,
          args: toolCallData.args || {},
          result: toolCallData.result || '',
          status: isRunning ? 'running' : 'success'
        })
      }
      
      // 从内容中移除工具调用标记
      cleanContent = cleanContent.replace(match[0], '')
    } catch (e) {
      console.error('解析工具调用失败:', e)
    }
  }
  
  // 将Map转换为数组
  const toolCalls = Array.from(toolCallsMap.values())
  
  return {
    content: cleanContent.trim(),
    toolCalls
  }
}
