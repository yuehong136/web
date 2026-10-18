import { useTranslation } from 'react-i18next'
import type { ThinkExtractResult } from '@/utils/think-utils'
import { ProcessDisclosure } from './process-disclosure'

export function RetrievalProgress({
  result,
  isStreaming,
}: {
  result: ThinkExtractResult
  isStreaming: boolean
}) {
  const { t } = useTranslation()
  if (result.retrievalStatus === 'none') return null
  const loading = isStreaming && result.retrievalStatus === 'thinking'
  return (
    <ProcessDisclosure
      kind="retrieving"
      loading={loading}
      title={t(
        loading
          ? 'chat.retrieving.inProgress'
          : result.retrievalStatus === 'complete'
            ? 'chat.retrieving.complete'
            : 'chat.retrieving.interrupted',
      )}
    >
      <div className="whitespace-pre-wrap">
        {result.retrievalContent.replace(/<\/?br\s*\/?>/gi, '\n')}
      </div>
    </ProcessDisclosure>
  )
}
