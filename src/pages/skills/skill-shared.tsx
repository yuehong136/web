import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { APIError } from '@/api/client'
import type { AcceptedSkillOperation } from '@/api/skill-types'
import { skillsAPI } from '@/api/skills'
import {
  useSkillAction,
  useSkillOperation,
  useSkillCapabilities,
} from '@/hooks/use-skill-request'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

export function SkillError({ error }: { error: unknown }) {
  const { t, i18n } = useTranslation()
  if (!error) return null
  const code =
    error instanceof APIError
      ? error.code
      : typeof error === 'string'
        ? error
        : ''
  const key = `skills.errors.${code}`
  const statusKey = `skills.errors.HTTP_${error instanceof APIError ? error.status : 0}`
  return (
    <p role="alert" className="text-sm text-status-error">
      {i18n.exists(key)
        ? t(key)
        : i18n.exists(statusKey)
          ? t(statusKey)
          : t('skills.error')}
    </p>
  )
}

export function SkillPagination({
  page,
  total,
  setPage,
}: {
  page: number
  total: number
  setPage: (page: number) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap items-center justify-end gap-space-sm py-space-base">
      <span className="text-sm text-text-secondary">
        {t('skills.page', { page, total })}
      </span>
      <Button
        variant="outline"
        disabled={page <= 1}
        onClick={() => setPage(page - 1)}
      >
        {t('skills.previous')}
      </Button>
      <Button
        variant="outline"
        disabled={page * 20 >= total}
        onClick={() => setPage(page + 1)}
      >
        {t('skills.next')}
      </Button>
    </div>
  )
}

export function SkillDeleteDialog({
  open,
  onClose,
  onConfirm,
  pending,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  pending: boolean
}) {
  const { t } = useTranslation()
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value && !pending) onClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('skills.deleteConfirm')}</DialogTitle>
          <DialogDescription>{t('skills.deleteDescription')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={onClose}>
            {t('skills.cancel')}
          </Button>
          <Button variant="destructive" disabled={pending} onClick={onConfirm}>
            {t('skills.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** URL is the durable locator; task progress itself always comes from the server. */
export function useSkillOperationRoute() {
  const [params, setParams] = useSearchParams()
  const ids = params
    .getAll('operation')
    .filter((id) => /^[a-f0-9]{32}$/.test(id))
  const accepted = (operation: AcceptedSkillOperation) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (!next.getAll('operation').includes(operation.operation_id))
          next.append('operation', operation.operation_id)
        return next
      },
      { replace: true },
    )
  const dismiss = (id: string) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        next.delete('operation', id)
        return next
      },
      { replace: true },
    )
  const href = (path: string, extra?: Record<string, string>) => {
    const query = new URLSearchParams(extra)
    for (const id of ids) query.append('operation', id)
    return `${path}${query.size ? `?${query}` : ''}`
  }
  return { ids, accepted, dismiss, href }
}

function SkillOperationCard({
  id,
  onDismiss,
  onAccepted,
}: {
  id: string
  onDismiss: () => void
  onAccepted: (operation: AcceptedSkillOperation) => void
}) {
  const { t } = useTranslation()
  const query = useSkillOperation(id)
  const action = useSkillAction(onAccepted)
  const capabilities = useSkillCapabilities()
  const operation = query.data
  return (
    <section
      className="rounded-radius-lg border border-border-default bg-background-subtle p-space-base"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <strong>
          {operation
            ? t(`skills.operations.${operation.kind}`)
            : t('skills.operation')}
        </strong>
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          {t('skills.dismiss')}
        </Button>
      </div>
      <SkillError error={query.error || action.error} />
      {operation ? (
        <>
          <p>
            {t(`skills.states.${operation.state}`)} ·{' '}
            {t(`skills.phases.${operation.phase}`)}
          </p>
          {operation.kind === 'install' &&
            (['sealed', 'indexing'].includes(operation.phase) ||
              (operation.phase === 'done' &&
                operation.state === 'succeeded')) && (
              <p className="text-sm text-text-secondary">
                {t('skills.filesStored')}
              </p>
            )}
          <p className="text-sm text-text-secondary">
            {t('skills.progress', operation.progress)}
          </p>
          {operation.error && <SkillError error={operation.error.error_code} />}
          {operation.result.index_state && (
            <p>{t(`skills.states.${operation.result.index_state}`)}</p>
          )}
          {!!operation.result.skipped_binary_count && (
            <p>
              {t('skills.skipped', {
                count: operation.result.skipped_binary_count,
              })}
            </p>
          )}
          {operation.result.items
            .filter((item) => item.state !== 'succeeded')
            .map((item) => (
              <div key={item.id} className="py-space-xs text-sm">
                <span className="font-mono">{item.id}</span> ·{' '}
                {t(`skills.states.${item.state}`)}
                <SkillError error={item.error_code} />
              </div>
            ))}
          {['failed', 'partial'].includes(operation.state) &&
            (operation.error?.retryable ||
              operation.result.items.some((item) => item.retryable)) && (
              <Button
                disabled={action.isPending || !capabilities.data?.writable}
                onClick={() => {
                  const key = action.requestKey(`retry/${id}`)
                  action.mutate(() => skillsAPI.retry(id, key))
                }}
              >
                {t('skills.retry')}
              </Button>
            )}
        </>
      ) : (
        !query.error && <p>{t('skills.loading')}</p>
      )}
      <details className="pt-space-xs text-xs text-text-caption">
        <summary className="cursor-pointer">{t('skills.taskDetails')}</summary>
        <span className="font-mono break-all">{id}</span>
      </details>
      {query.error && (
        <Button variant="outline" onClick={() => void query.refetch()}>
          {t('skills.refresh')}
        </Button>
      )}
    </section>
  )
}

export function SkillOperations({
  tracker,
}: {
  tracker: ReturnType<typeof useSkillOperationRoute>
}) {
  return (
    <div className="flex flex-col gap-space-sm">
      {tracker.ids.map((id) => (
        <SkillOperationCard
          key={id}
          id={id}
          onDismiss={() => tracker.dismiss(id)}
          onAccepted={tracker.accepted}
        />
      ))}
    </div>
  )
}

export function saveSkillBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = Array.from(name, (char) =>
    char === '/' || char === '\\' || char.charCodeAt(0) < 32 ? '_' : char,
  ).join('')
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
