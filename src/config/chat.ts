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
export interface SSEResponse {
  retcode: number
  retmsg: string
  data: string | boolean | { answer: string }
}