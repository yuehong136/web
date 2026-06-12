import { useQuery } from '@tanstack/react-query'
import { systemAPI } from '@/api/system'

// system 域 query key 工厂（key 字符串沿用原 QUERY_KEYS.SYSTEM_* 值，形状不变）
export const systemKeys = {
  status: ['systemStatus'] as const,
  version: ['systemVersion'] as const,
}

export interface UseSystemStatusOptions {
  refetchInterval?: number
  enabled?: boolean
}

export const useSystemStatus = (options: UseSystemStatusOptions = {}) => {
  const {
    refetchInterval = 30000, // 默认30秒刷新一次
    enabled = true,
  } = options

  return useQuery({
    queryKey: systemKeys.status,
    queryFn: () => systemAPI.getStatus(),
    refetchInterval,
    enabled,
    staleTime: 10000, // 10秒内的数据被认为是新鲜的
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

// 手动刷新系统状态
export const useRefreshSystemStatus = () => {
  const { refetch } = useSystemStatus({ enabled: false })

  return refetch
}

// 获取系统版本信息
export const useSystemVersion = () => {
  return useQuery({
    queryKey: systemKeys.version,
    queryFn: () => systemAPI.getVersion(),
    staleTime: 5 * 60 * 1000, // 5分钟内的数据被认为是新鲜的，版本信息变化不频繁
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
