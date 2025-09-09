// src/stores/environmentStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { environmentAPI } from '@/api/environment'
import type { 
  Environment, 
  EnvironmentSummary, 
  EnvironmentCreate, 
  EnvironmentUpdate,
  EnvironmentVariableCreate,
  VariableResolveResponse,
  GlobalEnvironment 
} from '@/types/api'

interface EnvironmentState {
  // 状态
  environments: EnvironmentSummary[]
  currentEnvironment: Environment | null
  selectedEnvironmentId: string | null
  globalEnvironments: GlobalEnvironment[]
  isLoading: boolean
  
  // 基础操作
  loadEnvironments: () => Promise<void>
  loadEnvironment: (id: string) => Promise<void>
  selectEnvironment: (id: string) => Promise<void>
  
  // CRUD操作
  createEnvironment: (data: EnvironmentCreate) => Promise<Environment>
  updateEnvironment: (id: string, data: EnvironmentUpdate) => Promise<void>
  deleteEnvironment: (id: string) => Promise<void>
  duplicateEnvironment: (id: string, newName: string) => Promise<Environment>
  setDefaultEnvironment: (id: string) => Promise<void>
  
  // 变量操作
  addVariable: (environmentId: string, data: EnvironmentVariableCreate) => Promise<void>
  updateVariable: (environmentId: string, variableId: string, data: Partial<EnvironmentVariableCreate>) => Promise<void>
  deleteVariable: (environmentId: string, variableId: string) => Promise<void>
  batchUpdateVariables: (environmentId: string, variables: EnvironmentVariableCreate[]) => Promise<void>
  
  // 全局环境
  loadGlobalEnvironments: () => Promise<void>
  
  // 工具方法
  resolveText: (text: string, environmentId?: string) => string
  getVariableMap: (environmentId?: string) => Record<string, string>
  validateReferences: (text: string, environmentId?: string) => { isValid: boolean; missingVariables: string[] }
  resolveVariablesOnServer: (environmentId: string, text: string) => Promise<VariableResolveResponse>
  
  // 重置
  reset: () => void
}

