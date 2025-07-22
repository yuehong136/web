import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS, THEMES, LANGUAGES } from '../constants'
import type { Theme, Language } from '../types'

interface UIState {
  // 主题设置
  theme: Theme
  systemTheme: Theme
  
  // 语言设置
  language: Language
  
  // 布局设置
  sidebarCollapsed: boolean
  sidebarWidth: number
  
  // 模态框和弹窗状态
  modals: Record<string, boolean>
  
  // 加载状态
  globalLoading: boolean
  loadingMessage: string
  
  // 通知设置
  notifications: Array<{
    id: string
    type: 'info' | 'success' | 'warning' | 'error'
    title: string
    message: string
    duration?: number
    timestamp: number
  }>
  
  // 动作
  setTheme: (theme: Theme) => void
  setLanguage: (language: Language) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarWidth: (width: number) => void
  
  // 模态框管理
  openModal: (modalId: string) => void
  closeModal: (modalId: string) => void
  toggleModal: (modalId: string) => void
  
  // 加载状态管理
  setGlobalLoading: (loading: boolean, message?: string) => void
  
  // 通知管理
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  
  // 工具方法
  getEffectiveTheme: () => 'light' | 'dark'
  isMobile: () => boolean
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // 初始状态
      theme: 'system',
      systemTheme: 'light',
      language: 'zh-CN',
      sidebarCollapsed: false,
      sidebarWidth: 256,
      modals: {},
      globalLoading: false,
      loadingMessage: '',
      notifications: [],

      // 设置主题
      setTheme: (theme) => {
        set({ theme })
        
        // 更新文档类名
        const root = document.documentElement
        if (theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
          root.className = systemTheme
          set({ systemTheme })
        } else {
          root.className = theme
        }
      },

      // 设置语言
      setLanguage: (language) => {
        set({ language })
        document.documentElement.lang = language
      },

      // 切换侧边栏
      toggleSidebar: () => {
        const collapsed = !get().sidebarCollapsed
        set({ sidebarCollapsed: collapsed })
      },

      // 设置侧边栏折叠状态
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // 设置侧边栏宽度
      setSidebarWidth: (width) => set({ sidebarWidth: width }),

      // 打开模态框
      openModal: (modalId) => set((state) => ({
        modals: { ...state.modals, [modalId]: true }
      })),

      // 关闭模态框
      closeModal: (modalId) => set((state) => ({
        modals: { ...state.modals, [modalId]: false }
      })),

      // 切换模态框
      toggleModal: (modalId) => set((state) => ({
        modals: { ...state.modals, [modalId]: !state.modals[modalId] }
      })),

      // 设置全局加载状态
      setGlobalLoading: (loading, message = '') => set({ 
        globalLoading: loading, 
        loadingMessage: message 
      }),

      // 添加通知
      addNotification: (notification) => {
        const id = Math.random().toString(36).substr(2, 9)
        const newNotification = {
          ...notification,
          id,
          timestamp: Date.now(),
        }
        
        set((state) => ({
          notifications: [...state.notifications, newNotification]
        }))

        // 自动移除通知
        if (notification.duration !== 0) {
          setTimeout(() => {
            get().removeNotification(id)
          }, notification.duration || 4000)
        }

        return id
      },

      // 移除通知
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),

      // 清除所有通知
      clearNotifications: () => set({ notifications: [] }),

      // 获取有效主题
      getEffectiveTheme: () => {
        const { theme, systemTheme } = get()
        if (theme === 'system') {
          return systemTheme
        }
        return theme as 'light' | 'dark'
      },

      // 检查是否为移动端
      isMobile: () => {
        return window.innerWidth < 768
      },
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarWidth: state.sidebarWidth,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 应用主题
          state.setTheme(state.theme)
          // 应用语言
          state.setLanguage(state.language)
          
          // 监听系统主题变化
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
          const handleThemeChange = (e: MediaQueryListEvent) => {
            const systemTheme = e.matches ? 'dark' : 'light'
            state.systemTheme = systemTheme
            if (state.theme === 'system') {
              document.documentElement.className = systemTheme
            }
          }
          
          mediaQuery.addEventListener('change', handleThemeChange)
          
          // 设置初始系统主题
          state.systemTheme = mediaQuery.matches ? 'dark' : 'light'
        }
      },
    }
  )
)