import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { systemAPI } from '@/api/system'

const deliveryTokenQueryKey = ['agent', 'delivery-token'] as const

const pickToken = (
  tokens:
    | Awaited<ReturnType<typeof systemAPI.getTokenList>>
    | undefined,
) => {
  const token = tokens?.find((item) => item.beta || item.token)
  return token?.beta || token?.token || ''
}

export function useAgentDeliveryToken(enabled = true) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: deliveryTokenQueryKey,
    queryFn: () => systemAPI.getTokenList(),
    enabled,
    staleTime: 60_000,
  })

  const mutation = useMutation({
    mutationFn: () =>
      systemAPI.createToken({
        name: 'Agent delivery token',
        description: 'Created for Agent Share / Publish / Webhook access',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: deliveryTokenQueryKey,
      })
    },
  })

  const ensureToken = async () => {
    const currentTokens = query.data || (await query.refetch()).data
    const current = pickToken(currentTokens)
    if (current) {
      return current
    }

    const created = await mutation.mutateAsync()
    return created.beta || created.token
  }

  return {
    token: pickToken(query.data),
    tokens: query.data || [],
    isLoading: query.isFetching,
    isCreating: mutation.isPending,
    isError: query.isError || mutation.isError,
    error: query.error || mutation.error,
    ensureToken,
    refetch: query.refetch,
  }
}
