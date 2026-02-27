import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/api/admin'
import type { CreateUserParams } from '../types'

const QUERY_KEY = ['admin', 'users']

export function useFetchAdminUsers() {
  return useQuery({
    queryKey: QUERY_KEY,
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (username: string) => adminAPI.deleteUser(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateUserActivate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ username, activate }: { username: string; activate: boolean }) =>
      adminAPI.updateUserActivate(username, activate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateUserPassword() {
  return useMutation({
    mutationFn: ({ username, newPassword }: { username: string; newPassword: string }) =>
      adminAPI.updateUserPassword(username, newPassword),
  })
}

export function useGrantAdmin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (username: string) => adminAPI.grantAdmin(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useRevokeAdmin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (username: string) => adminAPI.revokeAdmin(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
