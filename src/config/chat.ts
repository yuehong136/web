// Chat service configuration
export const chatConfig = {
  // API endpoint for chat service - 使用相对路径，由apiClient处理baseURL
  apiEndpoint: '/llm/chat_service_sse',
  
  // Default model configuration
  defaultModel: 'gpt-3.5-turbo', // 替换为您实际使用的模型名称
  
  // Default generation configuration
  defaultGenConfig: {
    temperature: 0.7,
    max_tokens: 2000,
    top_p: 0.9,
    frequency_penalty: 0,
    presence_penalty: 0
  },
  
  // Request timeout in milliseconds
  requestTimeout: 30000,
  
  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000
}

// Message types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// Attachment/File interface - compatible with Ant Design Upload
export interface ChatAttachment {
  uid: string
  name: string
  status: 'uploading' | 'done' | 'error' | 'removed'
  url?: string
  thumbUrl?: string
  type?: string
  size?: number
  response?: any
  error?: any
  linkProps?: any
  originFileObj?: File
  lastModifiedDate?: Date
}

// Request body interface for SSE chat service
export interface ChatServiceRequest {
  prompt?: string
  messages: ChatMessage[]
  llm_name: string
  stream: boolean
  gen_conf?: Record<string, any>
  image?: string // Base64 encoded image for image2text models
  tavily_api_key?: string // Optional for search functionality
}

// SSE response data structure
export interface SSEAnswerData {
  answer?: string
  reference?: Record<string, any>
  audio_binary?: string | null
  final?: boolean
  start_to_think?: boolean
  end_to_think?: boolean
}

export interface SSEResponse {
  retcode: number
  retmsg: string
  data: string | boolean | SSEAnswerData
}

// ============================================================================
// 文件上传相关类型（参考 ragflow UploadResponseDataType）
// ============================================================================

/**
 * 上传文件响应类型
 * 后端 /v1/document/upload_info 接口返回的运行时附件元数据。
 * 该对象会在探索页发送消息时直接挂到 messages[].files。
 */
export interface UploadedFileInfo {
  /** 文件 ID */
  id: string
  /** 文件名 */
  name: string
  /** 文件扩展名 */
  extension: string
  /** MIME 类型 */
  mime_type: string
  /** 文件大小（字节） */
  size: number
  /** 预览 URL（可选） */
  preview_url?: string | null
  /** 创建时间戳 */
  created_at: number
  /** 创建者 ID */
  created_by?: string
}

/**
 * 上传文件项类型
 * 用于 Attachments 组件的文件状态管理
 */
export interface UploadFile {
  /** 唯一标识 */
  uid: string
  /** 文件名 */
  name: string
  /** 文件大小（字节） */
  size?: number
  /** 文件 MIME 类型 */
  type?: string
  /** 上传状态 */
  status: 'uploading' | 'done' | 'error'
  /** 上传进度（0-100） */
  percent?: number
  /** 上传成功后的响应数据 */
  response?: UploadedFileInfo
  /** 错误信息 */
  error?: Error | string
  /** 原始文件对象 */
  originFileObj?: File
  /** 缩略图 URL（图片文件） */
  thumbUrl?: string
}

/**
 * 文件上传配置
 */
export const uploadConfig = {
  /** 最大文件数量 */
  maxCount: 5,
  /** 单个文件最大大小（字节）：5MB */
  maxSize: 5 * 1024 * 1024,
  /** 支持的文件类型 */
  accept: 'image/*,.pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls,.ppt,.pptx',
}
