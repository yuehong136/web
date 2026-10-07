/**
 * 首页对话逻辑 Hook
 * 管理消息发送、流式响应、SSE 连接等
 *
 * 支持两种模式：
 * 1. MCP 模式：没有选择应用时，使用 MCP 聊天服务
 * 2. 应用模式：选择了应用时，使用应用的 completion API（与探索页面一致）
 *
 * 请求归属：每次发送持有自己的请求对象，只有仍是当前所有者时才能写正文、报错或
 * 复位流式状态。停止、切换会话/应用/身份与卸载都会收回归属；收回只终止本地订阅，
 * 不代表服务端任务已取消。
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from '@/lib/toast'
import { useSubmitGate } from '@/hooks/use-submit-gate'
import type { MCPChatServiceRequest } from '@/api/mcp-chat-service'
import { conversationAPI } from '@/api/conversation'
import type { DialogApp } from '@/types/api'
import type { ChatMessage } from '../types'
import {
  assertSSEResponse,
  consumeStreamingAnswerChunk,
  createInitialStreamingAnswerState,
  getStreamingAnswerFailureNotice,
  readSSEStream,
  type SSEEnvelope,
} from '@/lib/streaming'
import { streamMCPAgentChat } from '../utils/mcp-agent-stream'
import {
  extractReferencesFromSSEData,
  getReferenceDocId,
} from '../utils/chat-reference-helpers'
import { useHomeConversation } from './use-home-conversation'

interface UseHomeChatOptions {
  selectedMCPIds: string[]
  selectedModelId: string
  selectedApp?: DialogApp | null
  selectedConversationId?: string | null
  /** 当前用户与租户；变化后旧身份的请求和历史响应都不再落地 */
  identity?: string
  onConversationIdChange?: (conversationId: string | null) => void
}

/** 一次发送对首页流式状态的所有权 */
interface HomeChatRequest {
  readonly controller: AbortController
  /** 占位助手消息创建后记录，之后只更新这条消息 */
  assistantMessageId: string | null
}

