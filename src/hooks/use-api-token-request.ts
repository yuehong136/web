import {
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { systemAPI } from '@/api/system'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'
import type { SystemAPIToken } from '@/types/api'

export const apiTokenKeys = {
  all: ['system', 'tokens'] as const,
  list: () => [...apiTokenKeys.all, 'list'] as const,
  delete: () => [...apiTokenKeys.all, 'delete'] as const,
  regenerate: () => [...apiTokenKeys.all, 'regenerate'] as const,
}

/** Raised when the replacement token exists but the previous one is still active. */
export class ApiTokenRevokeError extends Error {
  constructor() {
    super('The previous API token was not revoked')
    this.name = 'ApiTokenRevokeError'
  }
}

export const useApiTokens = ({ enabled }: { enabled: boolean }) =>
  useQuery({
    queryKey: apiTokenKeys.list(),
    queryFn: () => systemAPI.getTokenList(),
    enabled,
    gcTime: 0,
  })

export const useDeleteApiToken = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: apiTokenKeys.delete(),
    mutationFn: ({ token }: Pick<SystemAPIToken, 'token'>) =>
      systemAPI.deleteToken(token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: apiTokenKeys.list() })
    },
  })
}

/**
 * The backend has no rotate endpoint, so create the replacement before
 * revoking the old token: a failed create leaves the existing key untouched.
 */
export const useRegenerateApiToken = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: apiTokenKeys.regenerate(),
    meta: { errorFeedback: MutationErrorFeedback.Local },
    mutationFn: async (apiKey: SystemAPIToken) => {
      const created = await systemAPI.createToken({
        name: apiKey.name,
        description: apiKey.description || null,
      })
      try {
        await systemAPI.deleteToken(apiKey.token)
      } catch {
        throw new ApiTokenRevokeError()
      }
      return created
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: apiTokenKeys.list() })
    },
  })
}

/** Tokens with an in-flight delete or regenerate, for per-row busy state. */
export const usePendingApiTokens = () =>
  new Set(
    useMutationState({
      filters: { mutationKey: apiTokenKeys.all, status: 'pending' },
      select: (mutation) =>
        (mutation.state.variables as Pick<SystemAPIToken, 'token'>).token,
    }),
  )
