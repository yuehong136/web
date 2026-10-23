/**
 * MCP 聊天请求体（/v1/llm/enhanced_chat_sse）。
 * 结构化消费者的传输在本领域，事件读取与状态归共享 streaming runtime。
 */

export const openMCPChatStream = (
  requestBody: unknown,
  { url, signal }: { url: string; signal?: AbortSignal },
): Promise<Response> => {
  const token =
    typeof localStorage === 'undefined'
      ? null
      : localStorage.getItem('auth_token')
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(requestBody),
    signal,
  })
}

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
  // 增量流式输出（后端默认已改为false，前端需要显式传true）
  delta_stream?: boolean
}
