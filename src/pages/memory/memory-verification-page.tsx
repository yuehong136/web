import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ConsolePageTemplate } from '@/components/page-templates/console-page-template'
import { PageHeader } from '@/components/patterns/page-header'
import { SectionCard } from '@/components/patterns/section-card'
import {
  PageLoadingState,
  PageErrorState,
  PageEmptyState,
} from '@/components/patterns/page-states'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMemoryCapabilities } from '@/hooks/use-memory-revisions'
import { useMemoryVerificationTodos } from '@/hooks/use-memory-verification'
import { MemoryVerificationPanel } from '@/components/memory/memory-verification-panel'
export function MemoryVerificationPage() {
  const { id } = useParams<{ id: string }>()
  return id ? <MemoryVerificationQueue key={id} memoryId={id} /> : null
}
function MemoryVerificationQueue({ memoryId }: { memoryId: string }) {
  const { t } = useTranslation(),
    [params, setParams] = useSearchParams(),
    [draft, setDraft] = useState('')
  const cap = useMemoryCapabilities(memoryId),
    cursor = params.get('verification_cursor') ?? undefined,
    entryId = params.get('verification_entry') ?? ''
  const supported = cap.data?.verification?.supported === true,
    todos = useMemoryVerificationTodos(memoryId, cursor, supported)
  const select = (id: string) =>
    setParams((old) => {
      const next = new URLSearchParams(old)
      next.set('verification_entry', id)
      return next
    })
  return (
    <ConsolePageTemplate
      header={
        <PageHeader
          title={t('memory.verification.title')}
          description={t('memory.verification.description')}
        />
      }
    >
      <div className="min-w-0 space-y-space-lg p-space-lg">
        <Alert variant="info">{t('memory.verification.boundary')}</Alert>
        {cap.isPending ? (
          <PageLoadingState />
        ) : cap.isError ? (
          <PageErrorState onRetry={() => cap.refetch()} />
        ) : !supported ? (
          <Alert variant="warning">
            {t('memory.verification.unsupported')}
          </Alert>
        ) : (
          <>
            <SectionCard title={t('memory.verification.filter')}>
              <p className="text-xs text-text-secondary">
                {t('memory.verification.todoBoundary')}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void todos.refetch()}
              >
                {t('memory.verification.refresh')}
              </Button>
              {todos.isPending ? (
                <PageLoadingState />
              ) : todos.isError ? (
                <PageErrorState onRetry={() => todos.refetch()} />
              ) : (
                <div className="mt-space-base space-y-space-base">
                  {todos.data?.scan_limited && (
                    <Alert variant="warning">
                      {t('memory.verification.scanLimited')}
                    </Alert>
                  )}
                  {!todos.data?.items.length ? (
                    <PageEmptyState title={t('memory.verification.noWork')} />
                  ) : (
                    todos.data.items.map((item) => (
                      <article
                        key={item.verification_id}
                        className="min-w-0 space-y-space-sm rounded-radius-lg border border-border-default p-space-base"
                      >
                        <p className="font-mono text-xs break-all">
                          {item.entry_id}
                        </p>
                        <p className="text-sm text-status-warning">
                          {t(
                            `memory.verification.statuses.${item.effective_status}`,
                          )}
                        </p>
                        <ul className="text-xs">
                          {item.stale_reasons.map((reason) => (
                            <li key={reason}>
                              {t(`memory.verification.staleReasons.${reason}`, {
                                defaultValue: t(
                                  'memory.verification.staleReasons.other',
                                ),
                              })}
                            </li>
                          ))}
                        </ul>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => select(item.entry_id)}
                        >
                          {t('memory.verification.open')}
                        </Button>
                      </article>
                    ))
                  )}
                  <div className="flex flex-wrap gap-space-sm">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={!cursor}
                      onClick={() =>
                        setParams((old) => {
                          const next = new URLSearchParams(old)
                          next.delete('verification_cursor')
                          return next
                        })
                      }
                    >
                      {t('memory.verification.first')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!todos.data?.next_cursor}
                      onClick={() =>
                        setParams((old) => {
                          const next = new URLSearchParams(old)
                          next.set(
                            'verification_cursor',
                            todos.data!.next_cursor!,
                          )
                          return next
                        })
                      }
                    >
                      {t('memory.verification.next')}
                    </Button>
                  </div>
                </div>
              )}
            </SectionCard>
            <SectionCard title={t('memory.verification.entryId')}>
              <form
                className="flex min-w-0 flex-wrap items-end gap-space-sm"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (/^[0-9a-f]{32}$/.test(draft)) select(draft)
                }}
              >
                <div className="min-w-0 flex-1 space-y-space-xs">
                  <Label htmlFor="verification-entry">
                    {t('memory.verification.entryId')}
                  </Label>
                  <Input
                    id="verification-entry"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                  />
                </div>
                <Button type="submit" disabled={!/^[0-9a-f]{32}$/.test(draft)}>
                  {t('memory.verification.open')}
                </Button>
              </form>
              {entryId && /^[0-9a-f]{32}$/.test(entryId) && (
                <MemoryVerificationPanel
                  key={entryId}
                  memoryId={memoryId}
                  entryId={entryId}
                />
              )}
            </SectionCard>
          </>
        )}
      </div>
    </ConsolePageTemplate>
  )
}
