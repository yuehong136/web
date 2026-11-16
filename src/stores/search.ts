import { create } from 'zustand'

interface SearchUIState {
  // 设置面板可见性
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void
}

export const useSearchStore = create<SearchUIState>((set) => ({
  settingsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open }),
}))
