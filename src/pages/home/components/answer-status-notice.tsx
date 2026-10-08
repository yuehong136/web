import { useTranslation } from 'react-i18next'
import { ChatAnswerStatus } from '@/components/patterns/chat/chat-answer-status'
import type { AnswerStatus } from '../types'
import { answerStatusMessageKey } from '../utils/answer-status'

interface AnswerStatusNoticeProps {
  status?: AnswerStatus
}

/** Home 回答的结束原因：共享状态提示配首页文案 */
export function AnswerStatusNotice({ status }: AnswerStatusNoticeProps) {
  const { t } = useTranslation()
  if (!status) return null

  return (
    <ChatAnswerStatus
      kind={status.kind}
      title={t(answerStatusMessageKey(status.kind))}
      detail={status.partial ? t('home.answerStatus.partial') : undefined}
    />
  )
}
