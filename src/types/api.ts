// ============================================================================
// Multi-RAG API TypeScript 类型定义
// 基于 OpenAPI 3.1 规范自动生成
// ============================================================================

// 基础API响应类型
export interface APIResponse<T = any> {
  retcode: number
  retmsg: string
  data: T | null
}

export interface PaginationRequest {
  page?: number
  page_size?: number
  orderby?: string
  desc?: boolean
}

export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  has_next: boolean
  has_prev: boolean
}

// ============================================================================
// 用户认证和授权模块
// ============================================================================

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  username: string
  nickname?: string
}

export interface OAuthLoginRequest {
  code: string
  state?: string
  redirect_uri?: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  user: UserInfo
}

export interface UserInfo {
  id: string
  email: string
  username: string
  nickname?: string
  avatar?: string
  tenant_id: string
  is_active: boolean
  created_at: string
  updated_at: string
  roles?: string[]
  permissions?: string[]
}

export interface TenantInfo {
  id: string
  name: string
  description?: string
  logo?: string
  domain?: string
  settings: Record<string, any>
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface LoginChannel {
  name: string
  type: 'oauth' | 'email' | 'phone'
  enabled: boolean
  config: Record<string, any>
}

// ============================================================================
// MCP服务器管理模块
// ============================================================================

export interface MCPServer {
  id: string
  name: string
  server_type: 'http' | 'websocket' | 'sse'
  url: string
  description?: string
  variables?: Record<string, any>
  headers?: Record<string, string>
  tenant_id: string
  create_time: string
  update_time: string
  is_active: boolean
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

export interface ExportMCPServerRequest {
  mcp_ids: string[]
}

export interface ImportMCPServerRequest {
  mcpServers: Record<string, MCPServerConfig>
}

export interface MCPServerConfig {
  type: string
  url: string
  name?: string
  authorization_token?: string
  tool_configuration?: Record<string, any>
}

export interface ImportResult {
  server: string
  success: boolean
  action: 'created' | 'updated' | 'skipped'
  id?: string
  new_name?: string
  message?: string
}

export interface ListToolsRequest {
  mcp_ids: string[]
  timeout?: number
}

export interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: string
    properties: Record<string, any>
    required?: string[]
  }
}

export interface TestToolRequest {
  mcp_id: string
  tool_name: string
  arguments: Record<string, any>
  timeout?: number
}

export interface TestConnectionRequest {
  mcp_id: string
  timeout?: number
}

// ============================================================================
// 对话和聊天模块
// ============================================================================

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata?: Record<string, any>
  created_at: string
}

export interface Conversation {
  id: string
  title: string
  user_id: string
  tenant_id: string
  status: 'active' | 'archived' | 'deleted'
  created_at: string
  updated_at: string
  messages?: Message[]
  metadata?: Record<string, any>
}

export interface ChatCompletionRequest {
  message: string
  conversation_id?: string
  model?: string
  temperature?: number
  max_tokens?: number
  stream?: boolean
  kb_ids?: string[]
  system_prompt?: string
  tools?: string[]
}

export interface ChatCompletionResponse {
  message: string
  conversation_id: string
  message_id: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  metadata?: Record<string, any>
}

export interface ASRRequest {
  audio_file: File
  language?: string
  model?: string
}

export interface ASRResponse {
  text: string
  language: string
  confidence: number
  segments?: Array<{
    start: number
    end: number
    text: string
  }>
}

export interface TTSRequest {
  text: string
  voice?: string
  language?: string
  speed?: number
  pitch?: number
}

export interface TTSResponse {
  audio_url: string
  duration: number
  format: string
}

export interface MindmapRequest {
  content: string
  style?: 'tree' | 'radial' | 'flowchart'
  max_nodes?: number
}

export interface MindmapNode {
  id: string
  label: string
  level: number
  parent_id?: string
  position?: { x: number; y: number }
  style?: Record<string, any>
}

export interface MindmapResponse {
  nodes: MindmapNode[]
  edges: Array<{
    source: string
    target: string
    label?: string
  }>
}

// ============================================================================
// 知识库和文档模块
// ============================================================================

export interface KnowledgeBase {
  id: string
  name: string
  description?: string
  user_id: string
  tenant_id: string
  avatar?: string
  tags: string[]
  chunk_num: number
  document_num: number
  parser_id?: string
  parser_config?: Record<string, any>
  created_at: string
  updated_at: string
  permission: 'private' | 'public' | 'shared'
  embedding_model?: string
  language?: string
}

export interface CreateKBRequest {
  name: string
  description?: string
  avatar?: string
  tags?: string[]
  permission?: 'private' | 'public' | 'shared'
  embedding_model?: string
  language?: string
}

