/**
 * MCP服务器相关类型定义
 * 基于MCP服务器管理系统的类型结构
 */

export interface MCPServer {
  id: string
  name: string
  server_type: string
  url: string
  description?: string
  variables?: Record<string, any>
  headers?: Record<string, string>
  tenant_id?: string
  create_time?: string
  update_time?: string
}

export interface MCPTool {
  name: string
  description: string
  inputSchema?: {
    type: string
    properties: Record<string, any>
    required?: string[]
  }
  enabled?: boolean
}

export interface CreateMCPServerRequest {
  name: string
  server_type: string
  url: string
  description?: string
  variables?: Record<string, any>
  headers?: Record<string, string>
}

export interface UpdateMCPServerRequest {
  mcp_id: string
  name?: string
  server_type?: string
  url?: string
  description?: string
  variables?: Record<string, any>
  headers?: Record<string, string>
}

export interface ListMCPServerRequest {
  mcp_ids?: string[]
}

export interface GetMultipleMCPServerRequest {
  id_list: string[]
}

export interface RemoveMCPServerRequest {
  mcp_ids: string[]
}

export interface ImportMCPServerRequest {
  mcpServers: Record<string, {
    type: string
    url: string
    authorization_token?: string
    tool_configuration?: Record<string, any>
  }>
}

export interface ExportMCPServerRequest {
  mcp_ids: string[]
}

export interface ListToolsRequest {
  mcp_ids: string[]
  timeout?: number
}

export interface TestToolRequest {
  mcp_id: string
  tool_name: string
  arguments: Record<string, any>
  timeout?: number
}

export interface CacheToolsRequest {
  mcp_id: string
  tools: MCPTool[]
}

export interface TestMCPRequest {
  url: string
  server_type: string
  timeout?: number
  headers?: Record<string, string>
  variables?: Record<string, any>
}

export interface APIResponse<T = any> {
  retcode: number
  retmsg: string
  data: T
}

export interface PaginatedResponse<T> {
  mcp_servers: T[]
  total: number
}

// MCP服务器类型常量 - 基于后端VALID_MCP_SERVER_TYPES
export const MCP_SERVER_TYPES = ['stdio', 'sse', 'streamable-http', 'http', 'websocket'] as const
export type MCPServerType = typeof MCP_SERVER_TYPES[number]

// MCP实验场聊天相关类型定义
export interface MCPChatConfig {
  mcp_ids: string[];
  mcp_timeout: number;
  verbose_tool_use: boolean;
}

export interface ChatToolCall {
  name: string;
  args: Record<string, any>;
  result?: string;
}

export interface ParsedChatToolCall {
  id?: string;
  name: string;
  args: Record<string, any>;
  arguments?: Record<string, any>;
  result: string;
  status?: 'pending' | 'running' | 'success' | 'error';
  timestamp?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolCalls?: ChatToolCall[];
  parsedToolCalls?: ParsedChatToolCall[];
}

export interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
  messages: ChatMessage[];
}

export interface SpeechConfig {
  enabled: boolean;
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
}

export type SubmitType = 'enter' | 'shiftEnter';

export interface PromptItem {
  id: string;
  title: string;
  description: string;
  content: string;
  icon: React.ReactNode;
  category?: string;
}

// 工具选择器相关类型
export interface MCPServerInfo {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category?: string;
}

// 模型选择器相关类型
export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description?: string;
  maxTokens?: number;
}