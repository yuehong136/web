import { apiClient } from './client'
import type {
  Conversation,
  Message,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ASRRequest,
  ASRResponse,
  TTSRequest,
  TTSResponse,
  MindmapRequest,
  MindmapResponse,
  PaginationRequest,
  PaginatedData,
  MetadataCondition,
} from '../types/api'

export const conversationAPI = {
  // 获取对话列表
  getConversations: (params?: PaginationRequest & { 
    keywords?: string 
    status?: string 
  }): Promise<PaginatedData<Conversation>> =>
    apiClient.get('/v1/conversation/list', { params }),

  // 根据dialog_id获取对话列表
  getConversationsByDialog: (dialogId: string): Promise<any> => {
    if (!dialogId) {
      throw new Error('dialog_id is required')
    }
    console.log('API call with dialog_id:', dialogId)
    return apiClient.get(`/conversation/list?dialog_id=${dialogId}`)
  },

  // 获取对话详情
  getConversation: (conversationId: string): Promise<Conversation> =>
    apiClient.get(`/v1/conversation/${conversationId}`),

  // 获取对话详情（用于话题页面）
  getConversationDetail: (conversationId: string): Promise<any> =>
    apiClient.get(`/v1/conversation/get?conversation_id=${conversationId}`),

  // 对话完成接口（用于话题页面发送消息）
  completion: (data: {
    conversation_id: string
    messages: Array<{role: string, content: string, id?: string}>
    quote?: boolean
    stream?: boolean
    filter_condition?: string
    doc_ids?: string  // 文档 ID 列表，逗号分隔
    metadata_condition?: MetadataCondition  // 元数据过滤条件
  }) => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    const fullUrl = `${baseURL}/v1/conversation/completion`
    const token = localStorage.getItem('auth_token')
    
    return fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({
        quote: false,
        stream: true,
        filter_condition: "",
        ...data
      })
    })
  },

  // 设置对话（创建或更新）
  setConversation: (data: {
    conversation_id?: string
    dialog_id?: string
    name?: string
    is_new?: boolean
  }): Promise<any> =>
    apiClient.post('/v1/conversation/set', data),

  // 创建对话
  createConversation: (data: { title: string; system_prompt?: string }): Promise<Conversation> =>
    apiClient.post('/v1/conversation/create', data),

  // 更新对话
  updateConversation: (
    conversationId: string, 
    data: { title?: string; system_prompt?: string }
  ): Promise<Conversation> =>
    apiClient.post(`/v1/conversation/${conversationId}/update`, data),

  // 删除对话
  deleteConversation: (conversationId: string): Promise<void> =>
    apiClient.delete(`/v1/conversation/${conversationId}`),

  // 归档对话
  archiveConversation: (conversationId: string): Promise<void> =>
    apiClient.post(`/v1/conversation/${conversationId}/archive`),

  // 获取对话消息
  getMessages: (
    conversationId: string, 
    params?: PaginationRequest
  ): Promise<PaginatedData<Message>> =>
    apiClient.get(`/v1/conversation/${conversationId}/messages`, { params }),

  // 发送消息 (聊天完成)
  chatCompletion: (data: ChatCompletionRequest): Promise<ChatCompletionResponse> =>
    apiClient.post('/v1/conversation/completion', data),

  // 流式聊天完成
  streamChatCompletion: (
    data: ChatCompletionRequest,
    onMessage: (chunk: any) => void,
    onError?: (error: Event) => void,
    onComplete?: () => void
  ): EventSource => {
    const eventSource = apiClient.createEventSource('/v1/conversation/completion/stream', {
      onMessage: (chunk) => {
        if (chunk.type === 'done') {
          onComplete?.()
          eventSource.close()
        } else {
          onMessage(chunk)
        }
      },
      onError: (error) => {
        onError?.(error)
        eventSource.close()
      },
    })

    // 发送初始请求数据
    fetch('/v1/conversation/completion/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify({ ...data, stream: true }),
    })

    return eventSource
  },

  // 问答接口
  ask: (data: {
    question: string
    conversation_id?: string
    kb_ids?: string[]
    model?: string
    stream?: boolean
  }): Promise<{ answer: string; conversation_id: string; references?: any[] }> =>
    apiClient.post('/v1/conversation/ask', data),

  // 语音识别 (ASR)
  speechToText: (audioFile: File, language?: string): Promise<ASRResponse> =>
    apiClient.upload('/v1/conversation/asr', audioFile, { language }),

  // 文本转语音 (TTS)
  textToSpeech: (data: TTSRequest): Promise<TTSResponse> =>
    apiClient.post('/v1/conversation/tts', data),

  // 生成思维导图
  generateMindmap: (data: MindmapRequest): Promise<MindmapResponse> =>
    apiClient.post('/v1/conversation/mindmap', data),

  // 生成相关问题
  generateRelatedQuestions: (data: {
    message: string
    conversation_id?: string
    count?: number
  }): Promise<{ questions: string[] }> =>
    apiClient.post('/v1/conversation/related-questions', data),

  // 生成对话标题
  generateTitle: (conversationId: string): Promise<{ title: string }> =>
    apiClient.post(`/v1/conversation/${conversationId}/generate-title`),

  // 对话搜索
  searchConversations: (data: {
    query: string
    filters?: {
      date_range?: [string, string]
      status?: string
      tags?: string[]
    }
    pagination?: PaginationRequest
  }): Promise<PaginatedData<Conversation>> =>
    apiClient.post('/v1/conversation/search', data),

  // 导出对话
  exportConversation: (
    conversationId: string, 
    format: 'json' | 'txt' | 'pdf' | 'html'
  ): Promise<void> =>
    apiClient.download(
      `/v1/conversation/${conversationId}/export?format=${format}`,
      `conversation_${conversationId}.${format}`
    ),

  // 批量导出对话
  exportConversations: (
    conversationIds: string[], 
    format: 'json' | 'zip'
  ): Promise<void> =>
    apiClient.post(
      `/v1/conversation/export-batch`,
      { conversation_ids: conversationIds, format },
      { 
        headers: { 'Content-Type': 'application/json' }
      }
    ),

  // 对话统计
  getConversationStats: (timeRange?: string): Promise<{
    total_conversations: number
    total_messages: number
    avg_messages_per_conversation: number
    most_active_days: string[]
    popular_topics: Array<{ topic: string; count: number }>
  }> =>
    apiClient.get('/v1/conversation/stats', { 
      params: timeRange ? { time_range: timeRange } : undefined 
    }),
}