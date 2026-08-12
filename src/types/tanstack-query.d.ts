import type { MutationErrorFeedback } from '@/lib/mutation-error-feedback'

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      errorFeedback?: MutationErrorFeedback
    }
  }
}
