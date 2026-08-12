/**
 * 团队管理 Request Hooks
 * 使用 TanStack Query 管理团队相关的服务器状态
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamAPI } from '@/api/team'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'
import type { TeamMember, JoinedTeam, BatchInviteResponse } from '@/types/team'

// Query Keys 统一管理
export const teamKeys = {
  all: ['team'] as const,
  tenantInfo: () => [...teamKeys.all, 'tenant-info'] as const,
  members: () => [...teamKeys.all, 'members'] as const,
  memberList: (tenantId: string) => [...teamKeys.members(), tenantId] as const,
  joinedTeams: () => [...teamKeys.all, 'joined-teams'] as const,
}

// 获取当前租户信息
export const useFetchTenantInfo = () => {
  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: teamKeys.tenantInfo(),
    queryFn: async () => {
      const response = await teamAPI.getTenantInfo()
      return response
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return {
    tenantInfo: data ?? null,
    isLoading: isFetching,
    isError,
    error,
    refetch,
  }
}

// 获取团队成员列表
// 注意：owner 和 admin 均可调用此接口（后端通过 require_member_manager 校验）
export const useFetchTeamMembers = (tenantId?: string) => {
  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: teamKeys.memberList(tenantId || ''),
    queryFn: async () => {
      if (!tenantId) return []
      const response = await teamAPI.listTeamMembers(tenantId)
      return response
    },
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return {
    members: (data ?? []) as TeamMember[],
    isLoading: isFetching,
    isError,
    error,
    refetch,
  }
}

// 获取已加入的团队列表
// 返回当前用户加入的所有团队（包括自己的团队和被邀请加入的团队）
export const useFetchJoinedTeams = () => {
  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: teamKeys.joinedTeams(),
    queryFn: async () => {
      const response = await teamAPI.listJoinedTeams()
      return response
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return {
    joinedTeams: (data ?? []) as JoinedTeam[],
    isLoading: isFetching,
    isError,
    error,
    refetch,
  }
}

// 邀请单个成员
export const useInviteMember = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async ({
      tenantId,
      email,
    }: {
      tenantId: string
      email: string
    }) => {
      await teamAPI.inviteMember(tenantId, email)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: teamKeys.memberList(variables.tenantId),
      })
    },
  })

  return {
    inviteMember: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  }
}

// 批量邀请成员
export const useBatchInviteMembers = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    meta: { errorFeedback: MutationErrorFeedback.Local },
    mutationFn: async ({
      tenantId,
      emails,
    }: {
      tenantId: string
      emails: string[]
    }): Promise<BatchInviteResponse> => {
      return await teamAPI.batchInviteMembers(tenantId, emails)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: teamKeys.memberList(variables.tenantId),
      })
    },
  })

  return {
    batchInvite: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  }
}

// 更新成员角色（仅 owner 可调用）
export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    meta: { errorFeedback: MutationErrorFeedback.Local },
    mutationFn: async ({
      tenantId,
      userId,
      role,
    }: {
      tenantId: string
      userId: string
      role: 'admin' | 'normal'
    }) => {
      return await teamAPI.updateMemberRole(tenantId, userId, role)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: teamKeys.memberList(variables.tenantId),
      })
    },
  })

  return {
    updateRole: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  }
}

// 移除成员
export const useRemoveMember = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    meta: { errorFeedback: MutationErrorFeedback.Local },
    mutationFn: async ({
      tenantId,
      userId,
    }: {
      tenantId: string
      userId: string
    }) => {
      await teamAPI.removeMember(tenantId, userId)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: teamKeys.memberList(variables.tenantId),
      })
    },
  })

  return {
    removeMember: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  }
}

// 接受邀请
export const useAcceptInvitation = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    meta: { errorFeedback: MutationErrorFeedback.Local },
    mutationFn: async (tenantId: string) => {
      await teamAPI.acceptInvitation(tenantId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.joinedTeams() })
    },
  })

  return {
    acceptInvitation: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  }
}

// 拒绝邀请
export const useRejectInvitation = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    meta: { errorFeedback: MutationErrorFeedback.Local },
    mutationFn: async ({
      tenantId,
      userId,
    }: {
      tenantId: string
      userId: string
    }) => {
      await teamAPI.rejectInvitation(tenantId, userId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.joinedTeams() })
    },
  })

  return {
    rejectInvitation: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  }
}
