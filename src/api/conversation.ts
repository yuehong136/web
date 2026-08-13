import { apiClient } from './client'
import type {
  Conversation,
  Message,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ASRResponse,
  TTSRequest,
  TTSResponse,
  MindmapRequest,
  MindmapResponse,
  PaginationRequest,
  PaginatedData,
  MetadataCondition,
} from '../types/api'
import type { UploadedFileInfo } from '../config/chat'

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
  // 获取对话列表
  getConversations: (
    params?: PaginationRequest & {
      keywords?: string
      status?: string
    },
  ): Promise<PaginatedData<Conversation>> =>
    apiClient.get('/v1/conversation/list', { params }),

  // 别名：list -> getConversations
  list: (params?: any): Promise<any> =>
    conversationAPI.getConversations(params),

  // 根据dialog_id获取对话列表
  getConversationsByDialog: (
    dialogId: string,
  ): Promise<DialogConversationSummary[]> => {
    if (!dialogId) {
      throw new Error('dialog_id is required')
    }
    return apiClient.get(`/conversation/list?dialog_id=${dialogId}`)
  },

  // 获取对话详情
  getConversation: (conversationId: string): Promise<Conversation> =>
    apiClient.get(`/v1/conversation/${conversationId}`),

  // 别名：get -> getConversation
  get: (conversationId: string): Promise<Conversation> =>
    conversationAPI.getConversation(conversationId),

  // 获取对话详情（用于话题页面）
  getConversationDetail: (conversationId: string): Promise<any> =>
    apiClient.get(`/v1/conversation/get?conversation_id=${conversationId}`),

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

  // 创建对话
  createConversation: (data: {
    title?: string
    system_prompt?: string
    dialogId?: string
    model?: string
    knowledgeBaseIds?: string[]
    [key: string]: any
  }): Promise<Conversation> => apiClient.post('/v1/conversation/create', data),

  // 别名：create -> createConversation
  create: (data: {
    title?: string
    system_prompt?: string
    dialogId?: string
    model?: string
    knowledgeBaseIds?: string[]
    [key: string]: any
  }): Promise<Conversation> => conversationAPI.createConversation(data),

  // 更新对话
  updateConversation: (
    conversationId: string,
    data: { title?: string; system_prompt?: string },
  ): Promise<Conversation> =>
    apiClient.post(`/v1/conversation/${conversationId}/update`, data),

  // 别名：update -> updateConversation
  update: (
    conversationId: string,
    data: { title?: string; system_prompt?: string },
  ): Promise<Conversation> =>
    conversationAPI.updateConversation(conversationId, data),

  // 删除对话（单个）
  deleteConversation: (conversationId: string): Promise<void> =>
    apiClient.delete(`/v1/conversation/${conversationId}`),

  // 别名：delete -> deleteConversation（支持单个或批量）
  delete: (conversationIds: string | string[]): Promise<void> => {
    if (Array.isArray(conversationIds)) {
      return conversationAPI.removeConversation(conversationIds) as any
    }
    return conversationAPI.deleteConversation(conversationIds)
  },

  // 删除消息
  deleteMessage: (conversationId: string, messageId: string): Promise<void> =>
    apiClient.delete(`/v1/conversation/${conversationId}/message/${messageId}`),

  // 删除对话（批量，参考 RAGFlow /conversation/rm 接口）
  removeConversation: (conversationIds: string[]): Promise<any> =>
    apiClient.post('/v1/conversation/rm', {
      conversation_ids: conversationIds,
    }),

  // 归档对话
  archiveConversation: (conversationId: string): Promise<void> =>
    apiClient.post(`/v1/conversation/${conversationId}/archive`),

  // 获取对话消息
  getMessages: (
    conversationId: string,
    params?: PaginationRequest,
  ): Promise<PaginatedData<Message>> =>
    apiClient.get(`/v1/conversation/${conversationId}/messages`, { params }),

  // 发送消息 (聊天完成)
  chatCompletion: (
    data: ChatCompletionRequest,
  ): Promise<ChatCompletionResponse> =>
    apiClient.post('/v1/conversation/completion', data),

  // 流式聊天完成
  streamChatCompletion: (
    data: ChatCompletionRequest,
    onMessage: (chunk: any) => void,
    onError?: (error: Event) => void,
    onComplete?: () => void,
  ): EventSource => {
    const eventSource = apiClient.createEventSource(
      '/v1/conversation/completion/stream',
      {
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
      },
    )

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
  }): Promise<{
    answer: string
    conversation_id: string
    references?: any[]
  }> => apiClient.post('/v1/conversation/ask', data),

  // 语音识别 (ASR)
  speechToText: (audioFile: File, language?: string): Promise<ASRResponse> =>
    apiClient.upload('/v1/conversation/asr', audioFile, { language }),

  // 文本转语音 (TTS)
  textToSpeech: (data: TTSRequest): Promise<TTSResponse> =>
    apiClient.post('/v1/conversation/tts', data),

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

  // 生成思维导图
  generateMindmap: (data: MindmapRequest): Promise<MindmapResponse> =>
    apiClient.post('/v1/conversation/mindmap', data),

  // 生成相关问题
  generateRelatedQuestions: (data: {
    question: string
    search_id?: string
  }): Promise<string[]> =>
    apiClient.post('/v1/conversation/related_questions', data),

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
    format: 'json' | 'txt' | 'pdf' | 'html',
  ): Promise<void> =>
    apiClient.download(
      `/v1/conversation/${conversationId}/export?format=${format}`,
      `conversation_${conversationId}.${format}`,
    ),

  // 批量导出对话
  exportConversations: (
    conversationIds: string[],
    format: 'json' | 'zip',
  ): Promise<void> =>
    apiClient.post(
      `/v1/conversation/export-batch`,
      { conversation_ids: conversationIds, format },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    ),

  // 对话统计
  getConversationStats: (
    timeRange?: string,
  ): Promise<{
    total_conversations: number
    total_messages: number
    avg_messages_per_conversation: number
    most_active_days: string[]
    popular_topics: Array<{ topic: string; count: number }>
  }> =>
    apiClient.get('/v1/conversation/stats', {
      params: timeRange ? { time_range: timeRange } : undefined,
    }),

  // ============================================================================
  // 文件上传相关接口
  // ============================================================================

  /**
   * 上传文件并返回运行时附件元数据
   * 对齐 ragflow 内部聊天：使用 /document/upload_info，不需要 conversation_id
   */
  uploadInfo: (
    file: File,
    onProgress?: (progress: number) => void,
    signal?: AbortSignal,
  ): Promise<UploadedFileInfo> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const baseURL =
        import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      xhr.open('POST', `${baseURL}/v1/document/upload_info`)

      const token = localStorage.getItem('auth_token')
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      }

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          onProgress?.(progress)
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            if (response.code === 0 || response.retcode === 0) {
              resolve(response.data)
            } else {
              reject(
                new Error(
                  response.message || response.retmsg || 'Upload failed',
                ),
              )
            }
          } catch {
            reject(new Error('Invalid response format'))
          }
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`))
        }
      }

      xhr.onerror = () => reject(new Error('Network error'))
      xhr.ontimeout = () => reject(new Error('Upload timeout'))

      if (signal) {
        signal.addEventListener('abort', () => {
          xhr.abort()
          reject(new Error('Upload cancelled'))
        })
      }

      const formData = new FormData()
      formData.append('file', file)
      xhr.send(formData)
    })
  },

  /**
   * 上传并解析文件
   * 用于聊天时上传文件，文件会被解析后参与对话
   *
   * 注意：使用 /document/upload_and_parse 接口（而非 /document/upload_info）
   * - upload_and_parse: 需要 conversation_id，文件会关联到对话
   * - upload_info: 不需要 conversation_id，仅做文件解析
   *
   * @param conversationId - 对话 ID
   * @param file - 要上传的文件
   * @param onProgress - 上传进度回调（0-100）
   * @param signal - AbortSignal 用于取消上传
   * @returns 上传成功后的文档 ID 列表
   */
  uploadAndParse: (
    conversationId: string,
    file: File,
    onProgress?: (progress: number) => void,
    signal?: AbortSignal,
  ): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const baseURL =
        import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      xhr.open('POST', `${baseURL}/v1/document/upload_and_parse`)

      // 设置认证头
      const token = localStorage.getItem('auth_token')
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      }

      // 上传进度回调
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          onProgress?.(progress)
        }
      }

      // 上传完成处理
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            if (response.code === 0 || response.retcode === 0) {
              resolve(response.data)
            } else {
              reject(
                new Error(
                  response.message || response.retmsg || 'Upload failed',
                ),
              )
            }
          } catch (e) {
            reject(new Error('Invalid response format'))
          }
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`))
        }
      }

      // 错误处理
      xhr.onerror = () => reject(new Error('Network error'))
      xhr.ontimeout = () => reject(new Error('Upload timeout'))

      // 支持取消上传
      if (signal) {
        signal.addEventListener('abort', () => {
          xhr.abort()
          reject(new Error('Upload cancelled'))
        })
      }

      // 构建 FormData
      const formData = new FormData()
      formData.append('file', file)
      formData.append('conversation_id', conversationId)

      // 发送请求
      xhr.send(formData)
    })
  },
}
