import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type { LimitDraft, QuotaDraft } from '../../form-model'
import { PREFIX } from '../../utils'
import { LimitFields, QuotaFields } from '../limit-fields'

interface LimitsSectionProps {
  limits: LimitDraft
  quota: QuotaDraft
  /** Starts open when the key already has a limit or quota. */
  defaultOpen: boolean
  disabled?: boolean
  onLimitsChange: (next: LimitDraft) => void
  onQuotaChange: (next: QuotaDraft) => void
}

/** Optional per-key rate limits and token quota, folded away by default. */
export function LimitsSection({
  limits,
  quota,
  defaultOpen,
  disabled,
  onLimitsChange,
  onQuotaChange,
}: LimitsSectionProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-radius-lg border border-border-subtle"
    >
      <CollapsibleTrigger className="flex w-full items-center gap-space-sm rounded-radius-lg px-space-md py-space-sm text-left outline-hidden hover:bg-state-hover focus-visible:ring-2 focus-visible:ring-state-focus">
        <ChevronRight
          className={cn(
            'size-icon-sm text-text-secondary transition-transform motion-reduce:transition-none',
            open && 'rotate-90',
          )}
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-text-primary">
          {t(`${PREFIX}.keyForm.limitsTitle`)}
        </span>
        <span className="text-xs text-text-tertiary">
          {t(`${PREFIX}.keyForm.limitsHint`)}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-space-md px-space-md pb-space-md">
        <LimitFields
          idPrefix="gateway-key-limit"
          value={limits}
          disabled={disabled}
          onChange={onLimitsChange}
        />
        <QuotaFields
          idPrefix="gateway-key"
          value={quota}
          disabled={disabled}
          onChange={onQuotaChange}
        />
        <p className="text-xs text-text-tertiary">
          {t(`${PREFIX}.keyForm.quotaHint`)}
        </p>
      </CollapsibleContent>
    </Collapsible>
  )
}