export interface UpdateKBRequest {
  kb_id: string
  name?: string
  description?: string
  avatar?: string
  tags?: string[]
  permission?: 'private' | 'public' | 'shared'
}

export interface Document {
  id: string
  name: string
  type: string
  size: number
  kb_id: string
  location: string
  status: 'green' | 'red' | 'yellow'
  chunk_num: number
  token_num: number
  created_at: string
  updated_at: string
  thumbnail?: string
  parser_config?: Record<string, any>
  run_id?: string
}

export interface UploadDocumentRequest {
  kb_id: string
  files: File[]
  parser_id?: string
  chunk_size?: number
  chunk_overlap?: number
  parser_config?: Record<string, any>
}

export interface ParseWebRequest {
  url: string
  kb_id?: string
  parser_id?: string
  max_depth?: number
  include_patterns?: string[]
  exclude_patterns?: string[]
}

export interface DocumentChunk {
  id: string
  document_id: string
  content: string
  metadata: Record<string, any>
  vector?: number[]
  created_at: string
}

export interface KnowledgeGraph {
  nodes: Array<{
    id: string
    label: string
    type: string
    properties: Record<string, any>
  }>
  edges: Array<{
    id: string
    source: string
    target: string
    label: string
    properties: Record<string, any>
  }>
}

// ============================================================================
// 文件管理模块
// ============================================================================

export interface FileUploadRequest {
  file: File
  category?: string
  description?: string
  tags?: string[]
}

export interface FileInfo {
  id: string
  name: string
  type: string
  size: number
  url: string
  thumbnail?: string
  category: string
  description?: string
  tags: string[]
  user_id: string
  tenant_id: string
  created_at: string
  updated_at: string
}

export interface ImageProcessRequest {
  image_url?: string
  image_file?: File
  operations: Array<{
    type: 'resize' | 'crop' | 'rotate' | 'filter'
    params: Record<string, any>
  }>
}

export interface AudioTranscriptionRequest {
  audio_file: File
  language?: string
  format?: 'text' | 'srt' | 'vtt'
}

export interface VideoProcessRequest {
  video_file: File
  operations: Array<{
    type: 'extract_audio' | 'generate_thumbnail' | 'compress'
    params: Record<string, any>
  }>
}

// ============================================================================
// 工作流模块
// ============================================================================

