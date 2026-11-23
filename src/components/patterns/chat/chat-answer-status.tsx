import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  CircleAlert,
  CircleHelp,
  CircleStop,
  LogIn,
  RotateCcw,
} from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants'
import {
  answerRecovery,
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
  /** Recovery controls, e.g. AnswerRecoveryActions, under the text. */
  actions?: ReactNode
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
  actions,
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
        {actions ? (
          <div className="flex flex-wrap items-center gap-space-sm pt-space-2xs">
            {actions}
          </div>
        ) : null}
      </div>
    </Alert>
  )
}

/**
 * The next step for an unfinished answer, inline where it failed: ask again
 * (the surface decides how: regenerate an app reply, resend a direct chat),
 * again once a rate limit has passed, or sign in when the session ended.
 * 32px outline controls, so the notice keeps its tone as the strongest colour.
 */
export function AnswerRecoveryActions({
  kind,
  onRetry,
}: {
  kind: AnswerStatusKind
  onRetry: () => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const recovery = answerRecovery(kind)
  if (recovery === 'signIn')
    return (
      <Button
        type="button"
        variant="outline"
        data-answer-recovery="signIn"
        onClick={() =>
          navigate(ROUTES.LOGIN, {
            state: {
              from: `${location.pathname}${location.search}${location.hash}`,
            },
          })
        }
      >
        <LogIn aria-hidden="true" />
        {t('chat.stream.signInAgain')}
      </Button>
    )
  return (
    <>
      <Button
        type="button"
        variant="outline"
        data-answer-recovery={recovery}
        onClick={onRetry}
      >
        <RotateCcw aria-hidden="true" />
        {t(
          recovery === 'retryLater'
            ? 'chat.stream.retryLater'
            : 'chat.stream.retry',
        )}
      </Button>
      {recovery === 'retryLater' ? (
        <span className="text-fg-muted">
          {t('chat.stream.rateLimitedHint')}
        </span>
      ) : null}
    </>
  )
}
