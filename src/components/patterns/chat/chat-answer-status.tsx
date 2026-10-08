import { CircleAlert, CircleHelp, CircleStop } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import {
  answerStatusTone,
  type AnswerStatusKind,
} from '@/lib/chat/answer-status'

const TONES = {
  neutral: { variant: 'default', Icon: CircleStop },
  warning: { variant: 'warning', Icon: CircleHelp },
  error: { variant: 'destructive', Icon: CircleAlert },
} as const

interface ChatAnswerStatusProps {
  kind: AnswerStatusKind
  /** 结束原因的固定文案，由各入口按自己的语境翻译 */
  title: string
  /** 已收到内容时的补充说明 */
  detail?: string
}

/**
 * Why an answer did not finish, shown under the content it kept. Callers pass
 * fixed copy for the category, never backend error text. It belongs inside
 * the polite chat log, so it is announced once without an alert role
 * interrupting the reader; the icon is decorative and the wording carries the
 * state, not the color.
 */
export function ChatAnswerStatus({
  kind,
  title,
  detail,
}: ChatAnswerStatusProps) {
  const { variant, Icon } = TONES[answerStatusTone(kind)]
  return (
    <Alert
      variant={variant}
      data-answer-status={kind}
      className="flex items-start gap-space-sm px-space-md py-space-sm text-sm"
    >
      <Icon className="mt-0.5 size-icon-sm shrink-0" aria-hidden="true" />
      <div className="min-w-0 space-y-space-xs">
        <p className="font-medium">{title}</p>
        {detail ? <p>{detail}</p> : null}
      </div>
    </Alert>
  )
}
