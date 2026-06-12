import { useQuery } from '@tanstack/react-query'
import { systemAPI } from '@/api/system'
import { agentQueryKeys } from '@/hooks/use-agent-query'

const pickToken = (
  tokens: Awaited<ReturnType<typeof systemAPI.getTokenList>> | undefined,
) => {
  return tokens?.[0]?.beta || ''
}

export function useAgentDeliveryToken(enabled = true) {
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
      throw new Error(
        '未检测到系统 API Token，请先在系统 Token 管理中创建 Token。',
      )
    }

    throw new Error(
      '第一条系统 API Token 缺少 beta，无法生成 RAGFlow 标准 Share 链接。',
    )
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