export interface Workflow {
  id: string
  name: string
  description?: string
  user_id: string
  tenant_id: string
  version: number
  status: 'draft' | 'published' | 'archived'
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  variables?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface WorkflowNode {
  id: string
  type: string
  label: string
  position: { x: number; y: number }
  data: Record<string, any>
  config?: Record<string, any>
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  source_handle?: string
  target_handle?: string
  label?: string
  data?: Record<string, any>
}

export interface CreateWorkflowRequest {
  name: string
  description?: string
  nodes?: WorkflowNode[]
  edges?: WorkflowEdge[]
  variables?: Record<string, any>
}

export interface UpdateWorkflowRequest {
  workflow_id: string
  name?: string
  description?: string
  nodes?: WorkflowNode[]
  edges?: WorkflowEdge[]
  variables?: Record<string, any>
}

export interface ExecuteWorkflowRequest {
  workflow_id: string
  inputs?: Record<string, any>
  context?: Record<string, any>
}

export interface WorkflowExecution {
  id: string
  workflow_id: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  inputs: Record<string, any>
  outputs?: Record<string, any>
  error?: string
  started_at: string
  completed_at?: string
  execution_time?: number
  node_executions: Array<{
    node_id: string
    status: 'pending' | 'running' | 'completed' | 'failed'
    inputs?: Record<string, any>
    outputs?: Record<string, any>
    error?: string
    started_at?: string
    completed_at?: string
  }>
}

// ============================================================================
// AI工具模块
// ============================================================================

export interface AITranslateRequest {
  zh_text: string
  llm_name: string
  target_language?: string
  context?: string
}

export interface AITranslateResponse {
  status: 'success' | 'error'
  data: {
    original_text: string
    translated_text: string
    source_language?: string
    target_language?: string
    confidence?: number
  }
}

export interface AIWriteRequest {
  prompt: string
  type: 'article' | 'summary' | 'email' | 'story' | 'code'
  length?: 'short' | 'medium' | 'long'
  style?: string
  audience?: string
  llm_name?: string
}

export interface AIWriteResponse {
  content: string
  word_count: number
  reading_time: number
  suggestions?: string[]
}

export interface NL2SQLRequest {
  question: string
  database_schema?: string
  table_names?: string[]
  llm_name?: string
}

export interface NL2SQLResponse {
  sql: string
  explanation: string
  confidence: number
  tables_used: string[]
  potential_issues?: string[]
}

export interface AIAnalysisRequest {
  data: any[]
  analysis_type: 'statistical' | 'trend' | 'correlation' | 'anomaly'
  chart_type?: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap'
  llm_name?: string
}

export interface AIAnalysisResponse {
  insights: string[]
  chart_config?: Record<string, any>
  data_summary: {
    total_records: number
    columns: string[]
    data_types: Record<string, string>
  }
  recommendations?: string[]
}

// ============================================================================
// 大语言模型管理模块
// ============================================================================

export interface LLMModel {
  id: string
  name: string
  display_name: string
  provider: string
  model_type: 'chat' | 'completion' | 'embedding'
  max_tokens: number
  supports_functions: boolean
  supports_streaming: boolean
  supports_vision: boolean
  cost_per_1k_tokens: {
    input: number
    output: number
  }
  is_active: boolean
  created_at: string
  updated_at: string
  config?: Record<string, any>
}

export interface LLMProvider {
  id: string
  name: string
  provider_type: string
  base_url?: string
  api_version?: string
  is_active: boolean
  supported_models: string[]
  auth_config?: Record<string, any>
}

export interface AddLLMRequest {
  name: string
  provider: string
  model_type: string
  config: Record<string, any>
  is_active?: boolean
}

export interface LLMChatRequest {
  model: string
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  temperature?: number
  max_tokens?: number
  stream?: boolean
  functions?: Array<{
    name: string
    description: string
    parameters: Record<string, any>
  }>
}

// ============================================================================
// 内容安全和审核模块
// ============================================================================

export interface ContentDetectionRequest {
  content: string
  detection_types?: string[]
  threshold?: number
}

export interface ContentDetectionResponse {
  is_safe: boolean
  risk_level: 'low' | 'medium' | 'high'
  detected_issues: Array<{
    type: string
    confidence: number
    description: string
    suggestion?: string
  }>
  filtered_content?: string
}

export interface SensitiveWordRequest {
  content: string
  action: 'detect' | 'filter' | 'replace'
  replacement?: string
}

export interface SensitiveWordResponse {
  has_sensitive_words: boolean
  detected_words: string[]
  filtered_content?: string
  positions?: Array<{
    word: string
    start: number
    end: number
  }>
}

// ============================================================================
// 系统统计和监控模块
// ============================================================================

export interface SystemStats {
  users: {
    total: number
    active_today: number
    new_today: number
  }
  conversations: {
    total: number
    today: number
    avg_length: number
  }
  knowledge_bases: {
    total: number
    total_documents: number
    total_chunks: number
    storage_used: number
  }
  api_usage: {
    total_calls: number
    calls_today: number
    avg_response_time: number
    error_rate: number
  }
  system: {
    cpu_usage: number
    memory_usage: number
    disk_usage: number
    uptime: number
  }
}

export interface APIStats {
  total_calls: number
  total_tokens: number
  calls_by_endpoint: Record<string, number>
  calls_by_model: Record<string, number>
  avg_response_time: number
  error_rate: number
  cost_summary: {
    total_cost: number
    cost_by_model: Record<string, number>
  }
}

export interface UsageStatsRequest {
  time_range: 'day' | 'week' | 'month' | 'year'
  start_date?: string
  end_date?: string
  granularity?: 'hour' | 'day' | 'week' | 'month'
}

// ============================================================================
// API访问令牌管理
// ============================================================================

export interface APIToken {
  id: string
  name: string
  token: string
  scopes: string[]
  expires_at?: string
  is_active: boolean
  created_at: string
  last_used_at?: string
  usage_count: number
}

export interface CreateTokenRequest {
  name: string
  scopes: string[]
  expires_in_days?: number
}

export interface UpdateTokenRequest {
  token_id: string
  name?: string
  scopes?: string[]
  is_active?: boolean
}

// ============================================================================
// 错误和验证类型
// ============================================================================

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface HTTPValidationError {
  detail: Array<{
    loc: (string | number)[]
    msg: string
    type: string
  }>
}

export interface APIError {
  retcode: number
  retmsg: string
  detail?: any
  timestamp?: string
  request_id?: string
}

// ============================================================================
// 实用工具类型
// ============================================================================

export type SortDirection = 'asc' | 'desc'
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'like' | 'between'
export type FileType = 'document' | 'image' | 'audio' | 'video' | 'archive' | 'other'
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type Permission = 'read' | 'write' | 'delete' | 'admin'

export interface SortConfig {
  field: string
  direction: SortDirection
}

export interface FilterConfig {
  field: string
  operator: FilterOperator
  value: any
}

export interface SearchParams {
  query?: string
  filters?: FilterConfig[]
  sort?: SortConfig
  pagination?: PaginationRequest
}

// ============================================================================
// 导出所有类型
// ============================================================================

export type {
  // 重新导出基础类型
  APIResponse as BaseAPIResponse,
  PaginationRequest as BasePaginationRequest,
  PaginatedData as BasePaginatedData,
}