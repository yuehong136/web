// ============================================================================
// Multi-RAG API TypeScript 类型定义
// 基于 OpenAPI 3.1 规范自动生成
// ============================================================================

// ============================================================================
// 环境管理模块
// ============================================================================

// 变量类型枚举
export type VariableType = 'string' | 'number' | 'boolean'

export interface EnvironmentVariable {
  id: string
  environment_id: string
  key_name: string
  key_value: string
  description?: string
  is_secret: boolean
  variable_type: VariableType
  status: string
  create_time: number
  update_time: number
  create_date: string
  update_date: string
  // 为了兼容性，保留原有字段作为计算属性
  key: string
  value: string
}

export interface EnvironmentVariableCreate {
  key_name: string
  key_value: string
  description?: string
  is_secret: boolean
  variable_type: VariableType
}

export interface EnvironmentVariableUpdate {
  key_name?: string
  key_value?: string
  description?: string
  is_secret?: boolean
  variable_type?: VariableType
}

export interface Environment {
  id: string
  tenant_id: string
  name: string
  description?: string
  base_url?: string
  is_default: boolean
  is_global: boolean
  status: string
  variables: EnvironmentVariable[]
  create_time: number
  update_time: number
  create_date: string
  update_date: string
}

export interface EnvironmentCreate {
  name: string
  description?: string
  base_url?: string
  is_default: boolean
  is_global: boolean
  variables: EnvironmentVariableCreate[]
}

export interface EnvironmentUpdate {
  name?: string
  description?: string
  base_url?: string
  is_default?: boolean
}

export interface EnvironmentSummary {
  id: string
  tenant_id: string
  name: string
  description?: string
  base_url?: string
  is_default: boolean
  is_global: boolean
  status: string
  variables_count: number
  create_time: number
  update_time: number
  create_date: string
  update_date: string
}

export interface GlobalEnvironment {
  id: string
  name: string
  description?: string
  server_url?: string
  variables: Record<string, any>
  is_active: boolean
  status: string
  create_time: number
  update_time: number
  create_date: string
  update_date: string
}

// 环境查询参数
export interface EnvironmentQueryParams {
  page?: number
  page_size?: number
  search?: string
  is_default?: boolean
}

