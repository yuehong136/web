// ============ 基础API类型 ============

// 标准API响应结构
export interface BaseResponse<T = any> {
  retcode: number
  retmsg: string
  data: T
}

// HTTP验证错误
export interface HTTPValidationError {
  detail: ValidationError[]
}

export interface ValidationError {
  loc: (string | number)[]
  msg: string
  type: string
}

// 分页参数
export interface PaginationParams {
  page?: number
  page_size?: number
  orderby?: string
  desc?: boolean
  keywords?: string
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page?: number
  page_size?: number
  has_next?: boolean
  has_prev?: boolean
}

// 列表响应（用于MCP服务器等）
export interface ListResponse<T> {
  items?: T[]
  total?: number
}

// API错误响应类型
export interface APIErrorResponse {
  retcode: number
  retmsg: string
  data: null
}

// 常用状态枚举
export enum StatusEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error',
  DELETED = 'deleted'
}

// 排序参数
export interface SortParams {
  orderby?: string
  desc?: boolean
}

// ============ 用户认证和授权相关类型 ============

// 用户实体
export interface User {
  id: string
  email: string
  username: string
  nickname?: string
  avatar?: string
  created_at: string
  updated_at: string
  is_active: boolean
  tenant_id?: string
  status?: StatusEnum
  last_login_at?: string
  roles?: string[]
  permissions?: string[]
}

// 登录请求
export interface LoginRequest {
  email: string
  password: string
  remember_me?: boolean
  captcha?: string
}

// 注册请求
export interface RegisterRequest {
  email: string
  password: string
  username: string
  nickname?: string
  confirm_password?: string
  invite_code?: string
}

// 认证响应
export interface AuthResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  user: User
}

// 刷新Token请求
export interface NewTokenRequest {
  refresh_token: string
}

// 删除Token请求
export interface RemoveTokenRequest {
  token: string
}

// 修改密码请求
export interface ChangeAuthRequest {
  old_password: string
  new_password: string
  confirm_password: string
}

// 用户更新请求
export interface UserUpdateRequest {
  nickname?: string
  avatar?: string
  email?: string
  username?: string
}

// 设置API密钥请求
export interface SetAPIKeyRequest {
  api_key: string
  provider: string
}

// 租户相关类型
export interface Tenant {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  is_active: boolean
  owner_id?: string
  settings?: Record<string, any>
  limits?: {
    max_users?: number
    max_storage?: number
    max_api_calls?: number
  }
}

// 设置租户信息请求
export interface SetTenantInfoRequest {
  name?: string
  description?: string
  settings?: Record<string, any>
  limits?: {
    max_users?: number
    max_storage?: number
    max_api_calls?: number
  }
}

// 权限和角色
export interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description?: string
}

export interface Role {
  id: string
  name: string
  description?: string
  permissions: Permission[]
  is_default?: boolean
}

// ============ 对话和聊天相关类型 ============

// 消息角色
export type MessageRole = 'user' | 'assistant' | 'system' | 'function' | 'tool'

// 消息实体
export interface Message {
  id: string
  conversation_id: string
  role: MessageRole
  content: string
  created_at: string
  updated_at?: string
  metadata?: Record<string, any>
  tokens?: number
  model?: string
  function_call?: {
    name: string
    arguments: string
  }
  tool_calls?: Array<{
    id: string
    type: string
    function: {
      name: string
      arguments: string
    }
  }>
}

// 对话状态
export type ConversationStatus = 'active' | 'archived' | 'deleted' | 'paused'

// 对话实体
export interface Conversation {
  id: string
  title: string
  user_id: string
  tenant_id?: string
  created_at: string
  updated_at: string
  status: ConversationStatus
  messages?: Message[]
  message_count?: number
  metadata?: Record<string, any>
  model?: string
  settings?: {
    temperature?: number
    max_tokens?: number
    top_p?: number
    frequency_penalty?: number
    presence_penalty?: number
  }
  tags?: string[]
}

// 新建对话请求
export interface NewConversationRequest {
  title?: string
  model?: string
  settings?: {
    temperature?: number
    max_tokens?: number
    top_p?: number
    frequency_penalty?: number
    presence_penalty?: number
  }
  metadata?: Record<string, any>
}

// 对话请求 (API 完成)
export interface api__apps__conversation__CompletionRequest {
  message: string
  conversation_id?: string
  stream?: boolean
  model?: string
  temperature?: number
  max_tokens?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
  functions?: Array<{
    name: string
    description: string
    parameters: Record<string, any>
  }>
  function_call?: 'auto' | 'none' | { name: string }
  tools?: Array<{
    type: string
    function: {
      name: string
      description: string
      parameters: Record<string, any>
    }
  }>
  tool_choice?: 'auto' | 'none' | 'required' | { type: string; function: { name: string } }
}

