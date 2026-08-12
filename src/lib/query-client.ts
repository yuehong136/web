import { MutationCache, QueryClient } from '@tanstack/react-query'
import i18n from '@/locales/i18n'
import { toast } from '@/lib/toast'
import {
  getMutationErrorNotice,
  MutationErrorFeedback,
  type MutationErrorNotice,
} from '@/lib/mutation-error-feedback'

const queryConfig = {
  queries: {
    retry: (failureCount: number, error: unknown) => {
      // 不重试认证错误
      if (
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        (error.status === 401 || error.status === 403)
      ) {
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
  },
}

export type MutationErrorNotifier = (notice: MutationErrorNotice) => void

export interface CreateQueryClientOptions {
  notifyMutationError?: MutationErrorNotifier
}

const defaultMutationErrorNotifier: MutationErrorNotifier = (notice) => {
  toast.error(i18n.t(notice.messageKey), { id: notice.toastId })
}

export const createQueryClient = ({
  notifyMutationError = defaultMutationErrorNotifier,
}: CreateQueryClientOptions = {}) =>
  new QueryClient({
    defaultOptions: queryConfig,
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        const feedback =
          mutation.meta?.errorFeedback ??
          (mutation.options.onError
            ? MutationErrorFeedback.Local
            : MutationErrorFeedback.Global)

        if (feedback !== MutationErrorFeedback.Global) return

        const notice = getMutationErrorNotice(error)
        if (notice) notifyMutationError(notice)
      },
    }),
  })

export const queryClient = createQueryClient()
