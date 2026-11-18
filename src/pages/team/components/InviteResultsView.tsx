import type { ElementType } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CheckCircle2,
  Clock,
  Crown,
  MailWarning,
  Shield,
  UserCheck,
  XCircle,
} from 'lucide-react'
import { InlineStats, type InlineStat } from '@/components/patterns'
import { cn } from '@/lib/utils'
import {
  InviteResultStatus,
  type BatchInviteResultItem,
  type BatchInviteResultSummary,
} from '@/types/team'

interface InviteResultsViewProps {
  results: BatchInviteResultItem[]
  summary: BatchInviteResultSummary
}

/** Outcome per address; colour marks success, no-op and failure. */
const STATUS: Record<
  InviteResultStatus,
  { icon: ElementType; tone: string; key: string }
> = {
  [InviteResultStatus.Invited]: {
    icon: CheckCircle2,
    tone: 'text-success-fg',
    key: 'invited',
  },
  [InviteResultStatus.AlreadyMember]: {
    icon: UserCheck,
    tone: 'text-fg-subtle',
    key: 'alreadyMember',
  },
  [InviteResultStatus.AlreadyAdmin]: {
    icon: Shield,
    tone: 'text-fg-subtle',
    key: 'alreadyAdmin',
  },
  [InviteResultStatus.AlreadyOwner]: {
    icon: Crown,
    tone: 'text-fg-subtle',
    key: 'alreadyOwner',
  },
  [InviteResultStatus.AlreadyInvited]: {
    icon: Clock,
    tone: 'text-fg-subtle',
    key: 'alreadyInvited',
  },
  [InviteResultStatus.UserNotFound]: {
    icon: XCircle,
    tone: 'text-danger-fg',
    key: 'userNotFound',
  },
  [InviteResultStatus.InvalidEmail]: {
    icon: MailWarning,
    tone: 'text-danger-fg',
    key: 'invalidEmail',
  },
}

export function InviteResultsView({
  results,
  summary,
}: InviteResultsViewProps) {
  const { t } = useTranslation()
  const counts: InlineStat[] = [
    {
      key: 'invited',
      label: t('settings.team.inviteDialog.summary.invited'),
      value: summary.invited,
      tone: 'success' as const,
    },
    {
      key: 'inTeam',
      label: t('settings.team.inviteDialog.summary.inTeam'),
      value:
        summary.already_member + summary.already_admin + summary.already_owner,
    },
    {
      key: 'alreadyInvited',
      label: t('settings.team.inviteDialog.summary.alreadyInvited'),
      value: summary.already_invited,
    },
    {
      key: 'notFound',
      label: t('settings.team.inviteDialog.summary.notFound'),
      value: summary.user_not_found,
      tone: 'error' as const,
    },
    {
      key: 'invalid',
      label: t('settings.team.inviteDialog.summary.invalid'),
      value: summary.invalid_email,
      tone: 'error' as const,
    },
  ].filter((item) => item.value > 0)
  return (
    <div className="flex flex-col gap-space-md">
      <InlineStats items={counts} />
      <ul className="flex max-h-72 flex-col overflow-y-auto rounded-radius-lg border border-line-subtle">
        {results.map((item, index) => {
          const config =
            STATUS[item.status] ?? STATUS[InviteResultStatus.UserNotFound]
          const Icon = config.icon
          return (
            <li
              key={`${item.email}-${index}`}
              className="flex items-center gap-space-sm border-b border-line-subtle px-space-md py-space-xs last:border-b-0"
            >
              <Icon
                className={cn('size-icon-sm shrink-0', config.tone)}
                aria-hidden="true"
              />
              <span
                className="min-w-0 flex-1 truncate text-sm text-fg"
                title={item.email}
              >
                {item.email}
              </span>
              <span className={cn('shrink-0 text-xs', config.tone)}>
                {t(`settings.team.inviteDialog.status.${config.key}`)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
