import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Theme, getResolvedTheme } from '@/themes'
import i18n, {
  getCurrentLanguage,
  normalizeLocale,
  setProductLanguage,
} from '@/locales/i18n'
import type { Language } from '@/types'

export enum DesktopActivity {
  WORK = 'work',
  DISCOVER = 'discover',
  KNOWLEDGE = 'knowledge',
  BUILD = 'build',
  TOOLS = 'tools',
}

const DEFAULT_DESKTOP_SIDEBAR_WIDTH = 22
const MIN_DESKTOP_SIDEBAR_WIDTH = 16
const MAX_DESKTOP_SIDEBAR_WIDTH = 30
const UI_STORAGE_VERSION = 1

const normalizeDesktopSidebarWidth = (width: number) => {
  if (!Number.isFinite(width)) return DEFAULT_DESKTOP_SIDEBAR_WIDTH
  return Math.min(
    MAX_DESKTOP_SIDEBAR_WIDTH,
    Math.max(MIN_DESKTOP_SIDEBAR_WIDTH, width),
  )
}

interface PersistedUIState {
  theme: Theme
  language: Language
  sidebarCollapsed: boolean
  sidebarWidth: number
  desktopActivity: DesktopActivity
  desktopSidebarCollapsed: boolean
  desktopSidebarWidth: number
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const normalizeDesktopPreferences = (
  value: unknown,
): Pick<
  PersistedUIState,
  'desktopActivity' | 'desktopSidebarCollapsed' | 'desktopSidebarWidth'
> => {
  const record = isRecord(value) ? value : {}
  const desktopActivity = Object.values(DesktopActivity).includes(
    record.desktopActivity as DesktopActivity,
  )
    ? (record.desktopActivity as DesktopActivity)
    : DesktopActivity.WORK

  return {
    desktopActivity,
    desktopSidebarCollapsed:
      typeof record.desktopSidebarCollapsed === 'boolean'
        ? record.desktopSidebarCollapsed
        : false,
    desktopSidebarWidth: normalizeDesktopSidebarWidth(
      typeof record.desktopSidebarWidth === 'number'
        ? record.desktopSidebarWidth
        : DEFAULT_DESKTOP_SIDEBAR_WIDTH,
    ),
  }
}

const normalizePersistedUIState = (value: unknown): PersistedUIState => {
  const record = isRecord(value) ? value : {}
  const theme = Object.values(Theme).includes(record.theme as Theme)
    ? (record.theme as Theme)
    : Theme.SYSTEM

  return {
    theme,
    language: normalizeLocale(record.language) ?? getCurrentLanguage(),
    sidebarCollapsed:
      typeof record.sidebarCollapsed === 'boolean'
        ? record.sidebarCollapsed
        : false,
    sidebarWidth:
      typeof record.sidebarWidth === 'number' &&
      Number.isFinite(record.sidebarWidth)
        ? record.sidebarWidth
        : 256,
    ...normalizeDesktopPreferences(record),
  }
}

interface UIState {
  // 主题设置
  theme: Theme

  // 语言设置
  language: Language

  // 布局设置
  sidebarCollapsed: boolean
  sidebarWidth: number
  desktopActivity: DesktopActivity
  desktopSidebarCollapsed: boolean
  /** Desktop context panel width as a react-resizable-panels percentage. */
  desktopSidebarWidth: number

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
  setDesktopActivity: (activity: DesktopActivity) => void
  toggleDesktopSidebar: () => void
  setDesktopSidebarCollapsed: (collapsed: boolean) => void
  setDesktopSidebarWidth: (width: number) => void

  // 模态框管理
  openModal: (modalId: string) => void
  closeModal: (modalId: string) => void
  toggleModal: (modalId: string) => void

  // 加载状态管理
  setGlobalLoading: (loading: boolean, message?: string) => void

  // 通知管理
  addNotification: (
    notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>,
  ) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void

  // 工具方法
  getEffectiveTheme: () => 'light' | 'dark'
  isMobile: () => boolean
}

export const useUIStore = create<UIState>()(
  persist<UIState, [], [], PersistedUIState>(
    (set, get) => ({
      // 初始状态
      theme: Theme.SYSTEM,
      language: getCurrentLanguage(),
      sidebarCollapsed: false,
      sidebarWidth: 256,
      desktopActivity: DesktopActivity.WORK,
      desktopSidebarCollapsed: false,
      desktopSidebarWidth: DEFAULT_DESKTOP_SIDEBAR_WIDTH,
      modals: {},
      globalLoading: false,
      loadingMessage: '',
      notifications: [],

      // 设置主题
      setTheme: (theme) => {
        set({ theme })
        // 新的主题系统会自动处理DOM更新
      },

      // 设置语言
      setLanguage: (language) => {
        const nextLanguage = normalizeLocale(language) ?? getCurrentLanguage()
        set({ language: nextLanguage })
        void setProductLanguage(nextLanguage).then((resolvedLanguage) => {
          set({ language: resolvedLanguage })
        })
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

      setDesktopActivity: (desktopActivity) => set({ desktopActivity }),

      toggleDesktopSidebar: () =>
        set((state) => ({
          desktopSidebarCollapsed: !state.desktopSidebarCollapsed,
        })),

      setDesktopSidebarCollapsed: (desktopSidebarCollapsed) =>
        set({ desktopSidebarCollapsed }),

      setDesktopSidebarWidth: (desktopSidebarWidth) =>
        set({
          desktopSidebarWidth:
            normalizeDesktopSidebarWidth(desktopSidebarWidth),
        }),

      // 打开模态框
      openModal: (modalId) =>
        set((state) => ({
          modals: { ...state.modals, [modalId]: true },
        })),

      // 关闭模态框
      closeModal: (modalId) =>
        set((state) => ({
          modals: { ...state.modals, [modalId]: false },
        })),

      // 切换模态框
      toggleModal: (modalId) =>
        set((state) => ({
          modals: { ...state.modals, [modalId]: !state.modals[modalId] },
        })),

      // 设置全局加载状态
      setGlobalLoading: (loading, message = '') =>
        set({
          globalLoading: loading,
          loadingMessage: message,
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
          notifications: [...state.notifications, newNotification],
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
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      // 清除所有通知
      clearNotifications: () => set({ notifications: [] }),

      // 获取有效主题
      getEffectiveTheme: () => {
        return getResolvedTheme()
      },

      // 检查是否为移动端
      isMobile: () => {
        return window.innerWidth < 768
      },
    }),
    {
      name: 'ui-storage',
      version: UI_STORAGE_VERSION,
      migrate: (persistedState) => normalizePersistedUIState(persistedState),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...normalizePersistedUIState(persistedState),
      }),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarWidth: state.sidebarWidth,
        desktopActivity: state.desktopActivity,
        desktopSidebarCollapsed: state.desktopSidebarCollapsed,
        desktopSidebarWidth: state.desktopSidebarWidth,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 应用主题
          state.setTheme(state.theme)
          // 应用语言：优先使用统一 i18n 偏好，避免旧 ui-storage 覆盖产品语言。
          state.setLanguage(getCurrentLanguage())

          // 新的主题系统会自动处理系统主题变化
        }
      },
    },
  ),
)

i18n.on('languageChanged', (language) => {
  const nextLanguage = normalizeLocale(language)
  if (!nextLanguage) return

  const state = useUIStore.getState()
  if (state.language !== nextLanguage) {
    useUIStore.setState({ language: nextLanguage })
  }
})