export const useEnvironmentStore = create<EnvironmentState>()(
  persist(
    (set, get) => ({
      // 初始状态
      environments: [],
      currentEnvironment: null,
      selectedEnvironmentId: null,
      globalEnvironments: [],
      isLoading: false,

      // 基础操作
      loadEnvironments: async () => {
        set({ isLoading: true })
        try {
          const environments = await environmentAPI.getEnvironments()
          
          if (Array.isArray(environments)) {
            set({ environments })
            
            // 如果没有选中的环境，选择默认环境或第一个环境
            const { selectedEnvironmentId } = get()
            if (!selectedEnvironmentId && environments.length > 0) {
              const defaultEnv = environments.find(env => env.is_default) || environments[0]
              await get().selectEnvironment(defaultEnv.id)
            }
          } else {
            set({ environments: [] })
          }
        } catch (error) {
          console.error('Failed to load environments:', error)
          set({ environments: [] })
        } finally {
          set({ isLoading: false })
        }
      },

      loadEnvironment: async (id: string) => {
        try {
          const environment = await environmentAPI.getEnvironment(id)
          set({ currentEnvironment: environment })
        } catch (error) {
          console.error('Failed to load environment:', error)
          set({ currentEnvironment: null })
        }
      },

      selectEnvironment: async (id: string) => {
        set({ selectedEnvironmentId: id })
        // 总是尝试加载环境详情，包含变量信息
        try {
          await get().loadEnvironment(id)
        } catch (error) {
          console.error('Failed to load environment detail:', error)
          // 如果详情加载失败，清空当前环境
          set({ currentEnvironment: null })
        }
      },

      // CRUD操作
      createEnvironment: async (data: EnvironmentCreate) => {
        const environment = await environmentAPI.createEnvironment(data)
        await get().loadEnvironments()
        
        // 如果设置为默认环境，自动选择
        if (data.is_default) {
          await get().selectEnvironment(environment.id)
        }
        
        return environment
      },

      updateEnvironment: async (id: string, data: EnvironmentUpdate) => {
        await environmentAPI.updateEnvironment(id, data)
        await get().loadEnvironments()
        
        // 如果更新的是当前环境，重新加载
        const { selectedEnvironmentId } = get()
        if (selectedEnvironmentId === id) {
          await get().loadEnvironment(id)
        }
      },

      deleteEnvironment: async (id: string) => {
        await environmentAPI.deleteEnvironment(id)
        
        // 更新本地状态
        const { environments, selectedEnvironmentId } = get()
        const newEnvironments = environments.filter(env => env.id !== id)
        set({ environments: newEnvironments })
        
        // 如果删除的是当前选中的环境，选择其他环境
        if (selectedEnvironmentId === id) {
          const nextEnv = newEnvironments.find(env => env.is_default) || newEnvironments[0]
          if (nextEnv) {
            await get().selectEnvironment(nextEnv.id)
          } else {
            set({ selectedEnvironmentId: null, currentEnvironment: null })
          }
        }
      },

      duplicateEnvironment: async (id: string, newName: string) => {
        const duplicated = await environmentAPI.duplicateEnvironment(id, newName)
        await get().loadEnvironments()
        return duplicated
      },

      setDefaultEnvironment: async (id: string) => {
        await environmentAPI.setDefaultEnvironment(id)
        await get().loadEnvironments()
        // 自动选择新的默认环境
        await get().selectEnvironment(id)
      },

      // 变量操作
      addVariable: async (environmentId: string, data: EnvironmentVariableCreate) => {
        await environmentAPI.createVariable(environmentId, data)
        
        // 重新加载当前环境
        const { selectedEnvironmentId } = get()
        if (selectedEnvironmentId === environmentId) {
          await get().loadEnvironment(environmentId)
        }
      },

      updateVariable: async (environmentId: string, variableId: string, data: Partial<EnvironmentVariableCreate>) => {
        await environmentAPI.updateVariable(environmentId, variableId, data)
        
        // 重新加载当前环境
        const { selectedEnvironmentId } = get()
        if (selectedEnvironmentId === environmentId) {
          await get().loadEnvironment(environmentId)
        }
      },

      deleteVariable: async (environmentId: string, variableId: string) => {
        await environmentAPI.deleteVariable(environmentId, variableId)
        
        // 重新加载当前环境
        const { selectedEnvironmentId } = get()
        if (selectedEnvironmentId === environmentId) {
          await get().loadEnvironment(environmentId)
        }
      },

      batchUpdateVariables: async (environmentId: string, variables: EnvironmentVariableCreate[]) => {
        await environmentAPI.batchUpdateVariables(environmentId, variables)
        
        // 重新加载当前环境
        const { selectedEnvironmentId } = get()
        if (selectedEnvironmentId === environmentId) {
          await get().loadEnvironment(environmentId)
        }
      },

      // 全局环境
      loadGlobalEnvironments: async () => {
        try {
          const globalEnvironments = await environmentAPI.getGlobalEnvironments()
          set({ globalEnvironments })
        } catch (error) {
          console.error('Failed to load global environments:', error)
        }
      },

      // 工具方法
      resolveText: (text: string, environmentId?: string) => {
        const { currentEnvironment, selectedEnvironmentId } = get()
        const targetEnvId = environmentId || selectedEnvironmentId
        
        if (!targetEnvId || !currentEnvironment || currentEnvironment.id !== targetEnvId) {
          return text
        }
        
        const variableMap = environmentAPI.getVariableMap(currentEnvironment)
        return environmentAPI.resolveVariables(text, variableMap)
      },

      getVariableMap: (environmentId?: string) => {
        const { currentEnvironment, selectedEnvironmentId } = get()
        const targetEnvId = environmentId || selectedEnvironmentId
        
        if (!targetEnvId || !currentEnvironment || currentEnvironment.id !== targetEnvId) {
          return {}
        }
        
        return environmentAPI.getVariableMap(currentEnvironment)
      },

      validateReferences: (text: string, environmentId?: string) => {
        const { currentEnvironment, selectedEnvironmentId } = get()
        const targetEnvId = environmentId || selectedEnvironmentId
        
        if (!targetEnvId || !currentEnvironment || currentEnvironment.id !== targetEnvId) {
          return { isValid: true, missingVariables: [] }
        }
        
        const availableVariables = currentEnvironment.variables.map(v => v.key_name || v.key)
        return environmentAPI.validateVariableReferences(text, availableVariables)
      },

      resolveVariablesOnServer: async (environmentId: string, text: string) => {
        return await environmentAPI.resolveVariablesOnServer(environmentId, text)
      },

      // 重置
      reset: () => {
        set({
          environments: [],
          currentEnvironment: null,
          selectedEnvironmentId: null,
          globalEnvironments: [],
          isLoading: false
        })
      }
    }),
    {
      name: 'environment-store',
      partialize: (state) => ({
        selectedEnvironmentId: state.selectedEnvironmentId
      })
    }
  )
)