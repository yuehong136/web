import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Theme,
  getTheme,
  setTheme as setAppearanceMode,
  subscribeAppearance,
} from '@/themes'
import i18n, {
  getProductLanguage,
  subscribeProductLanguage,
  normalizeLocale,
  setProductLanguage,
} from '@/locales/i18n'
import type { Language } from '@/types'
import { toast } from '@/lib/toast'

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
// v2 dropped the unused sidebarWidth, modal and loading fields; theme and
// language mirror their owners and are never persisted here.
const UI_STORAGE_VERSION = 2

const normalizeDesktopSidebarWidth = (width: number) => {
  if (!Number.isFinite(width)) return DEFAULT_DESKTOP_SIDEBAR_WIDTH
  return Math.min(
    MAX_DESKTOP_SIDEBAR_WIDTH,
    Math.max(MIN_DESKTOP_SIDEBAR_WIDTH, width),
  )
}

interface PersistedUIState {
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
  // 主题设置
  theme: Theme

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
  setTheme: (theme: Theme) => void
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
      theme: getTheme(),
      language: getProductLanguage(),
      sidebarCollapsed: false,
      contextSidebarCollapsed: false,
      desktopActivity: DesktopActivity.WORK,
      desktopSidebarCollapsed: false,
      desktopSidebarWidth: DEFAULT_DESKTOP_SIDEBAR_WIDTH,

      // 设置主题
      setTheme: (theme) => {
        setAppearanceMode(theme)
        set({ theme: getTheme() })
      },

      // 设置语言
      setLanguage: (language) => {
        const nextLanguage = normalizeLocale(language) ?? getProductLanguage()
        void setProductLanguage(nextLanguage).catch(() => {
          toast.error(i18n.t('common.languageChangeFailed'))
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
        sidebarCollapsed: state.sidebarCollapsed,
        contextSidebarCollapsed: state.contextSidebarCollapsed,
        desktopActivity: state.desktopActivity,
        desktopSidebarCollapsed: state.desktopSidebarCollapsed,
        desktopSidebarWidth: state.desktopSidebarWidth,
      }),
    },
  ),
)

// Mirrors are updated only from the owners of each persisted preference.
subscribeAppearance(() => {
  const theme = getTheme()
  if (useUIStore.getState().theme !== theme) useUIStore.setState({ theme })
})
subscribeProductLanguage((language) => {
  if (useUIStore.getState().language !== language)
    useUIStore.setState({ language })
})
