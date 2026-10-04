import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

export function SkillConfigAdvanced({
  parameters,
  children,
}: {
  parameters: ReactNode
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <Collapsible className="rounded-radius-lg border border-border-default text-text-primary">
      <CollapsibleTrigger
        type="button"
        className="group flex w-full items-center justify-between gap-space-sm rounded-radius-lg px-space-md py-space-md text-sm font-medium text-text-primary transition-colors hover:bg-state-hover focus-visible:ring-2 focus-visible:ring-border-accent focus-visible:outline-none"
      >
        {t('skills.advanced')}
        <ChevronDown className="size-icon-sm shrink-0 text-text-secondary transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-space-lg border-t border-border-subtle p-space-md">
          <div className="grid min-w-0 gap-space-md sm:grid-cols-3">
            {parameters}
          </div>
          <div>
            <div className="flex items-center justify-between gap-space-md pb-space-sm text-xs font-medium text-text-secondary">
              <span>{t('skills.field')}</span>
              <span className="w-24 text-right">{t('skills.weight')}</span>
            </div>
            <div className="divide-y divide-border-subtle">{children}</div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function SkillConfigField({
  control,
  weight,
}: {
  control: ReactNode
  weight: ReactNode
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-space-md py-space-sm">
      <div className="min-w-0 flex-1">{control}</div>
      <div className="w-24 shrink-0">{weight}</div>
    </div>
  )
}