// 通用完成请求
export interface api__apps__api__CompletionRequest {
  prompt: string
  model?: string
  temperature?: number
  max_tokens?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
  stop?: string | string[]
  stream?: boolean
}

// 设置对话请求
export interface SetConversationRequest {
  conversation_id: string
  title?: string
  status?: ConversationStatus
  metadata?: Record<string, any>
  settings?: {
    temperature?: number
    max_tokens?: number
    top_p?: number
    frequency_penalty?: number
    presence_penalty?: number
  }
}

// 删除对话请求
export interface RemoveConversationRequest {
  conversation_id: string
}

// 删除消息请求
export interface DeleteMsgRequest {
  message_id: string
}

// 点赞请求
export interface ThumbupRequest {
  message_id: string
  thumbup: boolean
}

// 添加历史记录请求
export interface AddHistoryRequest {
  conversation_id: string
  messages: Array<{
    role: MessageRole
    content: string
    metadata?: Record<string, any>
  }>
}

// 搜索模式
export interface FusionSearchMode {
  similarity_threshold?: number
  keywords_similarity_weight?: number
  vector_similarity_weight?: number
}

export interface HybridSearchMode {
  similarity_threshold?: number
  keywords_similarity_weight?: number
  vector_similarity_weight?: number
}

// ============ 知识库和文档管理相关类型 ============

// 知识库状态
export type KnowledgeBaseStatus = 'ready' | 'processing' | 'error' | 'empty' | 'training'

// 知识库实体
export interface KnowledgeBase {
  id: string
  name: string
  description?: string
  user_id: string
  tenant_id: string
  created_at: string
  updated_at: string
  status: KnowledgeBaseStatus
  document_count: number
  chunk_count?: number
  embedding_model?: string
  parser_id?: string
  language?: string
  tags?: string[]
  metadata?: Record<string, any>
  settings?: {
    chunk_size?: number
    chunk_overlap?: number
    similarity_threshold?: number
    max_chunks?: number
  }
}

// 创建知识库请求
export interface CreateKnowledgebaseRequest {
  name: string
  description?: string
  language?: string
  embedding_model?: string
  parser_id?: string
  settings?: {
    chunk_size?: number
    chunk_overlap?: number
    similarity_threshold?: number
    max_chunks?: number
  }
  metadata?: Record<string, any>
}

// 更新知识库请求
export interface UpdateKnowledgebaseRequest {
  kb_id: string
  name?: string
  description?: string
  language?: string
  embedding_model?: string
  parser_id?: string
  settings?: {
    chunk_size?: number
    chunk_overlap?: number
    similarity_threshold?: number
    max_chunks?: number
  }
  metadata?: Record<string, any>
}

// 删除知识库请求
export interface RemoveKnowledgebaseRequest {
  kb_ids: string[]
}

// 列出知识库请求
export interface ListKbsRequest {
  keywords?: string
  page?: number
  page_size?: number
  orderby?: string
  desc?: boolean
}

// 知识图谱
export interface KnowledgeGraph {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
}

export interface KnowledgeNode {
  id: string
  label: string
  type: string
  properties?: Record<string, any>
  position?: { x: number; y: number }
}

export interface KnowledgeEdge {
  id: string
  source: string
  target: string
  label: string
  properties?: Record<string, any>
  weight?: number
}

// 文档状态
export type DocumentStatus = 'uploading' | 'processing' | 'ready' | 'error' | 'pending' | 'failed'

// 文档实体
export interface Document {
  id: string
  name: string
  type: string
  size: number
  kb_id: string
  user_id: string
  status: DocumentStatus
  created_at: string
  updated_at: string
  url?: string
  thumbnail?: string
  chunk_count?: number
  progress?: number
  error_message?: string
  metadata?: Record<string, any>
  parser_config?: Record<string, any>
}

// 创建文档请求
export interface CreateDocumentRequest {
  name: string
  type: string
  kb_id: string
  url?: string
  content?: string
  parser_config?: Record<string, any>
  metadata?: Record<string, any>
}

// 更新文档请求
export interface UpdateDocumentRequest {
  document_id: string
  name?: string
  parser_config?: Record<string, any>
  metadata?: Record<string, any>
}

// 文档上传请求
export interface DocumentUploadRequest {
  file: File
  kb_id: string
  chunk_size?: number
  chunk_overlap?: number
  parser_config?: Record<string, any>
}

// 文档删除请求
export interface DocumentRemoveRequest {
  doc_ids: string[]
}

// API特定的文档删除请求
export interface api__apps__document__RemoveRequest {
  doc_ids: string[]
}

// 文档重命名请求
export interface api__apps__document__RenameRequest {
  doc_id: string
  name: string
}

