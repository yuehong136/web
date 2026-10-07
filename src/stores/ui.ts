import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
// v2 dropped the unused theme, sidebarWidth, modal and loading fields.
const UI_STORAGE_VERSION = 2

const normalizeDesktopSidebarWidth = (width: number) => {
  if (!Number.isFinite(width)) return DEFAULT_DESKTOP_SIDEBAR_WIDTH
  return Math.min(
    MAX_DESKTOP_SIDEBAR_WIDTH,
    Math.max(MIN_DESKTOP_SIDEBAR_WIDTH, width),
  )
}

interface PersistedUIState {
  language: Language
  sidebarCollapsed: boolean
  contextSidebarCollapsed: boolean
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

  return {
    language: normalizeLocale(record.language) ?? getCurrentLanguage(),
    sidebarCollapsed:
      typeof record.sidebarCollapsed === 'boolean'
        ? record.sidebarCollapsed
        : false,
    contextSidebarCollapsed:
      typeof record.contextSidebarCollapsed === 'boolean'
        ? record.contextSidebarCollapsed
        : false,
    ...normalizeDesktopPreferences(record),
  }
}

interface UIState {
  // 语言设置
  language: Language

  // 布局设置
  sidebarCollapsed: boolean
  contextSidebarCollapsed: boolean
  desktopActivity: DesktopActivity
  desktopSidebarCollapsed: boolean
  /** Desktop context panel width as a react-resizable-panels percentage. */
  desktopSidebarWidth: number

  // 动作
  setLanguage: (language: Language) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setContextSidebarCollapsed: (collapsed: boolean) => void
  setDesktopActivity: (activity: DesktopActivity) => void
  toggleDesktopSidebar: () => void
  setDesktopSidebarCollapsed: (collapsed: boolean) => void
  setDesktopSidebarWidth: (width: number) => void
}

export const useUIStore = create<UIState>()(
  persist<UIState, [], [], PersistedUIState>(
    (set, get) => ({
      // 初始状态
      language: getCurrentLanguage(),
      sidebarCollapsed: false,
      contextSidebarCollapsed: false,
      desktopActivity: DesktopActivity.WORK,
      desktopSidebarCollapsed: false,
      desktopSidebarWidth: DEFAULT_DESKTOP_SIDEBAR_WIDTH,

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
      setContextSidebarCollapsed: (contextSidebarCollapsed) =>
        set({ contextSidebarCollapsed }),

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
        language: state.language,
        sidebarCollapsed: state.sidebarCollapsed,
        contextSidebarCollapsed: state.contextSidebarCollapsed,
        desktopActivity: state.desktopActivity,
        desktopSidebarCollapsed: state.desktopSidebarCollapsed,
        desktopSidebarWidth: state.desktopSidebarWidth,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 应用语言：优先使用统一 i18n 偏好，避免旧 ui-storage 覆盖产品语言。
          // 主题由 @/themes 与 public/theme-init.js 管理，不在此持久化。
          state.setLanguage(getCurrentLanguage())
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
