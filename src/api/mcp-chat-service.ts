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
  files?: string[]
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
    const fullUrl = `${baseURL}/v1/llm/enhanced_chat_sse`
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
      files: request.files || []
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
      files: request.files || []
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
} {
  const toolCallsMap = new Map<string, ParsedToolCall>()
  let processedContent = content
  
  // 处理新格式的工具调用 - 实时解析
  if (content.includes('🔧')) {
    // 1. 解析进行中的工具调用（只有工具调用，没有结果）
    const pendingCallRegex = /🔧 \*\*工具调用\*\*:\s*([^(]+)\(([^)]*)\)(?!\s*\n📋)/g
    let pendingMatch
    
    while ((pendingMatch = pendingCallRegex.exec(content)) !== null) {
      try {
        const toolName = pendingMatch[1].trim()
        const argsString = pendingMatch[2].trim()
        
        // 解析参数字符串
        const args: Record<string, any> = {}
        if (argsString) {
          const argPairs = argsString.split(/,\s*/)
          for (const pair of argPairs) {
            const [key, value] = pair.split('=', 2)
            if (key && value) {
              args[key.trim()] = value.trim()
            }
          }
        }
        
        const toolId = `${toolName}_${JSON.stringify(args)}`
        
        toolCallsMap.set(toolId, {
          name: toolName,
          args: args,
          result: '',
          status: 'running'
        })
        
      } catch (e) {
        console.error('解析进行中工具调用失败:', e)
      }
    }
    
    // 2. 解析完整的工具调用（有工具调用和结果）
    const completeCallRegex = /🔧 \*\*工具调用\*\*:\s*([^(]+)\(([^)]*)\)\s*\n📋 \*\*结果\*\*:\s*([\s\S]*?)(?=(?:\n\n🔧|\n\n📊|$))/g
    let completeMatch
    
    while ((completeMatch = completeCallRegex.exec(content)) !== null) {
      try {
        const toolName = completeMatch[1].trim()
        const argsString = completeMatch[2].trim()
        const resultContent = completeMatch[3].trim()
        
        // 解析参数字符串
        const args: Record<string, any> = {}
        if (argsString) {
          const argPairs = argsString.split(/,\s*/)
          for (const pair of argPairs) {
            const [key, value] = pair.split('=', 2)
            if (key && value) {
              args[key.trim()] = value.trim()
            }
          }
        }
        
        const toolId = `${toolName}_${JSON.stringify(args)}`
        
        toolCallsMap.set(toolId, {
          name: toolName,
          args: args,
          result: resultContent,
          status: 'success'
        })
        
      } catch (e) {
        console.error('解析完整工具调用失败:', e)
      }
    }
  }
  
  // 兼容旧格式：匹配所有的 <tool_call> 标签
  const oldToolCallRegex = /<tool_call>(.*?)<\/tool_call>/gs
  let match
  
  while ((match = oldToolCallRegex.exec(content)) !== null) {
    try {
      const toolCallData = JSON.parse(match[1])
      const toolId = `${toolCallData.name}_${JSON.stringify(toolCallData.args || {})}`
      
      const isRunning = toolCallData.result === 'Begin to call...'
      
      const existingCall = toolCallsMap.get(toolId)
      if (!existingCall || (!isRunning && existingCall.status === 'running')) {
        toolCallsMap.set(toolId, {
          name: toolCallData.name,
          args: toolCallData.args || {},
          result: toolCallData.result || '',
          status: isRunning ? 'running' : 'success'
        })
      }
    } catch (e) {
      console.error('解析旧格式工具调用失败:', e)
    }
  }
  
  // 将Map转换为数组
  const toolCalls = Array.from(toolCallsMap.values())
  
  return {
    content: processedContent.trim(),  // 保留完整内容用于正常流式展示
    toolCalls  // 提取的工具调用用于MCP组件展示
  }
}