// 列出知识库文档请求
export interface ListKbDocsRequest {
  keywords?: string
  page?: number
  page_size?: number
  orderby?: string
  desc?: boolean
}

// 数据集相关类型
export interface Dataset {
  id: string
  name: string
  description?: string
  user_id: string
  tenant_id: string
  created_at: string
  updated_at: string
  status: StatusEnum
  document_count: number
  settings?: Record<string, any>
}

// 创建数据集请求
export interface CreateDatasetRequest {
  name: string
  description?: string
  settings?: Record<string, any>
}

// 更新数据集请求
export interface UpdateDatasetRequest {
  dataset_id: string
  name?: string
  description?: string
  settings?: Record<string, any>
}

// 文档解析器
export interface DocumentParser {
  id: string
  name: string
  type: string
  description?: string
  config?: Record<string, any>
  is_active: boolean
}

// 更改解析器请求
export interface ChangeParserRequest {
  doc_ids: string[]
  parser_id: string
  parser_config?: Record<string, any>
}

// ============ 文件上传和处理相关类型 ============

// 文件上传状态
export type FileUploadStatus = 'pending' | 'uploading' | 'processing' | 'completed' | 'failed'

// 文件实体
export interface FileEntity {
  id: string
  name: string
  type: string
  size: number
  url?: string
  path?: string
  user_id: string
  created_at: string
  updated_at: string
  status: FileUploadStatus
  progress?: number
  error_message?: string
  metadata?: Record<string, any>
}

// 文件上传请求
export interface FileUploadRequest {
  file: File
  type?: string
  metadata?: Record<string, any>
}

// 文件删除请求
export interface api__apps__file__RemoveRequest {
  file_ids: string[]
}

// 文件重命名请求
export interface api__apps__file__RenameRequest {
  file_id: string
  name: string
}

// 文档解析请求
export interface DocumentParseRequest {
  file: File
  parser_type?: string
  chunk_size?: number
  chunk_overlap?: number
  config?: Record<string, any>
}

// 文档转换请求（docx转form）
export interface DocxToFormConvertRequest {
  file: File
  template_id?: string
  options?: Record<string, any>
}

// 文档转换请求（文件转文档）
export interface FileToDocumentConvertRequest {
  file: File
  target_format: string
  options?: Record<string, any>
}

// 批处理请求
export interface BatchCreateItemsRequest {
  items: Array<Record<string, any>>
  batch_size?: number
}

export interface BatchDeleteRequest {
  ids: string[]
  confirm?: boolean
}

// 语音识别请求
export interface ASRRequest {
  audio_file: File
  language?: string
  model?: string
}

// 文本转语音请求
export interface TTSRequest {
  text: string
  voice?: string
  language?: string
  speed?: number
  pitch?: number
}

// ============ 块（Chunk）相关类型 ============

// 块状态
export type ChunkStatus = 'pending' | 'processing' | 'ready' | 'error'

// 块实体
export interface Chunk {
  id: string
  content: string
  content_with_weight?: string
  document_id: string
  kb_id: string
  seq_num: number
  position?: number
  char_count: number
  token_count?: number
  embedding?: number[]
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  status: ChunkStatus
}

// 创建块请求
export interface CreateChunkRequest {
  content: string
  document_id: string
  seq_num?: number
  metadata?: Record<string, any>
}

// 列出块请求
export interface ListChunkRequest {
  document_id?: string
  kb_id?: string
  keywords?: string
  page?: number
  page_size?: number
  orderby?: string
  desc?: boolean
}

// 设置块请求
export interface SetChunkRequest {
  chunk_id: string
  content?: string
  metadata?: Record<string, any>
}

// 删除块请求
export interface RmChunkRequest {
  chunk_ids: string[]
}

// 切换块请求
export interface SwitchChunkRequest {
  chunk_id: string
  available: boolean
}

// 搜索向量请求
export interface SearchVectorsRequest {
  query: string
  kb_id?: string
  similarity_threshold?: number
  limit?: number
}

// 密集搜索模式
export interface DenseSearchMode {
  similarity_threshold?: number
  vector_similarity_weight?: number
}

// 稀疏搜索模式
export interface SparseSearchMode {
  similarity_threshold?: number
  keywords_similarity_weight?: number
}

// 融合搜索模式（用于chunk）
export interface api__apps__chunk__FusionSearchMode {
  similarity_threshold?: number
  keywords_similarity_weight?: number
  vector_similarity_weight?: number
}

// 混合搜索模式（用于chunk）
export interface api__apps__chunk__HybridSearchMode {
  similarity_threshold?: number
  keywords_similarity_weight?: number
  vector_similarity_weight?: number
}

// ============ 工作流相关类型 ============

