/**
 * 首页对话逻辑 Hook
 * 管理消息发送、流式响应、SSE 连接等
 *
 * 支持两种模式：
 * 1. MCP 模式：没有选择应用时，使用 MCP 聊天服务
 * 2. 应用模式：选择了应用时，使用应用的 completion API（与探索页面一致）
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { toast } from '@/lib/toast'
import { EventSourceParserStream } from 'eventsource-parser/stream'
import type { MCPChatServiceRequest } from '@/api/mcp-chat-service'
import { conversationAPI } from '@/api/conversation'
import type { DialogApp } from '@/types/api'
import type { ChatMessage } from '../types'
import {
  consumeStreamingAnswerChunk,
  createInitialStreamingAnswerState,
} from '@/utils/streaming-answer'
import { streamMCPAgentChat } from '../utils/mcp-agent-stream'
import {
  extractReferencesFromSSEData,
  getReferenceDocId,
  type ConversationHistoryMessage,
} from '../utils/chat-reference-helpers'

interface UseHomeChatOptions {
  selectedMCPIds: string[]
  selectedModelId: string
  selectedApp?: DialogApp | null
  selectedConversationId?: string | null
  onConversationIdChange?: (conversationId: string | null) => void
}

export const useHomeChat = ({
  selectedMCPIds,
  selectedModelId,
  selectedApp,
  selectedConversationId,
  onConversationIdChange,
}: UseHomeChatOptions) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [streamingThinking, _setStreamingThinking] = useState('')
  const [isToolAnalyzing, setIsToolAnalyzing] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // 标记是否正在发送消息（防止 effect 中重复加载历史）
  const isSendingRef = useRef(false)

  // 使用 ref 存储最新的 messages，避免闭包陈旧问题
  const messagesRef = useRef<ChatMessage[]>([])

  // 使用 ref 同步 currentConversationId，避免 Effect 中的竞态条件
  const currentConversationIdRef = useRef<string | null>(null)

  // 防止 loadConversationHistory 重复调用
  const isLoadingHistoryRef = useRef(false)

  // 同步更新 messages 和 ref 的辅助函数
  const updateMessages = useCallback(
    (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      if (typeof updater === 'function') {
        setMessages((prev) => {
          const newMessages = updater(prev)
          messagesRef.current = newMessages
          return newMessages
        })
      } else {
        messagesRef.current = updater
        setMessages(updater)
      }
    },
    [],
  )

  // 同步更新 currentConversationId 和 ref
  const updateCurrentConversationId = useCallback((id: string | null) => {
    currentConversationIdRef.current = id
    setCurrentConversationId(id)
  }, [])

  // 是否是应用对话模式
  const isAppMode = !!selectedApp

  // 加载历史对话（返回加载的消息，供 sendAppMessage 使用）
  const loadConversationHistory = useCallback(
    async (conversationId: string): Promise<ChatMessage[]> => {
      if (!conversationId) return []

      // 防止重复调用（使用 ref 同步检查）
      if (isLoadingHistoryRef.current) {
        console.log('[loadConversationHistory] 已在加载中，跳过重复调用')
        return messagesRef.current
      }

      // 如果已经是当前对话，直接返回现有消息
      if (conversationId === currentConversationIdRef.current) {
        console.log('[loadConversationHistory] 已是当前对话，直接返回现有消息')
        return messagesRef.current
      }

      isLoadingHistoryRef.current = true
      setIsLoadingHistory(true)

      try {
        const response =
          await conversationAPI.getConversationDetail(conversationId)

        if (response?.message && Array.isArray(response.message)) {
          const loadedMessages: ChatMessage[] = response.message.map(
            (msg: ConversationHistoryMessage) => ({
              id:
                msg.id ||
                `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              role: msg.role === 'assistant' ? 'assistant' : 'user',
              content: msg.content || '',
              timestamp: new Date().toLocaleTimeString(),
              // 保留引用信息
              references: msg.reference?.chunks || [],
            }),
          )
          updateMessages(loadedMessages)
          updateCurrentConversationId(conversationId)
          return loadedMessages
        }

        updateCurrentConversationId(conversationId)
        return []
      } catch (error) {
        console.error('Failed to load conversation history:', error)
        toast.error('加载对话历史失败')
        return []
      } finally {
        isLoadingHistoryRef.current = false
        setIsLoadingHistory(false)
      }
    },
    [updateMessages, updateCurrentConversationId],
  )

  // 当 selectedConversationId 变化时加载历史对话（仅用户主动选择时）
  useEffect(() => {
    // 如果正在发送消息，跳过（由 sendAppMessage 内部处理）
    if (isSendingRef.current) return

    // 如果正在加载历史，跳过
    if (isLoadingHistoryRef.current) return

    if (selectedConversationId) {
      // 使用 ref 检查，确保同步判断（避免 state 异步更新导致的竞态）
      if (selectedConversationId === currentConversationIdRef.current) return
      loadConversationHistory(selectedConversationId)
    } else if (
      selectedConversationId === null &&
      currentConversationIdRef.current !== null
    ) {
      // 新建对话时清空消息
      updateMessages([])
      updateCurrentConversationId(null)
    }
  }, [
    selectedConversationId,
    loadConversationHistory,
    updateMessages,
    updateCurrentConversationId,
  ])

  // 当切换应用时清空对话
  useEffect(() => {
    // 如果正在发送消息，跳过
    if (isSendingRef.current) return

    if (!selectedApp) {
      // 从应用模式切换回 MCP 模式时清空
      if (currentConversationIdRef.current) {
        updateMessages([])
        updateCurrentConversationId(null)
      }
    }
  }, [selectedApp, updateMessages, updateCurrentConversationId])

  // 发送消息 - 应用模式（参考探索页面的实现方式）
  // 核心思路：在流式开始时先添加空的 AI 消息，然后在流式过程中直接更新这条消息
  // 这样就不会出现重复渲染的问题
  const sendAppMessage = useCallback(
    async (inputValue: string) => {
      if (!inputValue.trim() || !selectedApp) return

      // 如果正在加载历史，等待加载完成
      if (isLoadingHistory) {
        console.log('[sendAppMessage] Waiting for history to load...')
        return
      }

      // 标记正在发送
      isSendingRef.current = true

      const userMessageContent = inputValue.trim()

      // 创建 AbortController 用于停止输出
      abortControllerRef.current = new AbortController()

      try {
        // 优先使用 selectedConversationId（用户选择的历史对话）
        // 其次使用 currentConversationIdRef（当前会话中创建的对话）- 使用 ref 确保同步
        let conversationId =
          selectedConversationId || currentConversationIdRef.current

        // 使用 ref 获取最新的 messages，避免闭包陈旧问题
        let currentMessages = messagesRef.current

        // 关键修复：检测是否需要同步加载历史
        // 场景：用户选择了历史对话，但 Effect 还没执行完成（messagesRef 还是旧值）
        // 判断条件：selectedConversationId 有值，但不等于 currentConversationIdRef
        if (
          selectedConversationId &&
          selectedConversationId !== currentConversationIdRef.current
        ) {
          console.log('[sendAppMessage] 检测到历史对话未加载，同步加载中...')
          // 同步加载历史消息，确保 currentMessages 是正确的历史
          currentMessages = await loadConversationHistory(
            selectedConversationId,
          )
          conversationId = selectedConversationId
        } else if (!conversationId) {
          setIsLoadingHistory(true)

          // 1. 创建新对话
          const newConversation = await conversationAPI.setConversation({
            dialog_id: selectedApp.id,
            name:
              userMessageContent.slice(0, 50) +
              (userMessageContent.length > 50 ? '...' : ''),
            is_new: true,
          })

          if (!newConversation?.id) {
            throw new Error('创建对话失败')
          }

          conversationId = newConversation.id
          updateCurrentConversationId(conversationId)

          // 2. 加载历史消息（包含 AI 开场白）
          currentMessages = await loadConversationHistory(conversationId!)

          // 3. 更新 store（此时 effect 会被 isSendingRef 阻止）
          onConversationIdChange?.(conversationId)

          setIsLoadingHistory(false)
        }

        // 创建用户消息
        const userMessage: ChatMessage = {
          id: `msg-${Date.now()}-user-${Math.random().toString(36).substr(2, 9)}`,
          role: 'user',
          content: userMessageContent,
          timestamp: new Date().toLocaleTimeString(),
        }

        // 创建空的 AI 消息（流式过程中会更新）
        const aiMessageId = `msg-${Date.now()}-ai-${Math.random().toString(36).substr(2, 9)}`
        const aiMessage: ChatMessage = {
          id: aiMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toLocaleTimeString(),
          references: [],
          thinking: '',
        }

        // 添加用户消息和空的 AI 消息
        const updatedMessages = [...currentMessages, userMessage, aiMessage]
        updateMessages(updatedMessages)
        setIsStreaming(true)

        // 构建请求参数（只包含到用户消息，不包含空的 AI 消息）
        const requestMessages = [...currentMessages, userMessage].map(
          (msg) => ({
            role: msg.role,
            content: msg.content,
          }),
        )

        const response = await conversationAPI.completion({
          conversation_id: conversationId!,
          messages: requestMessages,
          quote: true,
        })

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`)
        if (!response.body) throw new Error('No response body')

        // 使用 EventSourceParserStream 处理 SSE 流
        const reader = response.body
          .pipeThrough(new TextDecoderStream())
          .pipeThrough(new EventSourceParserStream())
          .getReader()

        let streamState = createInitialStreamingAnswerState()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          // 检查是否已被中止
          if (abortControllerRef.current?.signal.aborted) {
            reader.cancel()
            break
          }

          try {
            const jsonStr = value?.data
            if (!jsonStr) continue

            const data = JSON.parse(jsonStr)
            const chunk = consumeStreamingAnswerChunk(streamState, data)
            streamState = chunk.nextState
            if (chunk.isDone) continue

            const chunkData =
              chunk.payload && typeof chunk.payload === 'object'
                ? (chunk.payload as Record<string, unknown>)
                : null
            const newReferences = chunkData
              ? extractReferencesFromSSEData(chunkData)
              : []
            const cleanContent = streamState.content
            const thinking = streamState.thinking

            // 直接更新 messages 中最后一条 AI 消息（参考探索页面）
            updateMessages((prev) => {
              const newMsgs = [...prev]
              const lastIdx = newMsgs.length - 1
              if (lastIdx >= 0 && newMsgs[lastIdx].role === 'assistant') {
                // 只有当新的 references 有数据时才更新，否则保留之前的
                const existingReferences = newMsgs[lastIdx].references || []
                const referencesChanged =
                  newReferences.length > 0 &&
                  (newReferences.length !== existingReferences.length ||
                    newReferences.some((ref, refIdx: number) => {
                      const previousRef = existingReferences[refIdx]
                      if (!previousRef) return true
                      return (
                        previousRef.id !== ref.id ||
                        getReferenceDocId(previousRef) !==
                          getReferenceDocId(ref) ||
                        previousRef.content !== ref.content
                      )
                    }))
                const references = referencesChanged
                  ? newReferences
                  : existingReferences

                const sameContent = newMsgs[lastIdx].content === cleanContent
                const sameThinking =
                  (newMsgs[lastIdx].thinking || '') === thinking
                const sameReferences = references === existingReferences
                if (sameContent && sameThinking && sameReferences) {
                  return prev
                }

                newMsgs[lastIdx] = {
                  ...newMsgs[lastIdx],
                  content: cleanContent,
                  references,
                  thinking,
                }
              }
              return newMsgs
            })
          } catch (e) {
            // JSON 解析错误，忽略
          }
        }
      } catch (error) {
        console.error('Error sending app message:', error)
        if (!abortControllerRef.current?.signal.aborted) {
          toast.error(error instanceof Error ? error.message : '发送消息失败')
          // 更新最后一条消息为错误消息
          updateMessages((prev) => {
            const newMsgs = [...prev]
            const lastIdx = newMsgs.length - 1
            if (lastIdx >= 0 && newMsgs[lastIdx].role === 'assistant') {
              newMsgs[lastIdx] = {
                ...newMsgs[lastIdx],
                content: '抱歉，发生了错误，请重试。',
              }
            }
            return newMsgs
          })
        }
      } finally {
        // 重置标记
        isSendingRef.current = false
        abortControllerRef.current = null
        setIsStreaming(false)
      }
    },
    [
      selectedApp,
      selectedConversationId,
      onConversationIdChange,
      loadConversationHistory,
      isLoadingHistory,
      updateMessages,
      updateCurrentConversationId,
    ],
  )

  // 发送消息 - MCP 模式
  const sendMCPMessage = useCallback(
    async (inputValue: string) => {
      if (!inputValue.trim()) return

      if (!selectedModelId) {
        toast.error('请先选择一个聊天模型')
        return
      }

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: inputValue.trim(),
        timestamp: new Date().toLocaleTimeString(),
      }

      const assistantMessageId = `msg-${Date.now()}-mcp-ai-${Math.random().toString(36).substr(2, 9)}`
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toLocaleTimeString(),
        timelineNodes: [],
        isStreaming: true,
      }

      const historyMessages = messagesRef.current.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      updateMessages((prev) => [...prev, userMessage, assistantMessage])
      setIsStreaming(true)
      setStreamingContent('')
      setIsToolAnalyzing(false)
      abortControllerRef.current = new AbortController()

      try {
        const allMessages = [
          ...historyMessages,
          {
            role: 'user' as const,
            content: userMessage.content,
          },
        ]

        const request: MCPChatServiceRequest = {
          prompt: '',
          messages: allMessages,
          llm_name: selectedModelId,
          stream: true,
          gen_conf: {},
          mcp_ids: selectedMCPIds,
          mcp_timeout: 30000,
          verbose_tool_use: true,
          files: [],
          structured_output: selectedMCPIds.length > 0,
          delta_stream: true,
        }

        await streamMCPAgentChat({
          request,
          signal: abortControllerRef.current.signal,
          onState: (timelineState) => {
            setStreamingContent(timelineState.answer)
            setIsToolAnalyzing(timelineState.isToolAnalyzing)

            updateMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: timelineState.answer,
                      timelineNodes: timelineState.nodes,
                      isStreaming: !timelineState.final,
                    }
                  : msg,
              ),
            )
          },
        })
      } catch (error) {
        console.error('Error sending message:', error)
        if (!abortControllerRef.current?.signal.aborted) {
          toast.error(error instanceof Error ? error.message : '发送消息失败')
          const errorMessage =
            error instanceof Error ? error.message : '发送消息失败'
          updateMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: errorMessage,
                    timelineNodes: [
                      ...(msg.timelineNodes || []),
                      {
                        id: `error-${Date.now()}`,
                        kind: 'error',
                        title: '运行错误',
                        description: errorMessage,
                        status: 'error',
                        content: errorMessage,
                      },
                    ],
                    isStreaming: false,
                  }
                : msg,
            ),
          )
        }
      } finally {
        abortControllerRef.current = null
        setIsStreaming(false)
        setStreamingContent('')
        setIsToolAnalyzing(false)
        updateMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, isStreaming: false }
              : msg,
          ),
        )
      }
    },
    [selectedModelId, selectedMCPIds, updateMessages],
  )

  // 发送消息（根据模式选择）
  const sendMessage = useCallback(
    async (inputValue: string) => {
      if (isAppMode) {
        await sendAppMessage(inputValue)
      } else {
        await sendMCPMessage(inputValue)
      }
    },
    [isAppMode, sendAppMessage, sendMCPMessage],
  )

  // 停止输出
  const stopStreaming = useCallback(() => {
    // 停止应用模式的输出
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStreaming(false)
    setStreamingContent('')
    setIsToolAnalyzing(false)
    updateMessages((prev) =>
      prev.map((msg) =>
        msg.isStreaming && msg.role === 'assistant'
          ? { ...msg, isStreaming: false }
          : msg,
      ),
    )
  }, [updateMessages])

  // 清空对话
  const clearMessages = useCallback(() => {
    updateMessages([])
    updateCurrentConversationId(null)
  }, [updateMessages, updateCurrentConversationId])

  return {
    messages,
    isStreaming,
    streamingContent,
    streamingThinking,
    isToolAnalyzing,
    isLoadingHistory,
    isAppMode,
    currentConversationId,
    sendMessage,
    stopStreaming,
    clearMessages,
    loadConversationHistory,
  }
}
