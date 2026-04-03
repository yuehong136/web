/**
 * 团队管理 Store
 * 仅存储 UI 状态，不存储 API 数据（遵循 TanStack Query 模式）
 */

import { create } from 'zustand'
import type { BatchInviteResponse } from '@/types/team'

export type TeamViewMode = 'grid' | 'list'
export type TeamActiveTab = 'my-team' | 'joined-teams'
export type TimeFormat = 'detailed' | 'compact' | 'relative'

export interface ConfirmDialogState {
  open: boolean
  type: 'remove' | 'leave' | 'change-role' | null
  target: {
    id: string
    name: string
  } | null
  // 角色变更专用
  roleChangeInfo?: {
    newRole: 'admin' | 'normal'
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

  // 当前管理的团队 ID（团队管理 tab 的团队选择器）
  selectedManagedTenantId: string | null
  setSelectedManagedTenantId: (id: string | null) => void

  // 邀请对话框状态
  inviteDialogOpen: boolean
  setInviteDialogOpen: (open: boolean) => void

  // 批量邀请结果
  batchInviteResults: BatchInviteResponse | null
  setBatchInviteResults: (results: BatchInviteResponse | null) => void

  // 确认对话框状态
  confirmDialog: ConfirmDialogState
  openConfirmDialog: (
    type: 'remove' | 'leave' | 'change-role',
    target: { id: string; name: string },
    roleChangeInfo?: { newRole: 'admin' | 'normal' }
  ) => void
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
  selectedManagedTenantId: null as string | null,
  inviteDialogOpen: false,
  batchInviteResults: null as BatchInviteResponse | null,
  confirmDialog: {
    open: false,
    type: null,
    target: null,
    roleChangeInfo: null,
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
  setSelectedManagedTenantId: (id) => set({ selectedManagedTenantId: id }),
  setInviteDialogOpen: (open) => set({ inviteDialogOpen: open }),
  setBatchInviteResults: (results) => set({ batchInviteResults: results }),

  openConfirmDialog: (type, target, roleChangeInfo) =>
    set({
      confirmDialog: {
        open: true,
        type,
        target,
        roleChangeInfo: roleChangeInfo ?? null,
      },
    }),

  closeConfirmDialog: () =>
    set({
      confirmDialog: {
        open: false,
        type: null,
        target: null,
        roleChangeInfo: null,
      },
    }),

  reset: () => set(initialState),
}))
