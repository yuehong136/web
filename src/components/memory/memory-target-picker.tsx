import type { ComponentProps, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionCard } from '@/components/patterns/section-card'
import { PageEmptyState } from '@/components/patterns/page-states'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { MemoryTargetCard } from './memory-target-card'

export type MemoryTargetCardData = Omit<
  ComponentProps<typeof MemoryTargetCard>,
  'selected' | 'disabled' | 'onSelected'
>

export function MemoryTargetPicker({
  controls,
  items,
  selectedIds,
  pending,
  locked,
  stale,
  requested,
  active,
  requestDisabled,
  budget,
  errorKey,
  onRequest,
  onToggle,
  onApply,
  onClear,
}: {
  controls?: ReactNode
  items: MemoryTargetCardData[]
  selectedIds: string[]
  pending: boolean
  locked: boolean
  stale: boolean
  requested: boolean
  active: boolean
  requestDisabled?: boolean
  budget?: ReactNode
  errorKey?: string
  onRequest: () => void
  onToggle: (entryId: string, selected: boolean) => void
  onApply: () => void
  onClear: () => void
}) {
  const { t } = useTranslation()
  return (
    <SectionCard title={t('memory.targets.title')}>
      <div className="min-w-0 space-y-space-base" aria-busy={pending}>
        <p className="text-sm text-fg-muted">
          {t('memory.targets.description')}
        </p>
        <Alert variant="warning">{t('memory.targets.untrusted')}</Alert>
        <p className="text-xs text-fg-muted">
          {t('memory.targets.modelBoundary')}
        </p>
        {controls}
        <Button
          type="button"
          variant="outline"
          disabled={pending || locked || requestDisabled}
          onClick={onRequest}
        >
          {t('memory.targets.request')}
        </Button>
        {errorKey && <Alert variant="warning">{t(errorKey)}</Alert>}
        {stale && <Alert variant="warning">{t('memory.targets.stale')}</Alert>}
        {requested && (
          <>
            <p className="text-xs text-fg-muted">
              {t('memory.targets.bounded')}
            </p>
            {budget}
            {!items.length ? (
              <PageEmptyState title={t('memory.targets.noResults')} />
            ) : (
              <>
                <p className="text-sm">
                  {t('memory.targets.selected', { count: selectedIds.length })}
                </p>
                {!selectedIds.length && (
                  <p className="text-xs text-fg-muted">
                    {t('memory.targets.noneSelected')}
                  </p>
                )}
                <div className="space-y-space-base">
                  {items.map((item) => (
                    <MemoryTargetCard
                      key={item.entryId}
                      {...item}
                      selected={selectedIds.includes(item.entryId)}
                      disabled={pending || locked || stale}
                      onSelected={(checked) => onToggle(item.entryId, checked)}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-space-sm">
                  <Button
                    type="button"
                    disabled={!selectedIds.length || pending || locked || stale}
                    onClick={onApply}
                  >
                    {t('memory.targets.apply')}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
        {active && (
          <Button
            type="button"
            variant="outline"
            disabled={pending || locked}
            onClick={onClear}
          >
            {t('memory.targets.clear')}
          </Button>
        )}
      </div>
    </SectionCard>
  )
}
