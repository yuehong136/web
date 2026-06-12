import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/api/admin'
import type { CreateUserParams } from '../types'

// admin 域 query key 工厂（users 形状沿用原 ['admin','users']，不变）
export const adminKeys = {
  all: ['admin'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
}

export function useFetchAdminUsers() {
  return useQuery({
    queryKey: adminKeys.users(),
    queryFn: () => adminAPI.listUsers(),
    staleTime: 30_000,
    retry: false,
  })
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUserParams) => adminAPI.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
    },
  })
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (username: string) => adminAPI.deleteUser(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
    },
  })
}

export function useUpdateUserActivate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      username,
      activate,
    }: {
      username: string
      activate: boolean
    }) => adminAPI.updateUserActivate(username, activate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
    },
  })
}

export function useUpdateUserPassword() {
  return useMutation({
    mutationFn: ({
      username,
      newPassword,
    }: {
      username: string
      newPassword: string
    }) => adminAPI.updateUserPassword(username, newPassword),
  })
}

export function useGrantAdmin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (username: string) => adminAPI.grantAdmin(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
    },
  })
}

export function useRevokeAdmin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (username: string) => adminAPI.revokeAdmin(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
    },
  })
}
