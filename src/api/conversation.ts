import type { ModelIdentitySnapshot } from '@/lib/model-identity'
import { APIError, apiClient } from './client'
import { API_BASE_URL } from '@/constants'
import { uploadConversationAttachment } from './conversation-upload'
import type { MetadataCondition } from '../types/api'
import {
  chatConfig,
  type ChatServiceRequest,
  type UploadedFileInfo,
} from '@/config/chat'

/**
 * Application chat sessions use the RESTful `/api/v1/chats/{chat_id}/sessions`
 * and `/api/v1/chat/*` routes. The `/v1/conversation/*` routes are deprecated
 * on the backend and no longer used here, except for the search mind map,
 * whose REST replacement does not accept `doc_ids` yet.
 */
const restBase = { baseURL: `${API_BASE_URL}/api` }

export type CompletionMessage = {
  /** Persisted display attribution, excluded from provider prompts by the API. */
  model_identity?: ModelIdentitySnapshot
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

/** One stored message; the reply of a turn shares the id of its question. */
export interface ConversationSessionMessage {
  id?: string
  role?: string
  content?: string
  model_identity?: unknown
  files?: UploadedFileInfo[]
  reference?: { chunks?: unknown[] }
  [key: string]: unknown
}

export interface ConversationSession {
  id: string
  chat_id?: string
  name?: string
  messages: ConversationSessionMessage[]
  /** One reference group per assistant reply after the opening message. */
  reference: unknown[]
  avatar?: string
  update_time?: number
  update_date?: string
}

export interface CompletionRequest {
  chat_id: string
  session_id: string
  /** Local history ending with the new user message. */
  messages: CompletionMessage[]
  /**
   * Replace the stored history with `messages` (regenerating an answer).
   * Otherwise only the new user message is sent and the server appends it to
   * the history it already holds, keeping stored ids and references.
   */
  regenerate?: boolean
  quote?: boolean
  doc_ids?: string // 文档 ID 列表，逗号分隔
  filter_condition?: string
  metadata_condition?: MetadataCondition
  reasoning?: boolean // 深度研究开关
  internet?: boolean // 联网搜索开关，应用需配置 Tavily
  audio_output?: 'configured' | 'none'
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const sessionsPath = (chatId: string) =>
  `/chats/${encodeURIComponent(chatId)}/sessions`

const toSession = (value: unknown): ConversationSession => {
  const record = isRecord(value) ? value : {}
  return {
    ...record,
    id: typeof record.id === 'string' ? record.id : '',
    messages: Array.isArray(record.messages)
      ? (record.messages as ConversationSessionMessage[])
      : [],
    reference: Array.isArray(record.reference) ? record.reference : [],
  }
}

const toSummary = (value: unknown): DialogConversationSummary => {
  const session = toSession(value)
  return {
    id: session.id,
    name: session.name,
    update_time: Number(session.update_time) || 0,
    update_date: session.update_date,
    message_count: session.messages.length,
  }
}

/**
 * The branch history for a regenerate request. The server keeps a reply's
 * stored references only when the reply carries its turn id, which is the id
 * of the question it answers.
 */
const toBranchHistory = (messages: CompletionMessage[]) => {
  let turnId: string | undefined
  return messages.map(({ id, ...message }) => {
    if (message.role === 'user') {
      turnId = id?.trim() || undefined
      return turnId ? { ...message, id: turnId } : message
    }
    return message.role === 'assistant' && turnId
      ? { ...message, id: turnId }
      : message
  })
}

export const conversationAPI = {
  // 按应用列出会话（最新创建在前）
  getConversationsByDialog: async (
    dialogId: string,
  ): Promise<DialogConversationSummary[]> => {
    if (!dialogId) {
      throw new Error('dialog_id is required')
    }
    const sessions = await apiClient.get<unknown>(sessionsPath(dialogId), {
      ...restBase,
      params: { page: 1, page_size: 0, orderby: 'create_time', desc: true },
    })
    return Array.isArray(sessions) ? sessions.map(toSummary) : []
  },

  // 会话详情：消息与每条回答的引用
  getConversationDetail: async (
    dialogId: string,
    conversationId: string,
  ): Promise<ConversationSession> =>
    toSession(
      await apiClient.get<unknown>(
        `${sessionsPath(dialogId)}/${encodeURIComponent(conversationId)}`,
        restBase,
      ),
    ),

  // 新建会话；服务端写入应用的开场白
  createConversation: async (
    dialogId: string,
    name: string,
  ): Promise<ConversationSession> =>
    toSession(
      await apiClient.post<unknown>(sessionsPath(dialogId), { name }, restBase),
    ),

  renameConversation: async (
    dialogId: string,
    conversationId: string,
    name: string,
  ): Promise<ConversationSession> =>
    toSession(
      await apiClient.patch<unknown>(
        `${sessionsPath(dialogId)}/${encodeURIComponent(conversationId)}`,
        { name },
        restBase,
      ),
    ),

  removeConversations: (
    dialogId: string,
    conversationIds: string[],
  ): Promise<unknown> =>
    apiClient.delete(sessionsPath(dialogId), {
      ...restBase,
      body: JSON.stringify({ ids: conversationIds }),
    }),

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

  // 应用对话的流式回答
  completion: (
    { messages, regenerate = false, ...data }: CompletionRequest,
    options?: { signal?: AbortSignal },
  ): Promise<Response> =>
    apiClient.post<Response>(
      '/chat/completions',
      {
        quote: false,
        filter_condition: '',
        // These surfaces render text; read-aloud uses its own audio stream.
        // The REST route ignores this until the backend adds the switch.
        audio_output: 'none',
        ...data,
        stream: true,
        messages: regenerate ? toBranchHistory(messages) : messages.slice(-1),
        ...(regenerate ? { pass_all_history_messages: true } : {}),
      },
      {
        ...restBase,
        signal: options?.signal,
        headers: { Accept: 'text/event-stream' },
        readResponse: async (response) => response,
      },
    ),

  // 文本转语音 - 流式版本（用于实时播放）
  textToSpeechStream: (
    text: string,
    options?: { signal?: AbortSignal },
  ): Promise<Response> =>
    apiClient.post<Response>(
      '/chat/audio/speech',
      { text },
      {
        ...restBase,
        signal: options?.signal,
        headers: { Accept: 'audio/mpeg' },
        readResponse: async (response) => response,
      },
    ),

  // 生成相关问题
  generateRelatedQuestions: async (data: {
    question: string
    search_id?: string
  }): Promise<string[]> => {
    const questions = await apiClient.post<unknown>(
      '/chat/recommendation',
      data,
      {
        ...restBase,
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
