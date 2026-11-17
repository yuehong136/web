import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { systemAPI } from '@/api/system'
import { agentQueryKeys } from '@/hooks/use-agent-query'

const pickToken = (
  tokens: Awaited<ReturnType<typeof systemAPI.getTokenList>> | undefined,
) => {
  return tokens?.[0]?.beta || ''
}

export function useAgentDeliveryToken(enabled = true) {
  const { t } = useTranslation()
  const query = useQuery({
    queryKey: agentQueryKeys.deliveryToken(),
    queryFn: () => systemAPI.getTokenList(),
    enabled,
    staleTime: 60_000,
  })

  const ensureToken = async () => {
    const currentTokens = query.data || (await query.refetch()).data
    const current = pickToken(currentTokens)
    if (current) {
      return current
    }

    if (!currentTokens?.length) {
      throw new Error(t('agent.share.noSystemToken'))
    }

    throw new Error(t('agent.share.systemTokenMissingBeta'))
  }

  return {
    token: pickToken(query.data),
    tokens: query.data || [],
    isLoading: query.isFetching,
    isCreating: false,
    isError: query.isError,
    error: query.error,
    ensureToken,
    refetch: query.refetch,
  }
}
