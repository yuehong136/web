import { useTranslation } from '../../hooks/use-translation'
import { cn, getTypeColor, getTypeLabel } from '../../lib/utils'
import type { SchemaType } from '../../types/json-schema'

export function SchemaTypeBadge({ type }: { type: SchemaType }) {
  const t = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex min-w-[72px] items-center justify-center rounded-radius-md px-space-sm py-space-xs text-xs font-medium',
        getTypeColor(type),
      )}
    >
      {getTypeLabel(t, type)}
    </span>
  )
}
