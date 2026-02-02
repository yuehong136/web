/**
 * Home Page Store
 * 
 * 管理首页的客户端状态，包括：
 * - 应用选择状态
 * - 技能选择状态
 * - 当前对话状态
 * - 模型选择状态
 */

import { create } from 'zustand'
import type { DialogApp } from '@/types/api'
import type { MCPServer } from '@/types/mcp'

export interface HomeState {
  // 应用选择
  selectedAppIds: string[]
  selectedApps: DialogApp[]
  
  // 技能选择（MCP）
  selectedMCPIds: string[]
  selectedMCPServers: MCPServer[]
  
  // 当前对话 ID（选择历史对话时设置，新建对话时为 null）
  selectedConversationId: string | null
  
  // 之前的模型 ID（用于取消选择应用后恢复）
  previousModelId: string
  
  // 当前选中的模型 ID
  selectedModelId: string
}

export interface HomeActions {
  // 选择应用（应用单选，选择时清空技能）
  selectApp: (app: DialogApp, conversationId?: string | null) => void
  
  // 移除应用
  removeApp: () => void
  
  // 开始新对话（保持当前应用，清空对话 ID）
  startNewConversation: () => void
  
  // 选择技能（技能多选，选择时清空应用）
  selectSkill: (server: MCPServer) => void
  
  // 移除技能
  removeSkill: (serverId: string) => void
  
  // 选择对话
  selectConversation: (conversationId: string | null) => void
  
  // 设置模型
  setSelectedModelId: (modelId: string) => void
  
  // 设置之前的模型
  setPreviousModelId: (modelId: string) => void
  
  // 重置所有状态
  reset: () => void
}

const initialState: HomeState = {
  selectedAppIds: [],
  selectedApps: [],
  selectedMCPIds: [],
  selectedMCPServers: [],
  selectedConversationId: null,
  previousModelId: '',
  selectedModelId: '',
}

export const useHomeStore = create<HomeState & HomeActions>((set, get) => ({
  ...initialState,
  
  selectApp: (app, conversationId = null) => {
    const state = get()
    
    // 如果已选中该应用，取消选择
    if (state.selectedAppIds.includes(app.id)) {
      set({
        selectedAppIds: [],
        selectedApps: [],
        selectedConversationId: null,
        // 恢复之前的模型
        selectedModelId: state.previousModelId || state.selectedModelId,
        previousModelId: '',
      })
      return
    }
    
    // 选择新应用时，保存当前模型（如果之前没有选应用）
    const previousModelId = state.selectedAppIds.length === 0 
      ? state.selectedModelId 
      : state.previousModelId
    
    set({
      // 清空技能选择
      selectedMCPIds: [],
      selectedMCPServers: [],
      // 设置应用（单选）
      selectedAppIds: [app.id],
      selectedApps: [app],
      // 设置对话 ID
      selectedConversationId: conversationId,
      // 保存之前的模型
      previousModelId,
      // 切换到应用绑定的模型
      selectedModelId: app.llm_id || state.selectedModelId,
    })
  },
  
  removeApp: () => {
    const state = get()
    set({
      selectedAppIds: [],
      selectedApps: [],
      selectedConversationId: null,
      // 恢复之前的模型
      selectedModelId: state.previousModelId || state.selectedModelId,
      previousModelId: '',
    })
  },
  
  startNewConversation: () => {
    // 保持当前应用选择，只清空对话 ID
    set({ selectedConversationId: null })
  },
  
  selectSkill: (server) => {
    const state = get()
    
    // 选择技能时，清空应用选择
    if (state.selectedAppIds.length > 0) {
      set({
        selectedAppIds: [],
        selectedApps: [],
        selectedConversationId: null,
        // 恢复之前的模型
        selectedModelId: state.previousModelId || state.selectedModelId,
        previousModelId: '',
      })
    }
    
    // 如果已选中该技能，取消选择
    if (state.selectedMCPIds.includes(server.id)) {
      set({
        selectedMCPIds: state.selectedMCPIds.filter(id => id !== server.id),
        selectedMCPServers: state.selectedMCPServers.filter(s => s.id !== server.id),
      })
    } else {
      // 添加技能（多选）
      set({
        selectedMCPIds: [...state.selectedMCPIds, server.id],
        selectedMCPServers: [...state.selectedMCPServers, server],
      })
    }
  },
  
  removeSkill: (serverId) => {
    const state = get()
    set({
      selectedMCPIds: state.selectedMCPIds.filter(id => id !== serverId),
      selectedMCPServers: state.selectedMCPServers.filter(s => s.id !== serverId),
    })
  },
  
  selectConversation: (conversationId) => {
    set({ selectedConversationId: conversationId })
  },
  
  setSelectedModelId: (modelId) => {
    set({ selectedModelId: modelId })
  },
  
  setPreviousModelId: (modelId) => {
    set({ previousModelId: modelId })
  },
  
  reset: () => {
    set(initialState)
  },
}))

// 选择器函数
export const useSelectedApps = () => useHomeStore(state => state.selectedApps)
export const useSelectedAppIds = () => useHomeStore(state => state.selectedAppIds)
export const useSelectedMCPServers = () => useHomeStore(state => state.selectedMCPServers)
export const useSelectedMCPIds = () => useHomeStore(state => state.selectedMCPIds)
export const useSelectedConversationId = () => useHomeStore(state => state.selectedConversationId)
export const useSelectedModelId = () => useHomeStore(state => state.selectedModelId)
