import { APIError, apiClient } from './client'
import { API_BASE_URL } from '@/constants'
import { uploadConversationAttachment } from './conversation-upload'
import type { MetadataCondition } from '../types/api'
import {
  chatConfig,
  type ChatServiceRequest,
  type UploadedFileInfo,
} from '@/config/chat'

type CompletionMessage = {
  role: string
  content: string
  id?: string
  files?: UploadedFileInfo[]
}

export interface DialogConversationSummary {
  readonly id: string
  readonly name?: string
  readonly title?: string
  readonly update_time: number
  readonly update_date?: string
  readonly message_count?: number
}

export const conversationAPI = {
  // 根据dialog_id获取对话列表
  getConversationsByDialog: (
    dialogId: string,
  ): Promise<DialogConversationSummary[]> => {
    if (!dialogId) {
      throw new Error('dialog_id is required')
    }
    return apiClient.get(`/conversation/list?dialog_id=${dialogId}`)
  },

  // 获取对话详情（用于话题页面）
  getConversationDetail: (conversationId: string): Promise<any> =>
    apiClient.get(`/v1/conversation/get?conversation_id=${conversationId}`),

  // Keep authenticated transport in the domain; callers own the SSE reader.
  chatServiceStream: (
    data: ChatServiceRequest,
    options: { signal: AbortSignal },
  ): Promise<Response> =>
    apiClient.post<Response>(`/v1${chatConfig.apiEndpoint}`, data, {
      signal: options.signal,
      headers: { Accept: 'text/event-stream' },
      readResponse: async (response) => response,
    }),

  // 对话完成接口（用于话题页面发送消息）
  completion: (
    data: {
      conversation_id: string
      messages: CompletionMessage[]
      quote?: boolean
      stream?: boolean
      filter_condition?: string
      doc_ids?: string // 文档 ID 列表，逗号分隔
      metadata_condition?: MetadataCondition // 元数据过滤条件
      reasoning?: boolean // 深度思考开关（参考 ragflow）
      internet?: boolean // 联网搜索开关（参考 ragflow）
      stream_output?: 'delta' | 'full' // 流式输出格式：delta 增量，full 累计全文
    },
    options?: { signal?: AbortSignal },
  ) => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    const fullUrl = `${baseURL}/v1/conversation/completion`
    const token = localStorage.getItem('auth_token')

    return fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        quote: false,
        stream: true,
        filter_condition: '',
        stream_output: 'delta',
        ...data,
      }),
      // 流式取消需贯穿 fetch 发起阶段（ARCH-1），调用方传入自管的 AbortController.signal
      signal: options?.signal,
    })
  },

  // 设置对话（创建或更新）
  setConversation: (data: {
    conversation_id?: string
    dialog_id?: string
    name?: string
    is_new?: boolean
  }): Promise<any> => apiClient.post('/v1/conversation/set', data),

  // 删除对话（批量，参考 RAGFlow /conversation/rm 接口）
  removeConversation: (conversationIds: string[]): Promise<any> =>
    apiClient.post('/v1/conversation/rm', {
      conversation_ids: conversationIds,
    }),

  // 文本转语音 - 流式版本（用于实时播放）
  // 返回原始 Response 对象，供 SpeechPlayer 流式处理
  textToSpeechStream: (text: string): Promise<Response> => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    const token = localStorage.getItem('auth_token')

    return fetch(`${baseURL}/v1/conversation/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ text }),
    })
  },

  // 生成相关问题
  generateRelatedQuestions: async (data: {
    question: string
    search_id?: string
  }): Promise<string[]> => {
    const questions = await apiClient.post<unknown>(
      '/chat/recommendation',
      data,
      {
        baseURL: `${API_BASE_URL}/api`,
        responseContract: 'rest200',
      },
    )
    if (
      !Array.isArray(questions) ||
      questions.some((item) => typeof item !== 'string')
    ) {
      throw new APIError(
        200,
        'INVALID_RECOMMENDATION_RESPONSE',
        'Unexpected recommendation response',
      )
    }
    return questions
  },

  // ============================================================================
  // 文件上传相关接口
  // ============================================================================

  /** 上传运行时附件元数据，不关联会话，也不执行聊天解析。 */
  uploadInfo: uploadConversationAttachment,
}
