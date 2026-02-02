/**
 * 团队管理 Store
 * 仅存储 UI 状态，不存储 API 数据（遵循 TanStack Query 模式）
 */

import { create } from 'zustand'

export type TeamViewMode = 'grid' | 'list'
export type TeamActiveTab = 'my-team' | 'joined-teams'
export type TimeFormat = 'detailed' | 'compact' | 'relative'

export interface ConfirmDialogState {
  open: boolean
  type: 'remove' | 'leave' | null
  target: {
    id: string
    name: string
  } | null
}

interface TeamUIState {
  // 我的团队视图模式
  viewMode: TeamViewMode
  setViewMode: (mode: TeamViewMode) => void

  // 已加入团队视图模式
  joinedTeamsViewMode: TeamViewMode
  setJoinedTeamsViewMode: (mode: TeamViewMode) => void

  // 当前激活的 Tab
  activeTab: TeamActiveTab
  setActiveTab: (tab: TeamActiveTab) => void

  // 搜索查询
  memberSearchQuery: string
  setMemberSearchQuery: (query: string) => void
  teamSearchQuery: string
  setTeamSearchQuery: (query: string) => void

  // 时间格式
  timeFormat: TimeFormat
  setTimeFormat: (format: TimeFormat) => void

  // 邀请对话框状态
  inviteDialogOpen: boolean
  setInviteDialogOpen: (open: boolean) => void

  // 确认对话框状态
  confirmDialog: ConfirmDialogState
  openConfirmDialog: (type: 'remove' | 'leave', target: { id: string; name: string }) => void
  closeConfirmDialog: () => void

  // 重置所有状态
  reset: () => void
}

const initialState = {
  viewMode: 'grid' as TeamViewMode,
  joinedTeamsViewMode: 'grid' as TeamViewMode,
  activeTab: 'my-team' as TeamActiveTab,
  memberSearchQuery: '',
  teamSearchQuery: '',
  timeFormat: 'detailed' as TimeFormat,
  inviteDialogOpen: false,
  confirmDialog: {
    open: false,
    type: null,
    target: null,
  } as ConfirmDialogState,
}

export const useTeamStore = create<TeamUIState>()((set) => ({
  ...initialState,

  setViewMode: (mode) => set({ viewMode: mode }),
  setJoinedTeamsViewMode: (mode) => set({ joinedTeamsViewMode: mode }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setMemberSearchQuery: (query) => set({ memberSearchQuery: query }),
  setTeamSearchQuery: (query) => set({ teamSearchQuery: query }),
  setTimeFormat: (format) => set({ timeFormat: format }),
  setInviteDialogOpen: (open) => set({ inviteDialogOpen: open }),

  openConfirmDialog: (type, target) =>
    set({
      confirmDialog: {
        open: true,
        type,
        target,
      },
    }),

  closeConfirmDialog: () =>
    set({
      confirmDialog: {
        open: false,
        type: null,
        target: null,
      },
    }),

  reset: () => set(initialState),
}))
