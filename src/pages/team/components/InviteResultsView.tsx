/**
 * 批量邀请结果展示组件
 * 展示组件 - 纯展示邀请结果和汇总
 */

import React from 'react'
import { CheckCircle2, XCircle, UserCheck, Shield, Crown, Clock, MailWarning } from 'lucide-react'
import { InviteResultStatus, type BatchInviteResultItem, type BatchInviteResultSummary } from '@/types/team'

interface InviteResultsViewProps {
  results: BatchInviteResultItem[]
  summary: BatchInviteResultSummary
}

const statusConfig: Record<InviteResultStatus, {
  icon: React.ElementType
  colorClass: string
  label: string
}> = {
  [InviteResultStatus.Invited]: {
    icon: CheckCircle2,
    colorClass: 'text-state-success',
    label: '已邀请',
  },
  [InviteResultStatus.AlreadyMember]: {
    icon: UserCheck,
    colorClass: 'text-state-info',
    label: '已是成员',
  },
  [InviteResultStatus.AlreadyAdmin]: {
    icon: Shield,
    colorClass: 'text-state-info',
    label: '已是管理员',
  },
  [InviteResultStatus.AlreadyOwner]: {
    icon: Crown,
    colorClass: 'text-state-warning',
    label: '是所有者',
  },
  [InviteResultStatus.AlreadyInvited]: {
    icon: Clock,
    colorClass: 'text-state-info',
    label: '已邀请过',
  },
  [InviteResultStatus.UserNotFound]: {
    icon: XCircle,
    colorClass: 'text-state-error',
    label: '用户不存在',
  },
  [InviteResultStatus.InvalidEmail]: {
    icon: MailWarning,
    colorClass: 'text-state-error',
    label: '邮箱无效',
  },
}

// 汇总徽章
const SummaryBadge: React.FC<{ count: number; label: string; variant: 'success' | 'info' | 'error' }> = ({
  count,
  label,
  variant,
}) => {
  if (count === 0) return null

  const variantClass = {
    success: 'bg-state-success-subtle text-state-success',
    info: 'bg-state-info-subtle text-state-info',
    error: 'bg-state-error-subtle text-state-error',
  }[variant]

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${variantClass}`}>
      {count} {label}
    </span>
  )
}

export const InviteResultsView: React.FC<InviteResultsViewProps> = ({ results, summary }) => {
  return (
    <div className="space-y-4">
      {/* 汇总 */}
      <div className="flex flex-wrap gap-2">
        <SummaryBadge count={summary.invited} label="已邀请" variant="success" />
        <SummaryBadge count={summary.already_member + summary.already_admin + summary.already_owner} label="已在团队" variant="info" />
        <SummaryBadge count={summary.already_invited} label="已邀请过" variant="info" />
        <SummaryBadge count={summary.user_not_found} label="未找到" variant="error" />
        <SummaryBadge count={summary.invalid_email} label="邮箱无效" variant="error" />
      </div>

      {/* 逐条结果 */}
      <div className="max-h-[300px] overflow-y-auto space-y-1">
        {results.map((item, idx) => {
          const config = statusConfig[item.status] || statusConfig[InviteResultStatus.UserNotFound]
          const Icon = config.icon

          return (
            <div
              key={`${item.email}-${idx}`}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-secondary/60 transition-colors"
            >
              <Icon className={`h-4 w-4 shrink-0 ${config.colorClass}`} />
              <span className="text-sm text-text-primary flex-1 min-w-0 truncate" title={item.email}>
                {item.email}
              </span>
              <span className={`text-xs shrink-0 ${config.colorClass}`}>
                {config.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

InviteResultsView.displayName = 'InviteResultsView'