export const useHomeChat = ({
  selectedMCPIds,
  selectedModelId,
  selectedApp,
  selectedConversationId,
  identity = '',
  onConversationIdChange,
}: UseHomeChatOptions) => {
  const { t } = useTranslation()
  const {
    messages,
    messagesRef,
    updateMessages,
    conversationId: currentConversationId,
    conversationIdRef,
    isLoadingHistory,
    isLoadingHistoryRef,
    load: loadHistory,
    create: createConversation,
    reset: resetConversation,
  } = useHomeConversation()
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [streamingThinking, _setStreamingThinking] = useState('')
  const [isToolAnalyzing, setIsToolAnalyzing] = useState(false)

  // 当前持有流式状态的请求；为 null 时没有任何请求可以写入
  const requestRef = useRef<HomeChatRequest | null>(null)

  // 是否是应用对话模式
  const isAppMode = !!selectedApp

  // 会话所属范围（身份 + 应用）与已同步的选中会话
  const scopeKey = `${identity}|${selectedApp?.id ?? ''}`
  const syncedRef = useRef<{ scope: string; target: string | null } | null>(
    null,
  )

  // 收回当前请求的归属：只终止本地订阅，保留已生成内容，不代表服务端已取消
  const detachRequest = useCallback(() => {
    const request = requestRef.current
    if (!request) return
    requestRef.current = null
    request.controller.abort()
    setIsStreaming(false)
    setStreamingContent('')
    setIsToolAnalyzing(false)
    const { assistantMessageId } = request
    if (assistantMessageId) {
      updateMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId && msg.isStreaming
            ? { ...msg, isStreaming: false }
            : msg,
        ),
      )
    }
  }, [updateMessages])

  // 接纳闸门保证同一时间只有一次发送；新请求接管前先收回残留的旧归属
  const claimRequest = useCallback((): HomeChatRequest => {
    detachRequest()
    const request = {
      controller: new AbortController(),
      assistantMessageId: null,
    }
    requestRef.current = request
    return request
  }, [detachRequest])

  // 选中会话、应用或身份变化时最后一次选择生效：收回旧请求、作废待定历史，
  // 清空后再加载目标，旧会话的消息不会出现在新的选中项下
  useEffect(() => {
    const target = selectedConversationId ?? null
    const synced = syncedRef.current
    if (synced?.scope === scopeKey && synced.target === target) return
    syncedRef.current = { scope: scopeKey, target }
    detachRequest()
    resetConversation()
    if (target) void loadHistory(target)
  }, [
    scopeKey,
    selectedConversationId,
    detachRequest,
    resetConversation,
    loadHistory,
  ])

  // 卸载时同样收回归属并作废待定历史；StrictMode 重新挂载时会重新同步
  useEffect(
    () => () => {
      syncedRef.current = null
      detachRequest()
      resetConversation()
    },
    [detachRequest, resetConversation],
  )

  // 发送消息 - 应用模式（参考探索页面的实现方式）
  // 核心思路：在流式开始时先添加空的 AI 消息，然后在流式过程中直接更新这条消息
  // 这样就不会出现重复渲染的问题
  const sendAppMessage = useCallback(
    async (inputValue: string) => {
      if (!inputValue.trim() || !selectedApp) return

      const owner = claimRequest()
      const ownsRequest = () => requestRef.current === owner
      const { signal } = owner.controller
      const userMessageContent = inputValue.trim()

      try {
        // 发送时捕获目标会话；选中会话未载入时 sendMessage 已拒绝
        let conversationId = conversationIdRef.current
        let currentMessages = messagesRef.current

        if (!conversationId) {
          // 新会话：创建并载入开场白，期间被新的选择取代则放弃本次发送
          const created = await createConversation(
            selectedApp.id,
            userMessageContent.slice(0, 50) +
              (userMessageContent.length > 50 ? '...' : ''),
          )
          if (!created || !ownsRequest()) return
          conversationId = created.id
          currentMessages = created.messages
          // 先登记为已同步，选中项随后变化时 effect 能认出这是本次发送建的会话
          syncedRef.current = { scope: scopeKey, target: created.id }
          onConversationIdChange?.(created.id)
        }

        // 创建用户消息
        const userMessage: ChatMessage = {
          id: `msg-${Date.now()}-user-${Math.random().toString(36).substr(2, 9)}`,
          role: 'user',
          content: userMessageContent,
          timestamp: new Date().toLocaleTimeString(),
        }

        // 创建空的 AI 消息（流式过程中只按这个 id 更新）
        const aiMessageId = `msg-${Date.now()}-ai-${Math.random().toString(36).substr(2, 9)}`
        const aiMessage: ChatMessage = {
          id: aiMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toLocaleTimeString(),
          references: [],
          thinking: '',
        }
        owner.assistantMessageId = aiMessageId

        // 添加用户消息和空的 AI 消息
        updateMessages([...currentMessages, userMessage, aiMessage])
        setIsStreaming(true)

        // 构建请求参数（只包含到用户消息，不包含空的 AI 消息）
        const requestMessages = [...currentMessages, userMessage].map(
          (msg) => ({
            role: msg.role,
            content: msg.content,
          }),
        )

        const response = await conversationAPI.completion(
          {
            conversation_id: conversationId,
            messages: requestMessages,
            quote: true,
          },
          { signal },
        )
        if (!ownsRequest()) return

        await assertSSEResponse(response)

        let streamState = createInitialStreamingAnswerState()

        await readSSEStream<SSEEnvelope>(response, {
          signal,
          onEvent: (data) => {
            // 归属已被收回（停止、切换、卸载）后晚到的增量一律丢弃
            if (!ownsRequest()) return
            const chunk = consumeStreamingAnswerChunk(streamState, data)
            streamState = chunk.nextState
            if (chunk.isDone) return

            const chunkData =
              chunk.payload && typeof chunk.payload === 'object'
                ? (chunk.payload as Record<string, unknown>)
                : null
            const newReferences = chunkData
              ? extractReferencesFromSSEData(chunkData)
              : []
            // 失败且无正文时用固定文案占位，不展示后端错误原文
            const failureNotice = getStreamingAnswerFailureNotice(streamState)
            const cleanContent =
              failureNotice === 'chat.stream.failed'
                ? t(failureNotice)
                : streamState.content
            const thinking = streamState.thinking

            // 只更新本次请求的 AI 消息，不再按"最后一条 assistant"定位
            updateMessages((prev) => {
              const index = prev.findIndex((msg) => msg.id === aiMessageId)
              if (index < 0) return prev
              const target = prev[index]
              // 只有当新的 references 有数据时才更新，否则保留之前的
              const existingReferences = target.references || []
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

              const sameContent = target.content === cleanContent
              const sameThinking = (target.thinking || '') === thinking
              const sameReferences = references === existingReferences
              if (sameContent && sameThinking && sameReferences) {
                return prev
              }

              const newMsgs = [...prev]
              newMsgs[index] = {
                ...target,
                content: cleanContent,
                references,
                thinking,
              }
              return newMsgs
            })
          },
        })
        if (!ownsRequest()) return
        const streamFailure = getStreamingAnswerFailureNotice(streamState)
        if (streamFailure === 'chat.stream.interrupted') {
          toast.error(t(streamFailure))
        }
      } catch (error) {
        // 已失去归属的请求不再报错，也不改写其他目标的消息
        if (!ownsRequest()) return
        console.error('Error sending app message:', error)
        toast.error(error instanceof Error ? error.message : '发送消息失败')
        // 更新本次请求的 AI 消息为错误消息
        const { assistantMessageId } = owner
        if (assistantMessageId) {
          updateMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: '抱歉，发生了错误，请重试。' }
                : msg,
            ),
          )
        }
      } finally {
        // 只有仍持有归属的请求才复位，不能清掉新请求的状态
        if (ownsRequest()) {
          requestRef.current = null
          setIsStreaming(false)
        }
      }
    },
    [
      selectedApp,
      scopeKey,
      onConversationIdChange,
      claimRequest,
      createConversation,
      conversationIdRef,
      messagesRef,
      updateMessages,
      t,
    ],
  )

  // 发送消息 - MCP 模式
  const sendMCPMessage = useCallback(
    async (inputValue: string) => {
      const owner = claimRequest()
      const ownsRequest = () => requestRef.current === owner

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
      owner.assistantMessageId = assistantMessageId

      const historyMessages = messagesRef.current.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      updateMessages((prev) => [...prev, userMessage, assistantMessage])
      setIsStreaming(true)
      setStreamingContent('')
      setIsToolAnalyzing(false)

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
          signal: owner.controller.signal,
          onState: (timelineState) => {
            if (!ownsRequest()) return
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
        if (!ownsRequest()) return
        console.error('Error sending message:', error)
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
      } finally {
        if (ownsRequest()) {
          requestRef.current = null
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
      }
    },
    [
      selectedModelId,
      selectedMCPIds,
      claimRequest,
      messagesRef,
      updateMessages,
    ],
  )

  // 发送消息（根据模式选择）。接纳在本次调用内同步判定：返回 false 表示拒绝，
  // 调用方应保留草稿；会话创建、历史准备与流式期间的再次提交都会被拒绝
  const { isPending: isSendPending, run: runSend } = useSubmitGate()
  const sendMessage = useCallback(
    (inputValue: string): Promise<void> | false => {
      if (!inputValue.trim() || isLoadingHistoryRef.current) return false
      if (!isAppMode && !selectedModelId) {
        toast.error(t('home.input.selectModelFirst'))
        return false
      }
      // 选中会话的历史没有载入（如加载失败）时不带错误历史发送，改为重新加载
      if (
        isAppMode &&
        selectedConversationId &&
        selectedConversationId !== conversationIdRef.current
      ) {
        if (!requestRef.current) void loadHistory(selectedConversationId)
        return false
      }
      return runSend(() =>
        isAppMode ? sendAppMessage(inputValue) : sendMCPMessage(inputValue),
      )
    },
    [
      isAppMode,
      selectedModelId,
      selectedConversationId,
      isLoadingHistoryRef,
      conversationIdRef,
      loadHistory,
      sendAppMessage,
      sendMCPMessage,
      runSend,
      t,
    ],
  )

  // 清空对话
  const clearMessages = useCallback(() => {
    detachRequest()
    resetConversation()
  }, [detachRequest, resetConversation])

  return {
    messages,
    isStreaming,
    streamingContent,
    streamingThinking,
    isToolAnalyzing,
    isLoadingHistory,
    isSendPending,
    isAppMode,
    currentConversationId,
    sendMessage,
    // 停止输出：只终止本地连接并保留已生成内容
    stopStreaming: detachRequest,
    clearMessages,
  }
}
