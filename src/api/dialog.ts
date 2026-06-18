import { apiClient } from './client'
import { API_BASE_URL, STORAGE_KEYS } from '@/constants'
import type { DialogApp, DialogImportResult } from '@/types/api'

/**
 * RESTful chat routes live under `/api/v1/chats`. apiClient normally targets
 * legacy `/v1/*`, so override baseURL for the chat management endpoints.
 */
const sdkBase = { baseURL: `${API_BASE_URL}/api` }

// Dialog 列表请求参数
export interface DialogListParams {
  id?: string
  name?: string
  keywords?: string
  page?: number
  page_size?: number
  orderby?: string
  desc?: boolean
  owner_ids?: string[]
}

// Dialog 列表响应
export interface DialogListResponse {
  dialogs: DialogApp[]
  chats?: DialogApp[]
  total: number
}

type ChatRecord = DialogApp & {
  dataset_ids?: string[]
  kb_ids?: string[]
}

type ChatListResponse = {
  chats?: ChatRecord[]
  total?: number
}

const READONLY_CHAT_FIELDS = new Set([
  'id',
  'tenant_id',
  'created_by',
  'create_time',
  'create_date',
  'update_time',
  'update_date',
  'kb_names',
])

const normalizeChat = (chat: ChatRecord): DialogApp => {
  const datasetIds = chat.dataset_ids ?? chat.kb_ids ?? []
  return {
    ...chat,
    kb_ids: datasetIds,
    dataset_ids: datasetIds,
  } as DialogApp
}

const toChatRequest = (data: object) => {
  const request: Record<string, unknown> = {}

  Object.entries(data).forEach(([key, value]) => {
    if (
      value === undefined ||
      key === 'dialog_id' ||
      READONLY_CHAT_FIELDS.has(key)
    ) {
      return
    }

    if (key === 'kb_ids') {
      if (!('dataset_ids' in data)) {
        request.dataset_ids = value
      }
      return
    }

    request[key] = value
  })

  return request
}

const buildChatListPath = (params?: DialogListParams) => {
  const searchParams = new URLSearchParams()
  if (params?.id) searchParams.set('id', params.id)
  if (params?.name) searchParams.set('name', params.name)
  if (params?.keywords) searchParams.set('keywords', params.keywords)
  if (params?.page) searchParams.set('page', params.page.toString())
  if (params?.page_size)
    searchParams.set('page_size', params.page_size.toString())
  if (params?.orderby) searchParams.set('orderby', params.orderby)
  if (params?.desc !== undefined) searchParams.set('desc', String(params.desc))
  params?.owner_ids?.forEach((ownerId) => {
    if (ownerId) {
      searchParams.append('owner_ids', ownerId)
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `/chats?${queryString}` : '/chats'
}

export const dialogAPI = {
  // RESTful chat 管理接口：/api/v1/chats。
  listChats: async (
    params?: DialogListParams,
  ): Promise<{ chats: DialogApp[]; total: number }> => {
    const response = await apiClient.get<ChatListResponse>(
      buildChatListPath(params),
      sdkBase,
    )
    return {
      chats: (response.chats || []).map(normalizeChat),
      total: response.total || 0,
    }
  },

  createChat: async (data: object): Promise<DialogApp> => {
    const response = await apiClient.post<ChatRecord>(
      '/chats',
      toChatRequest(data),
      sdkBase,
    )
    return normalizeChat(response)
  },

  getChat: async (chatId: string): Promise<DialogApp> => {
    const response = await apiClient.get<ChatRecord>(
      `/chats/${chatId}`,
      sdkBase,
    )
    return normalizeChat(response)
  },

  updateChat: async (chatId: string, data: object): Promise<DialogApp> => {
    const response = await apiClient.put<ChatRecord>(
      `/chats/${chatId}`,
      toChatRequest(data),
      sdkBase,
    )
    return normalizeChat(response)
  },

  patchChat: async (chatId: string, data: object): Promise<DialogApp> => {
    const response = await apiClient.patch<ChatRecord>(
      `/chats/${chatId}`,
      toChatRequest(data),
      sdkBase,
    )
    return normalizeChat(response)
  },

  deleteChat: (chatId: string): Promise<boolean> =>
    apiClient.delete(`/chats/${chatId}`, sdkBase),

  bulkDeleteChats: (
    chatIds: string[],
  ): Promise<{ success_count?: number; errors?: string[] }> =>
    apiClient.delete('/chats', { ...sdkBase, data: { ids: chatIds } }),

  // 兼容本地现有页面/Hook 的命名；内部已切到 RESTful chats。
  list: async (params?: DialogListParams): Promise<DialogListResponse> => {
    const response = await dialogAPI.listChats(params)
    return {
      dialogs: response.chats,
      chats: response.chats,
      total: response.total,
    }
  },

  // 兼容旧接口的简化调用（返回所有 dialogs）
  listAll: async (): Promise<DialogApp[]> => {
    const response = await dialogAPI.listChats({ page: 1, page_size: 9999 })
    return response.chats
  },

  // 获取对话应用详情
  getDetail: (dialogId: string): Promise<DialogApp> =>
    dialogAPI.getChat(dialogId),

  // 更新系统提示词
  updateSystemPrompt: async (
    dialogId: string,
    systemPrompt: string,
  ): Promise<DialogApp> => {
    return dialogAPI.patchChat(dialogId, {
      prompt_config: {
        system: systemPrompt,
      },
    })
  },

  // 创建对话应用
  create: (data: Partial<DialogApp>): Promise<DialogApp> =>
    dialogAPI.createChat(data),

  // 更新对话应用（局部更新）
  update: (dialogId: string, data: Partial<DialogApp>): Promise<DialogApp> =>
    dialogAPI.patchChat(dialogId, data),

  exportTemplates: async (dialogIds: string[]): Promise<void> => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    const ids = dialogIds.join(',')
    const response = await fetch(
      `${API_BASE_URL}/v1/dialog/export?dialog_ids=${encodeURIComponent(ids)}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    )

    if (!response.ok) {
      const text = await response.text()
      try {
        const json = JSON.parse(text)
        throw new Error(
          json.retmsg || json.message || `Export failed (${response.status})`,
        )
      } catch {
        throw new Error(`Export failed (${response.status})`)
      }
    }

    const contentType = response.headers.get('content-type') || ''
    const disposition = response.headers.get('content-disposition') || ''
    let filename = 'template.json'

    const utf8Match = disposition.match(/filename\*=UTF-8''([^;\s]+)/)
    const asciiMatch =
      disposition.match(/filename="([^"]+)"/) ||
      disposition.match(/filename=([^;\s]+)/)
    if (utf8Match) {
      filename = decodeURIComponent(utf8Match[1])
    } else if (asciiMatch) {
      filename = asciiMatch[1]
    } else if (contentType.includes('application/zip')) {
      filename = 'dialog-templates.zip'
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },

  importTemplates: (file: File): Promise<DialogImportResult> =>
    apiClient.upload<DialogImportResult>('/dialog/import', file),
}
