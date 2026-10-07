import { CircleAlert, CircleHelp, CircleStop } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Alert } from '@/components/ui/alert'
import type { AnswerStatus, AnswerStatusKind } from '../types'
import { answerStatusMessageKey } from '../utils/answer-status'

const toneOf = (kind: AnswerStatusKind) =>
  kind === 'stopped'
    ? { variant: 'default' as const, Icon: CircleStop }
    : kind === 'unconfirmed'
      ? { variant: 'warning' as const, Icon: CircleHelp }
      : { variant: 'destructive' as const, Icon: CircleAlert }

interface AnswerStatusNoticeProps {
  status?: AnswerStatus
}

/**
 * Why an answer did not finish, shown under the content it kept. The text
 * comes only from the fixed category, never from backend error text. It sits
 * inside the polite chat log, so it is announced once without an alert role
 * interrupting the reader; the icon is decorative and the wording carries the
 * state, not the color.
 */
export function AnswerStatusNotice({ status }: AnswerStatusNoticeProps) {
  const { t } = useTranslation()
  if (!status) return null

  const { variant, Icon } = toneOf(status.kind)
  return (
    <Alert
      variant={variant}
      data-answer-status={status.kind}
      className="flex items-start gap-space-sm px-space-md py-space-sm text-sm"
    >
      <Icon className="mt-0.5 size-icon-sm shrink-0" aria-hidden="true" />
      <div className="min-w-0 space-y-space-xs">
        <p className="font-medium">{t(answerStatusMessageKey(status.kind))}</p>
        {status.partial && <p>{t('home.answerStatus.partial')}</p>}
      </div>
    </Alert>
  )
}
