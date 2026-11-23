import { useTranslation } from 'react-i18next'
import { Clock, Crown, Shield, UserCheck } from 'lucide-react'
import { Badge, badgeLook } from '@/components/ui/badge'
import { TenantRole } from '@/types/team'

const ROLES = {
  [TenantRole.Owner]: { key: 'owner', icon: Crown },
  [TenantRole.Admin]: { key: 'admin', icon: Shield },
  [TenantRole.Normal]: { key: 'normal', icon: UserCheck },
  [TenantRole.Invite]: { key: 'invite', icon: Clock },
} as const

/**
 * Team role lozenge. Roles are categories and stay neutral; only a pending
 * invitation, which waits on someone, carries the warning colour.
 */
export function RoleBadge({
  role,
  className,
}: {
  role: TenantRole
  className?: string
}) {
  const { t } = useTranslation()
  const config = ROLES[role] ?? ROLES[TenantRole.Normal]
  const Icon = config.icon
  return (
    <Badge
      {...badgeLook(role === TenantRole.Invite ? 'warning' : 'secondary')}
      className={className}
    >
      <Icon className="size-icon-xs" aria-hidden="true" />
      {t(`settings.team.roles.${config.key}`)}
    </Badge>
  )
}