// 工作流节点类型
export type WorkflowNodeType = 'input' | 'output' | 'llm' | 'function' | 'condition' | 'loop' | 'script'

// 工作流节点
export interface WorkflowNode {
  id: string
  type: WorkflowNodeType
  position: { x: number; y: number }
  data: Record<string, any>
  label?: string
  config?: Record<string, any>
}

// 工作流边
export interface WorkflowEdge {
  id: string
  source: string
  target: string
  type?: string
  data?: Record<string, any>
  condition?: string
}

// 工作流实体
export interface Workflow {
  id: string
  name: string
  description?: string
  user_id: string
  tenant_id?: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  created_at: string
  updated_at: string
  is_active: boolean
  version: number
  status?: StatusEnum
  metadata?: Record<string, any>
  tags?: string[]
}

// 运行工作流请求
export interface RunRequest {
  workflow_id: string
  inputs?: Record<string, any>
  variables?: Record<string, any>
}

// 工作流V2运行请求
export interface RunWorkflowV2Request {
  workflow_id: string
  inputs?: Record<string, any>
  stream?: boolean
}

// 组件运行请求
export interface ComponentRunRequest {
  component_id: string
  inputs?: Record<string, any>
  config?: Record<string, any>
}

// ============ NL2SQL和数据分析相关类型 ============

// 表结构
export interface TableSchema {
  table_name: string
  columns: Array<{
    name: string
    type: string
    nullable?: boolean
    description?: string
  }>
  description?: string
}

// 字段元数据
export interface FieldMeta {
  name: string
  type: string
  description?: string
  nullable?: boolean
  primary_key?: boolean
  foreign_key?: {
    table: string
    column: string
  }
}

// NL2SQL请求
export interface NL2SQLRequest {
  question: string
  tables?: TableSchema[]
  database_schema?: string
  llm_model?: string
  max_tokens?: number
}

// NL2SQL请求体
export interface NL2SQLReqBody {
  question: string
  sql_context?: string
  tables?: string[]
  llm_model?: string
}

// 重新查询请求
export interface api__apps__nl2sql__ReQueryRequest {
  question: string
  sql: string
  error_message?: string
}

export interface api__apps__askdata__ReQueryRequest {
  question: string
  sql: string
  error_message?: string
  data_context?: string
}

// 数据库连接请求
export interface DBConnectionRequest {
  type: string
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl?: boolean
  options?: Record<string, any>
}

// SQL模板请求
export interface SQLTemplatingRequest {
  template: string
  parameters: Record<string, any>
}

// 填充SQL模板请求
export interface FillSQLTemplateRequest {
  template_id: string
  parameters: Record<string, any>
}

// 获取SQL和表配置请求
export interface GetSqlAndTableConfigReq {
  query: string
  table_names?: string[]
}

// 图表类型请求
export interface ChartTypeReqBody {
  data: any[]
  chart_config?: Record<string, any>
}

// 生成ECharts请求
export interface GenerateEChartsRequest {
  data: any[]
  chart_type: string
  title?: string
  config?: Record<string, any>
}

// 静态图表选项请求
export interface StaticChartOptionReqBody {
  data: any[]
  chart_type: string
  config?: Record<string, any>
}

// 动态图表选项函数请求
export interface DynamicChartOptionFunctionReqBody {
  data: any[]
  chart_config: Record<string, any>
  function_code: string
}

// ============ 大语言模型相关类型 ============

// 添加LLM请求
export interface AddLLMRequest {
  name: string
  provider: string
  model_type: string
  base_url?: string
  api_key?: string
  config?: Record<string, any>
}

// 删除LLM请求
export interface DeleteLLMRequest {
  llm_id: string
}

