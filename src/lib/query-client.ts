import { QueryClient } from '@tanstack/react-query'

const queryConfig = {
  queries: {
    retry: (failureCount: number, error: any) => {
      // 不重试认证错误
      if (error?.status === 401 || error?.status === 403) {
        return false
      }
      // 最多重试2次
      return failureCount < 2
    },
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5分钟
    gcTime: 10 * 60 * 1000, // 10分钟 (原cacheTime)
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
  mutations: {
    retry: false,
    onError: (error: any) => {
      // 全局错误处理
      console.error('Query error:', error)
    },
  },
}

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
})
