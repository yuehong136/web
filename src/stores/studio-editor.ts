import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type EditorTab = 'prompt' | 'knowledge' | 'model' | 'experience'
interface EditorPreferences {
  tab: EditorTab
  narrowView: 'edit' | 'preview'
  editSize: number
  setTab: (tab: EditorTab) => void
  setNarrowView: (view: 'edit' | 'preview') => void
  setEditSize: (size: number) => void
}

// This store holds layout preferences only. No drafts, credentials or conversations.
export const useStudioEditorPreferences = create<EditorPreferences>()(
  persist(
    (set) => ({
      tab: 'prompt',
      narrowView: 'edit',
      editSize: 55,
      setTab: (tab) => set({ tab }),
      setNarrowView: (narrowView) => set({ narrowView }),
      setEditSize: (editSize) =>
        set({ editSize: Math.min(80, Math.max(20, editSize)) }),
    }),
    {
      name: 'studio-create-app-layout-v3',
      version: 1,
      partialize: ({ tab, narrowView, editSize }) => ({
        tab,
        narrowView,
        editSize,
      }),
    },
  ),
)
