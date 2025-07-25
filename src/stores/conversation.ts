import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Conversation, Message } from '@/types/api'

interface ConversationState {
  // 当前对话状态
  currentConversation: Conversation | null
  currentMessages: Message[]
  
  // 对话列表缓存
  conversations: Conversation[]
  
  // 输入状态
  inputMessage: string
  isTyping: boolean
  
  // 流式响应状态
  isStreaming: boolean
  streamingMessage: string
  
  // 选中状态
  selectedConversations: string[]
  
  // 搜索状态
  searchQuery: string
  searchResults: Conversation[]
  
  // 配置
  settings: {
    model: string
    temperature: number
    maxTokens: number
    systemPrompt: string
    enableAutoTitle: boolean
    enableAutoSave: boolean
  }
  
  // 动作
  setCurrentConversation: (conversation: Conversation | null) => void
  setCurrentMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  removeMessage: (messageId: string) => void
  
  setConversations: (conversations: Conversation[]) => void
  addConversation: (conversation: Conversation) => void
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => void
  removeConversation: (conversationId: string) => void
  
  setInputMessage: (message: string) => void
  setTyping: (typing: boolean) => void
  
  setStreaming: (streaming: boolean) => void
  setStreamingMessage: (message: string) => void
  appendStreamingMessage: (chunk: string) => void
  
  setSelectedConversations: (ids: string[]) => void
  toggleConversationSelection: (id: string) => void
  clearSelection: () => void
  
  setSearchQuery: (query: string) => void
  setSearchResults: (results: Conversation[]) => void
  
  updateSettings: (updates: Partial<ConversationState['settings']>) => void
  
  // 工具方法
  getConversationById: (id: string) => Conversation | undefined
  getMessagesByConversationId: (conversationId: string) => Message[]
  clearCurrentConversation: () => void
  resetStreamingState: () => void
}

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      // 初始状态
      currentConversation: null,
      currentMessages: [],
      conversations: [],
      inputMessage: '',
      isTyping: false,
      isStreaming: false,
      streamingMessage: '',
      selectedConversations: [],
      searchQuery: '',
      searchResults: [],
      settings: {
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt: '',
        enableAutoTitle: true,
        enableAutoSave: true,
      },

      // 设置当前对话
      setCurrentConversation: (conversation) => set({ 
        currentConversation: conversation,
        currentMessages: conversation ? get().getMessagesByConversationId(conversation.id) : []
      }),

      // 设置当前消息
      setCurrentMessages: (messages) => set({ currentMessages: messages }),

      // 添加消息
      addMessage: (message) => set((state) => ({
        currentMessages: [...state.currentMessages, message]
      })),

      // 更新消息
      updateMessage: (messageId, updates) => set((state) => ({
        currentMessages: state.currentMessages.map(msg =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        )
      })),

      // 删除消息
      removeMessage: (messageId) => set((state) => ({
        currentMessages: state.currentMessages.filter(msg => msg.id !== messageId)
      })),

      // 设置对话列表
      setConversations: (conversations) => set({ conversations }),

      // 添加对话
      addConversation: (conversation) => set((state) => ({
        conversations: [conversation, ...state.conversations]
      })),

      // 更新对话
      updateConversation: (conversationId, updates) => set((state) => ({
        conversations: state.conversations.map(conv =>
          conv.id === conversationId ? { ...conv, ...updates } : conv
        ),
        currentConversation: state.currentConversation?.id === conversationId
          ? { ...state.currentConversation, ...updates }
          : state.currentConversation
      })),

      // 删除对话
      removeConversation: (conversationId) => set((state) => ({
        conversations: state.conversations.filter(conv => conv.id !== conversationId),
        currentConversation: state.currentConversation?.id === conversationId
          ? null
          : state.currentConversation,
        currentMessages: state.currentConversation?.id === conversationId
          ? []
          : state.currentMessages
      })),

      // 设置输入消息
      setInputMessage: (message) => set({ inputMessage: message }),

      // 设置打字状态
      setTyping: (typing) => set({ isTyping: typing }),

      // 设置流式状态
      setStreaming: (streaming) => set({ isStreaming: streaming }),

      // 设置流式消息
      setStreamingMessage: (message) => set({ streamingMessage: message }),

      // 追加流式消息
      appendStreamingMessage: (chunk) => set((state) => ({
        streamingMessage: state.streamingMessage + chunk
      })),

      // 设置选中的对话
      setSelectedConversations: (ids) => set({ selectedConversations: ids }),

      // 切换对话选中状态
      toggleConversationSelection: (id) => set((state) => {
        const selected = state.selectedConversations
        const isSelected = selected.includes(id)
        return {
          selectedConversations: isSelected
            ? selected.filter(selectedId => selectedId !== id)
            : [...selected, id]
        }
      }),

      // 清除选择
      clearSelection: () => set({ selectedConversations: [] }),

      // 设置搜索查询
      setSearchQuery: (query) => set({ searchQuery: query }),

      // 设置搜索结果
      setSearchResults: (results) => set({ searchResults: results }),

      // 更新设置
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates }
      })),

      // 工具方法
      getConversationById: (id) => {
        return get().conversations.find(conv => conv.id === id)
      },

      getMessagesByConversationId: (conversationId) => {
        const conversation = get().getConversationById(conversationId)
        return conversation?.messages || []
      },

      clearCurrentConversation: () => set({
        currentConversation: null,
        currentMessages: [],
        inputMessage: '',
        isTyping: false,
        isStreaming: false,
        streamingMessage: ''
      }),

      resetStreamingState: () => set({
        isStreaming: false,
        streamingMessage: ''
      }),
    }),
    {
      name: 'conversation-storage',
      partialize: (state) => ({
        settings: state.settings,
        // 不持久化敏感的运行时状态
      }),
    }
  )
)