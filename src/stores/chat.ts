import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiClient } from '@/api/client'
import { generateId } from '@/lib/utils'
import type { 
  ConversationInfo, 
  MessageInfo, 
  ConversationCreateRequest,
  MessageCreateRequest 
} from '../types/api'

interface ChatState {
  // 状态
  conversations: ConversationInfo[]
  currentConversation: ConversationInfo | null
  messages: MessageInfo[]
  isLoading: boolean
  isStreaming: boolean
  
  // 对话管理
  loadConversations: () => Promise<void>
  createConversation: (data?: Partial<ConversationCreateRequest>) => Promise<ConversationInfo>
  selectConversation: (conversationId: string) => Promise<void>
  updateConversation: (conversationId: string, data: Partial<ConversationInfo>) => Promise<void>
  deleteConversation: (conversationId: string) => Promise<void>
  
  // 消息管理
  loadMessages: (conversationId: string) => Promise<void>
  sendMessage: (content: string, attachments?: any[]) => Promise<void>
  regenerateMessage: (messageId: string) => Promise<void>
  stopStreaming: () => void
  
  // 工具方法
  clearChat: () => void
  setLoading: (loading: boolean) => void
  setStreaming: (streaming: boolean) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // 初始状态
      conversations: [],
      currentConversation: null,
      messages: [],
      isLoading: false,
      isStreaming: false,

      // 加载对话列表
      loadConversations: async () => {
        try {
          set({ isLoading: true })
          const response = await apiClient.get<{
            conversations: ConversationInfo[]
          }>('/conversations')
          set({ 
            conversations: response.data.conversations,
            isLoading: false 
          })
        } catch (error) {
          console.error('Failed to load conversations:', error)
          set({ isLoading: false })
        }
      },

      // 创建新对话
      createConversation: async (data = {}) => {
        try {
          const conversationData: ConversationCreateRequest = {
            title: data.title || '新对话',
            knowledgeBaseIds: data.knowledgeBaseIds || [],
            systemPrompt: data.systemPrompt,
            model: data.model || 'gpt-4',
            temperature: data.temperature || 0.7,
            maxTokens: data.maxTokens || 2048,
            ...data
          }

          const response = await apiClient.post<{
            conversation: ConversationInfo
          }>('/conversations', conversationData)

          const newConversation = response.data.conversation
          
          set(state => ({
            conversations: [newConversation, ...state.conversations],
            currentConversation: newConversation,
            messages: []
          }))

          return newConversation
        } catch (error) {
          console.error('Failed to create conversation:', error)
          // 如果API失败，创建本地临时对话
          const tempConversation: ConversationInfo = {
            id: generateId(),
            title: data.title || '新对话',
            knowledgeBaseIds: data.knowledgeBaseIds || [],
            systemPrompt: data.systemPrompt,
            model: data.model || 'gpt-4',
            temperature: data.temperature || 0.7,
            maxTokens: data.maxTokens || 2048,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messageCount: 0
          }
          
          set(state => ({
            conversations: [tempConversation, ...state.conversations],
            currentConversation: tempConversation,
            messages: []
          }))

          return tempConversation
        }
      },

      // 选择对话
      selectConversation: async (conversationId: string) => {
        const conversation = get().conversations.find(c => c.id === conversationId)
        if (!conversation) return

        set({ currentConversation: conversation })
        await get().loadMessages(conversationId)
      },

      // 更新对话
      updateConversation: async (conversationId: string, data: Partial<ConversationInfo>) => {
        try {
          const response = await apiClient.put<{
            conversation: ConversationInfo
          }>(`/conversations/${conversationId}`, data)

          const updatedConversation = response.data.conversation

          set(state => ({
            conversations: state.conversations.map(c =>
              c.id === conversationId ? updatedConversation : c
            ),
            currentConversation: state.currentConversation?.id === conversationId
              ? updatedConversation
              : state.currentConversation
          }))
        } catch (error) {
          console.error('Failed to update conversation:', error)
          // 本地更新
          set(state => ({
            conversations: state.conversations.map(c =>
              c.id === conversationId ? { ...c, ...data } : c
            ),
            currentConversation: state.currentConversation?.id === conversationId
              ? { ...state.currentConversation, ...data }
              : state.currentConversation
          }))
        }
      },

