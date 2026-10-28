import { useTranslation } from 'react-i18next'
import { useFetchMyLLMs } from './use-llm-request'

export interface ModelRequestState {
  loading?: boolean
  error?: string
  onRetry?: () => unknown
}

/** Pass inventory status together so consumers cannot mistake an error for an empty list. */
export function useModelSelectorRequest() {
  const { t } = useTranslation()
  const query = useFetchMyLLMs()
  const modelRequest: ModelRequestState = {
    loading: query.isLoading || query.isPending || query.isPaused,
    error: query.isError ? t('common.modelPicker.loadFailed') : undefined,
    onRetry: query.refetch,
  }
  return { ...query, modelRequest }
}
