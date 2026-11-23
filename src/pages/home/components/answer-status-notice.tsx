import { useTranslation } from 'react-i18next'
import {
  AnswerRecoveryActions,
  ChatAnswerStatus,
} from '@/components/patterns/chat/chat-answer-status'
import type { AnswerStatus } from '../types'
import { answerStatusMessageKey } from '../utils/answer-status'

interface AnswerStatusNoticeProps {
  status?: AnswerStatus
  /** Offered on the newest answer only; older ones keep the explanation. */
  onRetry?: () => void
}

/** Home 回答的结束原因：共享状态提示配首页文案 */
export function AnswerStatusNotice({
  status,
  onRetry,
}: AnswerStatusNoticeProps) {
  const { t } = useTranslation()
  if (!status) return null

  return (
    <ChatAnswerStatus
      kind={status.kind}
      title={t(answerStatusMessageKey(status.kind))}
      detail={status.partial ? t('home.answerStatus.partial') : undefined}
      actions={
        onRetry ? (
          <AnswerRecoveryActions kind={status.kind} onRetry={onRetry} />
        ) : undefined
      }
    />
  )
}