      // 删除对话
      deleteConversation: async (conversationId: string) => {
        try {
          await apiClient.delete(`/conversations/${conversationId}`)
        } catch (error) {
          console.error('Failed to delete conversation:', error)
        }

        set(state => {
          const newConversations = state.conversations.filter(c => c.id !== conversationId)
          const newCurrentConversation = state.currentConversation?.id === conversationId
            ? null
            : state.currentConversation

          return {
            conversations: newConversations,
            currentConversation: newCurrentConversation,
            messages: newCurrentConversation ? state.messages : []
          }
        })
      },

      // 加载消息
      loadMessages: async (conversationId: string) => {
        try {
          set({ isLoading: true })
          const response = await apiClient.get<{
            messages: MessageInfo[]
          }>(`/conversations/${conversationId}/messages`)
          
          set({ 
            messages: response.data.messages,
            isLoading: false 
          })
        } catch (error) {
          console.error('Failed to load messages:', error)
          set({ 
            messages: [],
            isLoading: false 
          })
        }
      },

      // 发送消息
      sendMessage: async (content: string, attachments = []) => {
        const { currentConversation } = get()
        if (!currentConversation) return

        // 创建用户消息
        const userMessage: MessageInfo = {
          id: generateId(),
          conversationId: currentConversation.id,
          role: 'user',
          content,
          attachments,
          createdAt: new Date().toISOString()
        }

        // 添加用户消息到界面
        set(state => ({
          messages: [...state.messages, userMessage],
          isStreaming: true
        }))

        try {
          // 创建助手消息占位符
          const assistantMessage: MessageInfo = {
            id: generateId(),
            conversationId: currentConversation.id,
            role: 'assistant',
            content: '',
            createdAt: new Date().toISOString()
          }

          set(state => ({
            messages: [...state.messages, assistantMessage]
          }))

          // 发送消息并处理流式响应
          const messageData: MessageCreateRequest = {
            content,
            attachments,
            stream: true
          }

          // 使用SSE处理流式响应
          const eventSource = apiClient.createEventSource(
            `/conversations/${currentConversation.id}/messages`,
            {
              onMessage: (data) => {
                if (data.type === 'message_delta') {
                  // 更新助手消息内容
                  set(state => ({
                    messages: state.messages.map(msg =>
                      msg.id === assistantMessage.id
                        ? { ...msg, content: msg.content + (data.content || '') }
                        : msg
                    )
                  }))
                } else if (data.type === 'message_complete') {
                  // 消息完成
                  set({ isStreaming: false })
                  eventSource.close()
                  
                  // 更新对话标题（如果是第一条消息）
                  if (get().messages.filter(m => m.role === 'user').length === 1) {
                    const title = content.slice(0, 50) + (content.length > 50 ? '...' : '')
                    get().updateConversation(currentConversation.id, { title })
                  }
                }
              },
              onError: (error) => {
                console.error('SSE error:', error)
                set({ isStreaming: false })
                eventSource.close()
              }
            }
          )

          // 实际发送消息到服务器（POST请求）
          await apiClient.post(
            `/conversations/${currentConversation.id}/messages`,
            messageData
          )

        } catch (error) {
          console.error('Failed to send message:', error)
          set({ isStreaming: false })
          
          // 模拟AI回复（在没有后端时）
          setTimeout(() => {
            const mockResponse: MessageInfo = {
              id: generateId(),
              conversationId: currentConversation.id,
              role: 'assistant',
              content: `这是对"${content}"的模拟回复。当前还没有连接到实际的AI服务，这只是一个演示界面。`,
              createdAt: new Date().toISOString()
            }

            set(state => ({
              messages: [...state.messages, mockResponse],
              isStreaming: false
            }))
          }, 1000)
        }
      },

      // 重新生成消息
      regenerateMessage: async (messageId: string) => {
        try {
          set({ isStreaming: true })
          // TODO: 实现重新生成逻辑
          await apiClient.post(`/messages/${messageId}/regenerate`)
        } catch (error) {
          console.error('Failed to regenerate message:', error)
          set({ isStreaming: false })
        }
      },

      // 停止流式生成
      stopStreaming: () => {
        set({ isStreaming: false })
        // TODO: 实际停止SSE连接
      },

      // 清空聊天
      clearChat: () => {
        set({
          currentConversation: null,
          messages: [],
          isStreaming: false
        })
      },

      // 设置加载状态
      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      // 设置流式状态
      setStreaming: (streaming: boolean) => {
        set({ isStreaming: streaming })
      },
    }),
    {
      name: 'chat-storage',
      // 只持久化对话列表和当前对话
      partialize: (state) => ({
        conversations: state.conversations,
        currentConversation: state.currentConversation,
      }),
    }
  )
)