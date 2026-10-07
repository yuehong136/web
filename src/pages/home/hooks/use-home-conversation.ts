import { useCallback, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { conversationAPI } from '@/api/conversation'
import { chatKeys } from '@/hooks/use-chat-request'
import { toast } from '@/lib/toast'
import type { ChatMessage } from '../types'
import type { ConversationHistoryMessage } from '../utils/chat-reference-helpers'

type MessagesUpdate = ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])

export interface CreatedConversation {
  id: string
  messages: ChatMessage[]
}

const toChatMessages = (detail: unknown): ChatMessage[] => {
  const history = (detail as { message?: unknown } | null)?.message
  if (!Array.isArray(history)) return []
  // 服务端给同一轮的问和答相同 id；消息 id 是更新与渲染的身份，必须唯一
  const seen = new Set<string>()
  return history.map((msg: ConversationHistoryMessage) => {
    const id =
      msg.id && !seen.has(msg.id)
        ? msg.id
        : `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    seen.add(id)
    return {
      id,
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content || '',
      timestamp: new Date().toLocaleTimeString(),
      // 保留引用信息
      references: msg.reference?.chunks || [],
    }
  })
}

/**
 * The conversation Home shows: its messages, the server id they belong to and
 * the history requests that fill them.
 *
 * Every history load or conversation creation starts a new generation, and a
 * response lands only while its generation is current. The last selection
 * therefore wins, and a superseded request can neither show its messages nor
 * clear the loading state of the request that replaced it.
 */
export function useHomeConversation() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  // ref 与状态保持同步，供异步流程和发送闸门同步判断
  const messagesRef = useRef<ChatMessage[]>([])
  const conversationIdRef = useRef<string | null>(null)
  const isLoadingHistoryRef = useRef(false)
  const generationRef = useRef(0)

  const updateMessages = useCallback((update: MessagesUpdate) => {
    if (typeof update === 'function') {
      setMessages((prev) => {
        const next = update(prev)
        messagesRef.current = next
        return next
      })
    } else {
      messagesRef.current = update
      setMessages(update)
    }
  }, [])

  const show = useCallback(
    (id: string | null, next: ChatMessage[]) => {
      conversationIdRef.current = id
      setConversationId(id)
      updateMessages(next)
    },
    [updateMessages],
  )

  // 开启新一代：之前未完成的加载或创建都不能再落地
  const begin = useCallback((loading: boolean) => {
    generationRef.current += 1
    isLoadingHistoryRef.current = loading
    setIsLoadingHistory(loading)
    return generationRef.current
  }, [])

  // 只有仍是当前一代时才结束加载状态，不会清掉接替它的请求
  const settle = useCallback((generation: number) => {
    if (generation !== generationRef.current) return
    isLoadingHistoryRef.current = false
    setIsLoadingHistory(false)
  }, [])

  /** Drops pending history and shows an empty, unsaved conversation. */
  const reset = useCallback(() => {
    begin(false)
    show(null, [])
  }, [begin, show])

  /** Loads and shows a conversation unless a newer selection replaced it. */
  const load = useCallback(
    async (id: string) => {
      const generation = begin(true)
      try {
        const detail: unknown = await conversationAPI.getConversationDetail(id)
        if (generation === generationRef.current)
          show(id, toChatMessages(detail))
      } catch (error) {
        if (generation !== generationRef.current) return
        console.error('Failed to load conversation history:', error)
        toast.error(t('home.history.loadFailed'))
      } finally {
        settle(generation)
      }
    },
    [begin, settle, show, t],
  )

  /**
   * Creates the server conversation for a first send and shows its opening
   * messages. Resolves null once a newer selection has replaced it.
   */
  const create = useCallback(
    async (
      dialogId: string,
      name: string,
    ): Promise<CreatedConversation | null> => {
      const generation = begin(true)
      try {
        const created = await conversationAPI.setConversation({
          dialog_id: dialogId,
          name,
          is_new: true,
        })
        if (created?.id) {
          // 服务端已有这条会话：刷新侧栏列表，让标题和选中项对得上
          void queryClient.invalidateQueries({
            queryKey: chatKeys.conversationsByDialog(dialogId),
          })
        }
        if (generation !== generationRef.current) return null
        if (!created?.id) throw new Error(t('home.history.createFailed'))

        // 开场白尽力加载：失败时首条消息照常发送，只是不带开场白
        const opening = await conversationAPI
          .getConversationDetail(created.id)
          .then(toChatMessages, () => [])
        if (generation !== generationRef.current) return null
        show(created.id, opening)
        return { id: created.id, messages: opening }
      } finally {
        // 创建失败也要结束加载状态，界面不能停在"加载对话历史"
        settle(generation)
      }
    },
    [begin, settle, show, queryClient, t],
  )

  return {
    messages,
    messagesRef,
    updateMessages,
    conversationId,
    conversationIdRef,
    isLoadingHistory,
    isLoadingHistoryRef,
    load,
    create,
    reset,
  }
}
