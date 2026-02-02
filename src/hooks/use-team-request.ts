/**
 * 团队管理 Request Hooks
 * 使用 TanStack Query 管理团队相关的服务器状态
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamAPI } from '@/api/team'
import type {
  TeamMember,
  JoinedTeam,
} from '@/types/team'

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
// 注意：此接口只有团队 owner 才能调用（后端会验证 current_user.id == tenantId）
export const useFetchTeamMembers = (tenantId?: string) => {
  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: teamKeys.memberList(tenantId || ''),
    queryFn: async () => {
      if (!tenantId) return []
      // ragflow 后端直接返回数组，不需要包装
      const response = await teamAPI.listTeamMembers(tenantId)
      return response
    },
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return {
    // ragflow 后端直接返回 TeamMember[]，不是 { users: [...] }
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
      // ragflow 后端直接返回数组，不需要包装
      const response = await teamAPI.listJoinedTeams()
      return response
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return {
    // ragflow 后端直接返回 JoinedTeam[]，不是 { tenants: [...] }
    joinedTeams: (data ?? []) as JoinedTeam[],
    isLoading: isFetching,
    isError,
    error,
    refetch,
  }
}

// 邀请成员
export const useInviteMember = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async ({ tenantId, email }: { tenantId: string; email: string }) => {
      await teamAPI.inviteMember(tenantId, email)
    },
    onSuccess: (_, variables) => {
      // 邀请成功后，刷新成员列表
      queryClient.invalidateQueries({ queryKey: teamKeys.memberList(variables.tenantId) })
    },
  })

  return {
    inviteMember: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  }
}

// 移除成员
export const useRemoveMember = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async ({ tenantId, userId }: { tenantId: string; userId: string }) => {
      await teamAPI.removeMember(tenantId, userId)
    },
    onSuccess: (_, variables) => {
      // 移除成功后，刷新成员列表
      queryClient.invalidateQueries({ queryKey: teamKeys.memberList(variables.tenantId) })
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
    mutationFn: async (tenantId: string) => {
      await teamAPI.acceptInvitation(tenantId)
    },
    onSuccess: () => {
      // 接受邀请后，刷新已加入团队列表
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
    mutationFn: async ({ tenantId, userId }: { tenantId: string; userId: string }) => {
      await teamAPI.rejectInvitation(tenantId, userId)
    },
    onSuccess: () => {
      // 拒绝邀请后，刷新已加入团队列表
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
