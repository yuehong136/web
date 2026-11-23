import { CircleCheck, CirclePause, History } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge, badgeLook } from '@/components/ui/badge'
import type { MemoryMessage, MemoryType } from '@/types/memory'
import { getMemoryLifecycle } from './memory-lifecycle'

/** Memory type is a category, not a state, so it stays neutral. */
export function MemoryTypeBadge({ type }: { type: MemoryType }) {
  const { t } = useTranslation()
  return <Badge>{t(`memory.filters.${type}`, type)}</Badge>
}

export function MemoryStatusBadge({ message }: { message: MemoryMessage }) {
  const { t } = useTranslation()
  const state = getMemoryLifecycle(message)
  const Icon =
    state === 'forgotten'
      ? History
      : state === 'disabled'
        ? CirclePause
        : CircleCheck
  return (
    <Badge
      {...badgeLook(state === 'enabled' ? 'success' : 'secondary')}
      className="gap-space-xs"
    >
      <Icon className="size-icon-xs" aria-hidden="true" />
      {t(`memory.workspace.${state}`)}
    </Badge>
  )
}