// LLM服务请求
export interface LLMServiceRequest {
  model: string
  messages: Array<{
    role: MessageRole
    content: string
  }>
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

export interface LLMModel {
  id: string
  name: string
  provider: string
  model_type: string
  max_tokens: number
  supports_functions: boolean
  supports_streaming: boolean
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
  api_key?: string
  is_active: boolean
  models: LLMModel[]
}

// ============ RAG和搜索相关类型 ============

// RAG回答请求
export interface RAGAnswerRequest {
  question: string
  kb_ids?: string[]
  model?: string
  temperature?: number
  max_tokens?: number
  similarity_threshold?: number
  max_chunks?: number
  stream?: boolean
}

// 检索测试请求
export interface RetrievalTestRequest {
  query: string
  kb_ids?: string[]
  similarity_threshold?: number
  limit?: number
}

// 创建搜索请求
export interface CreateSearchRequest {
  name: string
  description?: string
  kb_ids: string[]
  config?: Record<string, any>
}

// 列出搜索请求
export interface ListSearchRequest {
  keywords?: string
  page?: number
  page_size?: number
  orderby?: string
  desc?: boolean
}

// 更新搜索请求
export interface UpdateSearchRequest {
  search_id: string
  name?: string
  description?: string
  kb_ids?: string[]
  config?: Record<string, any>
}

// 删除搜索请求
export interface RemoveSearchRequest {
  search_ids: string[]
}

// 查询重写请求
export interface QueryRewriteRequest {
  query: string
  context?: string
  model?: string
}

// 相关问题请求
export interface RelatedQuestionsRequest {
  question: string
  context?: string
  count?: number
}

// ============ 内容处理和AI工具相关类型 ============

// AI翻译请求
export interface AITranslateRequest {
  zh_text: string
  llm_name: string
  target_language?: string
}

// AI批量翻译请求
export interface AIBatchTranslateReqBody {
  texts: string[]
  source_language?: string
  target_language: string
  llm_name: string
}

// AI翻译响应
export interface AITranslateResponse {
  status: 'success' | 'error'
  data: {
    original_text: string
    translated_text: string
  }
}

// 快速解释请求
export interface QuickInterpretRequest {
  text: string
  context?: string
  model?: string
}

// 无状态解释请求
export interface StatelessInterpretRequest {
  text: string
  context?: string
  model?: string
  temperature?: number
}

// 建议请求
export interface SuggestionRequest {
  input: string
  context?: string
  count?: number
}

// 意图识别请求
export interface RecognizeIntentRequest {
  text: string
  intents?: string[]
  confidence_threshold?: number
}

// 意图识别响应
export interface RecognizeIntentResponse {
  intent: string
  confidence: number
  entities?: Record<string, any>
}

// 分析用户查询请求
export interface AnalyzeUserQueryRequest {
  query: string
  context?: string
  analysis_types?: string[]
}

// 思维导图请求
export interface MindmapRequest {
  topic: string
  depth?: number
  style?: string
}

// 大纲请求
export interface OutlineRequest {
  topic: string
  depth?: number
  style?: string
}

// 大纲响应
export interface OutlineResponse {
  outline: Array<{
    level: number
    title: string
    content?: string
    children?: any[]
  }>
}

// 章节请求
export interface ChapterRequest {
  book_title: string
  chapter_count?: number
  style?: string
}

// ============ 对话和会话相关类型 ============

// 对话上下文
export interface DialogContext {
  conversation_id?: string
  history?: Message[]
  user_info?: Record<string, any>
  session_vars?: Record<string, any>
}

// 对话轮次
export interface DialogRound {
  user_message: string
  assistant_response?: string
  timestamp: string
  metadata?: Record<string, any>
}

// 对话请求
export interface DialogRequest {
  message: string
  conversation_id?: string
  context?: DialogContext
  model?: string
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

// 删除对话请求
export interface RemoveDialogRequest {
  dialog_id: string
}

// 融合搜索模式（用于dialog）
export interface api__apps__dialog__FusionSearchMode {
  similarity_threshold?: number
  keywords_similarity_weight?: number
  vector_similarity_weight?: number
}

// 混合搜索模式（用于dialog）
export interface api__apps__dialog__HybridSearchMode {
  similarity_threshold?: number
  keywords_similarity_weight?: number
  vector_similarity_weight?: number
}

// ============ 重构后的工作流类型 ============

// Canvas相关请求
export interface RunCanvasRequest {
  canvas_id: string
  inputs?: Record<string, any>
  variables?: Record<string, any>
}

export interface SaveCanvasRequest {
  canvas_id: string
  data: Record<string, any>
}

export interface RemoveCanvasRequest {
  canvas_id: string
}

export interface ResetCanvasRequest {
  canvas_id: string
}

// 插件脚本运行请求
export interface RunPluginScriptRequest {
  script_id: string
  inputs?: Record<string, any>
  variables?: Record<string, any>
}

// ============ 模板和内容管理相关类型 ============

// QA模板参数定义
export interface QAParamDefinition {
  name: string
  type: string
  description?: string
  required?: boolean
  default_value?: any
}

// QA模板
export interface QATemplate {
  id: string
  name: string
  description?: string
  template: string
  parameters: QAParamDefinition[]
  created_at: string
  updated_at: string
  is_active: boolean
}

// QA模板V2
export interface QATemplateV2 {
  id: string
  name: string
  description?: string
  system_prompt?: string
  user_prompt: string
  parameters: QAParamDefinition[]
  model?: string
  temperature?: number
  max_tokens?: number
  created_at: string
  updated_at: string
  is_active: boolean
}

// 存储模板请求
export interface StoreTemplatesRequest {
  templates: QATemplate[]
}

// 存储模板V2请求
export interface StoreTemplatesV2Request {
  templates: QATemplateV2[]
}

// 删除模板请求
export interface DeleteTemplateRequest {
  template_id: string
}

// 完成FAQ请求
export interface CompletionFAQRequest {
  question: string
  template_id?: string
  parameters?: Record<string, any>
}

// ============ 内容过滤和安全相关类型 ============

// 内容过滤请求
export interface ContentFilterRequest {
  content: string
  filter_types?: string[]
  strictness?: 'low' | 'medium' | 'high'
}

// 敏感词检测请求
export interface DetectionRequest {
  content: string
  categories?: string[]
}

// 批量检测请求
export interface BatchDetectionRequest {
  contents: string[]
  categories?: string[]
}

// 创建敏感词请求
export interface CreateSensitiveWordRequest {
  word: string
  category?: string
  level?: number
  description?: string
}

// 批量创建敏感词请求
export interface BatchCreateSensitiveWordRequest {
  words: Array<{
    word: string
    category?: string
    level?: number
    description?: string
  }>
}

// 更新敏感词请求
export interface UpdateSensitiveWordRequest {
  word_id: string
  word?: string
  category?: string
  level?: number
  description?: string
}

// 创建白名单请求
export interface CreateWhitelistRequest {
  word: string
  category?: string
  description?: string
}

// ============ 标签和分类管理类型 ============

// 标签实体
export interface Tag {
  id: string
  name: string
  color?: string
  description?: string
  count?: number
  created_at: string
}

// 创建标签请求
export interface CreateRequest {
  name: string
  color?: string
  description?: string
}

// 重命名标签请求
export interface RenameTagRequest {
  tag_id: string
  new_name: string
}

// 删除标签请求
export interface RemoveTagsRequest {
  tag_ids: string[]
}

// 分类相关类型
export interface Category {
  id: string
  name: string
  description?: string
  parent_id?: string
  level: number
  order_index?: number
  created_at: string
  updated_at: string
}

// 创建分类请求
export interface CreateCategoryRequest {
  name: string
  description?: string
  parent_id?: string
}

// 更新分类请求
export interface UpdateCategoryRequest {
  category_id: string
  name?: string
  description?: string
  parent_id?: string
}

// ============ 库和项目管理类型 ============

// 库实体
export interface Library {
  id: string
  name: string
  description?: string
  type: string
  created_at: string
  updated_at: string
  is_active: boolean
  item_count?: number
}

// 创建库请求
export interface CreateLibraryRequest {
  name: string
  description?: string
  type: string
}

// 更新库请求
export interface UpdateLibraryRequest {
  library_id: string
  name?: string
  description?: string
}

// 库项目
export interface LibraryItem {
  id: string
  library_id: string
  name: string
  content: string
  type?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

// 创建库项目请求
export interface CreateLibraryItemRequest {
  library_id: string
  name: string
  content: string
  type?: string
  metadata?: Record<string, any>
}

// 绑定标签库请求
export interface BindLabelLibraryRequest {
  entity_id: string
  library_ids: string[]
}

// 绑定服务库请求
export interface BindServiceLibraryRequest {
  service_id: string
  library_ids: string[]
}

// ============ 工具和插件相关类型 ============

// 工具测试请求
export interface TestToolRequest {
  tool_name: string
  parameters: Record<string, any>
  mcp_server_id?: string
}

// 缓存工具请求
export interface CacheToolsRequest {
  mcp_server_id: string
  tools: string[]
}

// 安装依赖请求
export interface InstallDepRequest {
  package_name: string
  version?: string
}

// 卸载依赖请求
export interface UninstallDepRequest {
  package_name: string
}

// ============ 评分和质量相关类型 ============

// 计算分数请求
export interface CalcScoreRequest {
  content: string
  criteria?: string[]
  model?: string
}

// 计算分数V2请求
export interface CalcScoreV2Request {
  content: string
  reference?: string
  criteria?: string[]
  model?: string
  weights?: Record<string, number>
}

// ============ 语言服务相关类型 ============

// Langfuse密钥请求
export interface LangfuseKeysRequest {
  public_key: string
  secret_key: string
  host?: string
}

// 状态变更请求
export interface ChangeStatusRequest {
  entity_id: string
  status: StatusEnum
}

// 移动请求
export interface MoveRequest {
  source_id: string
  target_id: string
  position?: number
}

// 批量绑定请求
export interface BatchBindRequest {
  source_ids: string[]
  target_id: string
  bind_type: string
}

// 更新绑定请求
export interface UpdateBindingRequest {
  binding_id: string
  config?: Record<string, any>
  is_active?: boolean
}

// ============ 特殊业务类型 ============

// 语义元素类型
export enum SemanticElementType {
  TITLE = 'title',
  PARAGRAPH = 'paragraph',
  LIST = 'list',
  TABLE = 'table',
  CODE = 'code',
  FORMULA = 'formula',
  IMAGE = 'image'
}

// 语义层请求
export interface SemanticLayerRequest {
  content: string
  element_types?: SemanticElementType[]
  options?: Record<string, any>
}

// 所有者类型
export enum OwnerType {
  USER = 'user',
  TENANT = 'tenant',
  SYSTEM = 'system'
}

// 按元素类型删除请求
export interface DeleteByElementTypeRequest {
  element_type: SemanticElementType
  target_id?: string
}

// 按所有者类型删除请求
export interface DeleteByOwnerTypeRequest {
  owner_type: OwnerType
  owner_id?: string
}

// 文本项目基础
export interface TextItemBase {
  id: string
  content: string
  type?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

// Web爬虫请求
export interface WebCrawlRequest {
  url: string
  depth?: number
  max_pages?: number
  include_patterns?: string[]
  exclude_patterns?: string[]
}

// 整体处理请求
export interface WholeProcessRequest {
  input: string
  process_type: string
  options?: Record<string, any>
}

// 填充字段请求
export interface FillFieldsRequest {
  template: string
  data: Record<string, any>
  options?: Record<string, any>
}

// 填充字段响应
export interface FillFieldsResponse {
  filled_content: string
  used_fields: string[]
  missing_fields: string[]
}

// ============ 层级和维度管理类型 ============

// 层级
export interface Level {
  id: string
  name: string
  description?: string
  order_index: number
  created_at: string
  updated_at: string
}

// 创建层级请求
export interface CreateLevelRequest {
  name: string
  description?: string
  order_index?: number
}

// 更新层级请求
export interface UpdateLevelRequest {
  level_id: string
  name?: string
  description?: string
  order_index?: number
}

// 维度
export interface Dimension {
  id: string
  name: string
  description?: string
  type: string
  config?: Record<string, any>
  created_at: string
  updated_at: string
}

// 创建维度请求
export interface CreateDimensionRequest {
  name: string
  description?: string
  type: string
  config?: Record<string, any>
}

// 更新维度请求
export interface UpdateDimensionRequest {
  dimension_id: string
  name?: string
  description?: string
  type?: string
  config?: Record<string, any>
}

// 标签
export interface Label {
  id: string
  name: string
  color?: string
  description?: string
  category?: string
  created_at: string
  updated_at: string
}

// 创建标签请求
export interface CreateLabelRequest {
  name: string
  color?: string
  description?: string
  category?: string
}

// 更新标签请求
export interface UpdateLabelRequest {
  label_id: string
  name?: string
  color?: string
  description?: string
  category?: string
}

// ============ 候选人和表单类型 ============

// 候选人表单
export interface CandidateForm {
  id: string
  name: string
  fields: Array<{
    name: string
    type: string
    label: string
    required?: boolean
    options?: string[]
    validation?: Record<string, any>
  }>
  created_at: string
  updated_at: string
}

// 过滤请求
export interface FilterRequest {
  filters: FilterConfig[]
  logic?: 'and' | 'or'
}

// 设置元数据请求
export interface SetMetaRequest {
  entity_id: string
  entity_type: string
  metadata: Record<string, any>
}

// ============ 响应模式定义 ============

// 响应模式
export interface ResponseSchema {
  type: string
  properties?: Record<string, any>
  required?: string[]
  description?: string
}

// ============ 删除工厂和通用删除 ============

// 删除工厂请求
export interface DeleteFactoryRequest {
  factory_type: string
  entity_id: string
  options?: Record<string, any>
}

// ============ 高级处理类型 ============

// 精准提示请求
export interface FinePromptRequest {
  prompt: string
  context?: string
  model?: string
  parameters?: Record<string, any>
}

// 询问关于请求
export interface AskAboutRequest {
  topic: string
  context?: string
  question_type?: string
  depth?: number
}

// ============ 系统监控和统计类型 ============
export interface SystemStats {
  total_users: number
  total_conversations: number
  total_knowledge_bases: number
  total_documents: number
  api_calls_today: number
  storage_used: number
  active_connections: number
}

export interface APIUsageStats {
  total_calls: number
  total_tokens: number
  calls_by_endpoint: Record<string, number>
  calls_by_date: Record<string, number>
  avg_response_time: number
}

// 错误类型
export interface APIError {
  code: string
  message: string
  details?: Record<string, any>
}

// 表单类型
export interface FormState<T = any> {
  data: T
  errors: Record<string, string>
  isSubmitting: boolean
  isValid: boolean
}

// 主题类型
export type Theme = 'light' | 'dark' | 'system'

// 语言类型
export type Language = 'zh-CN' | 'en-US'

// 状态类型
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

// 排序类型
export interface SortConfig {
  field: string
  direction: 'asc' | 'desc'
}

// 筛选类型
export interface FilterConfig {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'like'
  value: any
}

// 搜索类型
export interface SearchConfig {
  query: string
  fields?: string[]
  exact?: boolean
}

// ============ 常用工具类型和导出 ============

// 通用ID类型
export type ID = string
export type Timestamp = string

// JSON类型定义
export type JSONValue = string | number | boolean | null | JSONObject | JSONArray
export type JSONObject = { [key: string]: JSONValue }
export type JSONArray = JSONValue[]

// 泛型API响应类型辅助
export type ApiResponse<T> = BaseResponse<T>
export type ApiListResponse<T> = BaseResponse<ListResponse<T>>
export type ApiPaginatedResponse<T> = BaseResponse<PaginatedResponse<T>>

// 实体操作类型
export type EntityOperation = 'create' | 'read' | 'update' | 'delete' | 'list'

// 通用查询参数
export interface QueryParams extends PaginationParams {
  filters?: FilterConfig[]
  search?: SearchConfig
  sort?: SortConfig
}

// 通用实体基类
export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

// 可软删除实体
export interface SoftDeletableEntity extends BaseEntity {
  deleted_at?: string
  is_deleted?: boolean
}

// 租户实体
export interface TenantEntity extends BaseEntity {
  tenant_id: string
}

// 用户实体
export interface UserEntity extends TenantEntity {
  user_id: string
}

// 状态实体
export interface StatusEntity extends BaseEntity {
  status: StatusEnum
}

// 可标记实体
export interface TaggableEntity {
  tags?: string[]
}

// 可分类实体
export interface CategorizableEntity {
  category_id?: string
  categories?: Category[]
}

// 元数据实体
export interface MetadataEntity {
  metadata?: Record<string, any>
}

// 完整实体类型（包含所有常用字段）
export interface FullEntity extends UserEntity, StatusEntity, TaggableEntity, CategorizableEntity, MetadataEntity {
  name: string
  description?: string
}

// HTTP状态码
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500
}

// WebSocket消息类型
export interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
  id?: string
}

// 事件类型
export interface EventData {
  type: string
  payload: any
  source?: string
  timestamp: string
}

// 通知类型
export interface Notification extends BaseEntity {
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  user_id: string
  action_url?: string
}

// 配置类型
export interface SystemConfig {
  key: string
  value: any
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description?: string
  is_public?: boolean
}

// ============ 类型别名以便向后兼容 ============

// 聊天相关别名
export type ChatRequest = api__apps__conversation__CompletionRequest
export type CompletionRequest = api__apps__api__CompletionRequest

// 搜索相关别名  
export type ChunkFusionSearchMode = api__apps__chunk__FusionSearchMode
export type ChunkHybridSearchMode = api__apps__chunk__HybridSearchMode
export type ConversationFusionSearchMode = FusionSearchMode
export type ConversationHybridSearchMode = HybridSearchMode
export type DialogFusionSearchMode = api__apps__dialog__FusionSearchMode
export type DialogHybridSearchMode = api__apps__dialog__HybridSearchMode

// 文件操作别名
export type FileRemoveRequest = api__apps__file__RemoveRequest
export type FileRenameRequest = api__apps__file__RenameRequest
export type DocumentRemoveAPIRequest = api__apps__document__RemoveRequest  
export type DocumentRenameAPIRequest = api__apps__document__RenameRequest

// NL2SQL别名
export type NL2SQLReQueryRequest = api__apps__nl2sql__ReQueryRequest
export type AskDataReQueryRequest = api__apps__askdata__ReQueryRequest

// ============ 导出说明 ============
// 
// 此文件包含了Multi-RAG系统的完整API类型定义，涵盖：
// 
// 1. 基础API类型 - 通用响应、分页、错误处理
// 2. 用户认证和授权 - 登录、注册、权限管理
// 3. MCP服务器管理 - 创建、更新、导入导出MCP服务器
// 4. 对话和聊天 - 消息、对话、AI完成请求
// 5. 知识库和文档 - 知识库管理、文档上传、块处理
// 6. 文件上传和处理 - 文件管理、格式转换、语音处理
// 7. 工作流和组件 - 工作流节点、执行、Canvas操作
// 8. NL2SQL和数据分析 - 自然语言转SQL、图表生成
// 9. AI工具和服务 - 翻译、解释、分析、模板处理
// 10. 内容管理 - 标签、分类、库管理、模板系统
// 11. 搜索和检索 - RAG搜索、向量检索、语义搜索
// 12. 安全和过滤 - 内容过滤、敏感词检测
// 13. 系统监控 - 统计信息、API使用情况
// 14. 通用工具类型 - 实体基类、查询参数、事件系统
//
// 所有类型都基于OpenAPI 3.1规范从实际API文档中提取
// 支持前端TypeScript应用的完整类型安全