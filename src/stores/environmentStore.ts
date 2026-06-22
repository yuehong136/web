// src/stores/environmentStore.ts
//
// 仅持有 API 环境的客户端 UI 态：当前选中的环境 id（持久化）。
// 服务器态（环境列表/详情/全局预设、CRUD、变量增删改、变量解析）统一走
// React Query，见 src/hooks/use-environment-request.ts。
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface EnvironmentState {
  selectedEnvironmentId: string | null
  selectEnvironment: (id: string | null) => void
}

export const useEnvironmentStore = create<EnvironmentState>()(
  persist(
    (set) => ({
      selectedEnvironmentId: null,
      selectEnvironment: (id) => set({ selectedEnvironmentId: id }),
    }),
    {
      name: 'environment-store',
      partialize: (state) => ({
        selectedEnvironmentId: state.selectedEnvironmentId,
      }),
    },
  ),
)
