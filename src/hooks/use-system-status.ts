import { useQuery } from '@tanstack/react-query'
import { systemAPI } from '../api/system'
import { QUERY_KEYS } from '../constants'

export interface UseSystemStatusOptions {
  refetchInterval?: number
  enabled?: boolean
}

export const useSystemStatus = (options: UseSystemStatusOptions = {}) => {
  const {
    refetchInterval = 30000, // 默认30秒刷新一次
    enabled = true
  } = options

  return useQuery({
    queryKey: [QUERY_KEYS.SYSTEM_STATUS],
    queryFn: () => systemAPI.getStatus(),
    refetchInterval,
    enabled,
    staleTime: 10000, // 10秒内的数据被认为是新鲜的
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

// 手动刷新系统状态
export const useRefreshSystemStatus = () => {
  const { refetch } = useSystemStatus({ enabled: false })
  
  return refetch
}