// 分页响应
export interface PaginatedEnvironmentResponse {
  items: EnvironmentSummary[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// 复制环境请求
export interface EnvironmentDuplicateRequest {
  new_name: string
}

// 变量解析请求
export interface VariableResolveRequest {
  text: string
}

// 变量解析响应
export interface VariableResolveResponse {
  resolved_text: string
  variables_used: string[]
  missing_variables: string[]
}

// 批量变量更新请求
export interface BatchVariablesRequest {
  variables: EnvironmentVariableCreate[]
}

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
  nickname: string
  password: string
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

// 用户档案信息 - 匹配后端 /v1/user/info 接口响应
export interface UserProfile {
  id: string
  access_token: string
  avatar?: string | null
  email: string
  is_active: boolean
  is_anonymous: boolean
  language: string
  nickname: string
  password: string
  status: string
  timezone: string
  last_login_time?: string | null
  is_superuser: boolean
}

// 用户档案更新请求
export interface UpdateUserProfileRequest {
  nickname?: string
  avatar?: string | null
  language?: string
  timezone?: string
}

// ============================================================================
// OpenAPI 文档过滤模块
// ============================================================================

// OpenAPI 过滤规则
export interface FilterRule {
  paths: string[]
  match: 'exact' | 'prefix' | 'glob' | 'regex'
  include_tags?: string[]
  exclude_paths?: string[]
  exclude_tags?: string[]
  strict?: boolean
  prune_examples?: boolean
  oas_version_target?: 'keep' | '3.0' | '3.1'
  source?: string
  max_depth?: number
}

// OpenAPI 过滤响应元信息
export interface FilterMeta {
  rules: {
    paths: string[]
    match: string
    include_tags: string[]
    exclude_paths: string[]
    exclude_tags: string[]
    strict: boolean
    prune_examples: boolean
    oas_version_target: string
  }
  sourceETag?: string
  generated_at: string
  processing_time_ms: number
  paths_before: number
  paths_after: number
  components_before: number
  components_after: number
}

// OpenAPI 规范基础结构
export interface OpenAPISpec {
  openapi: string
  info: {
    title: string
    version: string
    description?: string
    contact?: {
      name?: string
      email?: string
    }
    license?: {
      name?: string
      url?: string
    }
  }
  servers?: Array<{
    url: string
    description?: string
  }>
  tags?: Array<{
    name: string
    description?: string
    externalDocs?: {
      description?: string
      url?: string
    }
  }>
  paths: Record<string, any>
  components?: {
    schemas?: Record<string, any>
    securitySchemes?: Record<string, any>
    [key: string]: any
  }
  security?: Array<Record<string, string[]>>
  'x-filter-warnings'?: string[]
  'x-filter-meta'?: FilterMeta
}

// OpenAPI 过滤响应
export interface FilterResponse extends OpenAPISpec {
  'x-filter-warnings': string[]
  'x-filter-meta': FilterMeta
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
// 对话应用管理模块
// ============================================================================

export interface DialogApp {
  id: string
  tenant_id: string
  name: string
  description: string
  icon: string
  language: string
  llm_id: string
  llm_setting: Record<string, any> | null
  prompt_type: string
  prompt_config: {
    system: string
    prologue: string
    parameters: Array<{
      key: string
      optional: boolean
    }>
    empty_response: string
    reasoning?: boolean
    tavily_api_key?: string
  }
  similarity_threshold: number
  vector_similarity_weight: number
  top_n: number
  top_k: number
  do_refer: string
  rerank_id: string | null
  kb_ids: string[]
  search_mode: {
    dense?: Record<string, any>
    hybrid?: {
      weight_dense: number
      weight_sparse: number
    }
  } | null
  status: string
  create_date: string
  update_date: string
  create_time: number
  update_time: number
  kb_names: string[]
}

export interface RemoveDialogRequest {
  dialog_ids: string[]
}

export interface SetDialogRequest {
  dialog_id: string
  name: string
  description: string
  icon: string
  prompt_config: {
    system: string
    prologue: string
    parameters: any[]
    empty_response: string
  }
}

export interface DialogTemplateFile {
  format: 'multirag_dialog_template'
  version: string
  export_time: string
  app: Record<string, unknown>
}

export interface DialogImportResultItem {
  id: string
  name: string
  warnings: string[]
}

export interface DialogImportResult {
  imported: DialogImportResultItem[]
  failed: Array<{ name: string; error: string }>
  total: number
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

// ============================================================================
// 元数据过滤条件 (Metadata Filtering)
// ============================================================================

// 元数据过滤条件中的单个条件
export interface MetadataFilterCondition {
  name: string // 元数据字段名
  comparison_operator: string // 比较操作符: is, not is, contains, not contains, start with, end with, empty, not empty, >, <, ≥, ≤
  value?: string | number | boolean // 值 (对于 empty/not empty 可选)
}

// 元数据过滤条件对象
export interface MetadataCondition {
  logic?: 'and' | 'or' // 逻辑运算符，默认 and
  conditions?: MetadataFilterCondition[] // 条件列表
}

// ============================================================================
// Metadata 管理模块 (知识库元数据字段定义和管理)
// ============================================================================

// Metadata 字段定义 (知识库模板)
export interface MetadataFieldDefinition {
  key: string // 字段名 (仅允许英文字母和下划线)
  description?: string // 字段描述
  enum?: string[] // 允许的值列表 (可选)
  restrictDefinedValues?: boolean // 是否限制为预定义值
}

// Metadata 汇总项 (聚合统计)
export interface MetadataSummaryItem {
  field: string // 字段名
  type?: string
  values: Array<[string | number, number]>
}

// Metadata 汇总响应
export interface MetadataSummaryResponse {
  summary: Record<
    string,
    MetadataSummaryItem | Array<[string | number, number]>
  >
  total_docs?: number
}

// Metadata 更新操作
export interface MetadataUpdateOperation {
  key: string // 字段名
  match: string // 原始值 (用于匹配)
  value: string // 新值
}

// Metadata 删除操作
export interface MetadataDeleteOperation {
  key: string // 字段名
  value?: string // 具体值 (不提供则删除整个字段)
}

// Metadata 批量操作请求
export interface MetadataBatchRequest {
  kb_id: string
  doc_ids?: string[]
  updates?: MetadataUpdateOperation[]
  deletes?: MetadataDeleteOperation[]
}

// 知识库 Metadata 设置更新请求
export interface KBMetadataSettingsRequest {
  kb_id: string
  metadata: MetadataFieldDefinition[]
  enable_metadata?: boolean
}

// 文档 Metadata 设置更新请求
export interface DocumentMetadataSettingsRequest {
  doc_id: string
  metadata: MetadataFieldDefinition[]
}

// 文档 Metadata 更新请求 (更新 meta_fields)
export interface DocumentMetadataUpdateRequest {
  doc_id: string
  meta: string // JSON 字符串格式的 Record<string, any>
}

// Metadata 表格数据 (UI 展示用)
export interface MetadataTableData {
  field: string
  description: string
  restrictDefinedValues?: boolean
  values: string[]
}

// Metadata 管理操作类型
export const MetadataManageType = {
  MANAGE: 1, // 管理知识库级别 metadata 汇总
  UPDATE_SINGLE: 2, // 编辑单个文档 metadata
  SETTING: 3, // 知识库 metadata 模板设置
  SINGLE_FILE_SETTING: 4, // 单文件 metadata 设置
} as const

export type MetadataManageType =
  (typeof MetadataManageType)[keyof typeof MetadataManageType]

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
  metadata_condition?: MetadataCondition // 元数据过滤条件
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
  avatar?: string | null
  name: string
  language?: string
  description?: string | null
  tenant_id: string
  permission: string
  doc_num: number
  token_num: number
  chunk_num: number
  parser_id: string
  embd_id: string
  nickname?: string
  tenant_avatar?: string | null
  update_time: number // 时间戳格式

  // 可选字段（用于兼容不同版本的API）
  created_by?: string
  similarity_threshold?: number
  vector_similarity_weight?: number
  parser_config?: Record<string, any>
  pagerank?: number
  status?: string
  create_time?: string
  size?: number

  // Metadata 模板设置
  metadata_settings?: MetadataFieldDefinition[]
  enable_metadata?: boolean
}

export interface CreateKBRequest {
  name: string
  description?: string
  avatar?: string
  language?: string
  embd_id?: string
  permission?: string
  similarity_threshold?: number
  vector_similarity_weight?: number
  parser_id?: string
  parser_config?: Record<string, any>
  pagerank?: number
}

export interface UpdateKBRequest {
  kb_id: string
  name: string
  description?: string | null
  permission?: string | null
  avatar?: string | null
  parser_id?: string | null
  parser_config?: Record<string, any> | null
  embd_id?: string | null
  pagerank?: number | null
}

// 后端知识库列表请求
export interface ListKbsRequest {
  owner_ids?: string[]
}

// 后端知识库删除请求
export interface RemoveKnowledgebaseRequest {
  kb_id: string
}

export interface Document {
  id: string
  name: string
  type: string
  size: number
  kb_id: string
  location: string
  status: string // '0' = 禁用, '1' = 启用
  run: string // '0' = 未解析, '1' = 解析中, '2' = 取消, '3' = 成功, '4' = 失败
  chunk_num: number
  token_num: number
  created_by: string
  nickname?: string // 创建者昵称（用于显示）
  create_date: string
  update_date: string
  create_time: number
  update_time: number
  thumbnail?: string
  parser_id: string
  parser_config?: Record<string, any>
  source_type: string
  progress: number // 解析进度 0-1
  progress_msg: string // 解析日志信息
  process_begin_at: string
  process_duration: number // 后端返回的处理耗时（秒数），直接使用不涉及时区
  meta_fields: Record<string, any>
  suffix: string
  auth?: any
}

export interface UploadDocumentRequest {
  kb_id: string
  files: File[]
  parser_id?: string
  chunk_size?: number
  chunk_overlap?: number
  parser_config?: Record<string, any>
}

// 文档过滤器参数
export interface DocumentFilter {
  run_status?: string[] // 运行状态过滤
  types?: string[] // 文件类型过滤
  suffix?: string[] // 文件后缀过滤
  metadata?: Record<string, string[]> // metadata 嵌套筛选
  return_empty_metadata?: boolean // 是否只返回无元数据的文档
}

// 文档筛选信息（从后端获取可用的筛选选项）
export interface IDocumentInfoFilter {
  run_status: Record<string, number> // 状态 -> 数量
  suffix: Record<string, number> // 后缀 -> 数量
  metadata: Record<string, Record<string, number>> // metadata 字段 -> 值 -> 数量
}

// 文档列表请求参数
export interface DocumentListRequest {
  kb_id: string
  keywords?: string
  page?: number
  page_size?: number
  orderby?: string
  desc?: boolean
  filter_params: DocumentFilter
}

// 文档列表响应
export interface DocumentListResponse {
  total: number
  docs: Document[]
}

// 文档运行控制请求
export interface DocumentRunRequest {
  doc_ids: string[]
  action: 'run' | 'cancel' // run = 开始解析, cancel = 取消解析
}

// 文档状态更新请求
export interface DocumentStatusRequest {
  doc_ids: string[]
  status: '0' | '1' // 0 = 禁用, 1 = 启用
}

// 文档重命名请求
export interface DocumentRenameRequest {
  doc_id: string
  name: string
}

// 文档下载请求参数
export interface DocumentDownloadRequest {
  doc_id: string
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

// 模型类型枚举，对应后端的 LLMType
export type LLMType =
  | 'chat'
  | 'embedding'
  | 'speech2text'
  | 'image2text'
  | 'rerank'
  | 'tts'

export interface LLMModel {
  id: string
  llm_name: string // 实际的模型名称
  name?: string
  display_name?: string
  provider?: string
  fid: string // 厂商ID
  mdl_type: LLMType
  model_type?: LLMType
  max_tokens?: number
  tags?: string
  is_tools?: boolean
  status?: string
  available: boolean
  supports_functions?: boolean
  supports_streaming?: boolean
  supports_vision?: boolean
  cost_per_1k_tokens?: {
    input: number
    output: number
  }
  is_active?: boolean
  create_date?: string
  update_date?: string
  create_time?: number
  update_time?: number
  created_at?: string
  updated_at?: string
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
  model_type: LLMType
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
// 系统API Token管理 - 匹配后端 /v1/system/new_token 和 token_list 接口
// ============================================================================

export interface APITokenCreateRequest {
  name: string
  description?: string | null
}

export interface SystemAPIToken {
  tenant_id: string
  token: string
  beta: string
  name: string
  description?: string
  create_time: number
  create_date: string
  update_time: number | null
  update_date: string | null
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
// 知识库日志模块
// ============================================================================

// 日志运行状态
export const RunningStatus = {
  UNSTART: '0', // 待处理
  RUNNING: '1', // 运行中
  CANCEL: '2', // 已取消
  DONE: '3', // 成功
  FAIL: '4', // 失败
  SCHEDULE: '5', // 已调度
} as const

export type RunningStatus = (typeof RunningStatus)[keyof typeof RunningStatus]

// 日志运行状态显示名称映射
export const RunningStatusMap: Record<RunningStatus, string> = {
  [RunningStatus.UNSTART]: '待处理',
  [RunningStatus.RUNNING]: '运行中',
  [RunningStatus.CANCEL]: '已取消',
  [RunningStatus.DONE]: '成功',
  [RunningStatus.FAIL]: '失败',
  [RunningStatus.SCHEDULE]: '已调度',
}

// 日志Tab类型
export const LogTabType = {
  FILE_LOGS: 'fileLogs',
  DATASET_LOGS: 'datasetLogs',
} as const

export type LogTabType = (typeof LogTabType)[keyof typeof LogTabType]

// 处理类型
export const ProcessingType = {
  KNOWLEDGE_GRAPH: 'GraphRAG',
  RAPTOR: 'RAPTOR',
} as const

export type ProcessingType =
  (typeof ProcessingType)[keyof typeof ProcessingType]

// 处理类型显示名称映射
export const ProcessingTypeMap: Record<ProcessingType, string> = {
  [ProcessingType.KNOWLEDGE_GRAPH]: '知识图谱',
  [ProcessingType.RAPTOR]: 'RAPTOR',
}

// 文件日志条目接口
export interface IFileLogItem {
  id: string
  create_date: string
  create_time: number
  document_id: string
  document_name: string
  document_suffix: string
  document_type: string
  dsl: any
  path: string[]
  task_id: string
  name: string
  kb_id: string
  operation_status: string
  parser_id: string
  pipeline_id: string
  pipeline_title: string
  avatar: string
  process_begin_at: string | null
  process_duration: number
  progress: number
  progress_msg: string
  source_type?: string
  source_from?: string
  status: string
  task_type: string
  tenant_id: string
  update_date: string
  update_time: number
}

// 日志统计数据接口
export interface ILogStats {
  cancelled: number
  failed: number
  finished: number
  processing: number
  downloaded: number
}

// 日志列表响应接口
export interface ILogListResponse {
  logs: IFileLogItem[]
  total: number
}

// 日志列表请求参数
export interface ILogListRequest {
  kb_id: string
  page?: number
  page_size?: number
  keywords?: string
  order_by?: string
  operation_status?: string[]
}

// 日志详情接口（用于模态框展示）
export interface ILogDetailInfo {
  taskId?: string
  fileName: string
  fileType?: string
  uploadedBy?: string
  uploadDate?: string
  processBeginAt?: string
  chunkNumber?: number
  fileSize?: string
  source?: string
  task?: string
  status?: RunningStatus
  startTime?: string
  endTime?: string
  duration?: string
  details: string
}

// ============================================================================
// 实用工具类型
// ============================================================================

export type SortDirection = 'asc' | 'desc'
export type FilterOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'in'
  | 'like'
  | 'between'
export type FileType =
  | 'document'
  | 'image'
  | 'audio'
  | 'video'
  | 'archive'
  | 'other'
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type Permission = 'read' | 'write' | 'delete' | 'admin'

// 文档运行状态类型
export type DocumentRunStatus = '0' | '1' | '2' | '3' | '4' // 0=未解析, 1=解析中, 2=取消, 3=成功, 4=失败
export type DocumentStatus = '0' | '1' // 0=禁用, 1=启用

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
