import { create } from 'zustand'

interface SearchUIState {
  // 设置面板可见性
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void

  // 列表页视图模式
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void
}

export const useSearchStore = create<SearchUIState>((set) => ({
  settingsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open }),

  viewMode: 'grid',
  setViewMode: (mode) => set({ viewMode: mode }),
}))
