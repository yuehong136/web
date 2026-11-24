import { useState } from 'react'
import { v4 as uuid } from 'uuid'
import { useTranslation } from 'react-i18next'
import { memoryAPI } from '@/api/memory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert } from '@/components/ui/alert'
import {
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns/page-states'
import {
  editableMemoryId,
  isKnownMemoryRejection,
  memoryCommandErrorKey,
  useManagedEntry,
  useMemoryCapabilities,
  useMemoryCommand,
  useMemoryRevisionHistory,
} from '@/hooks/use-memory-revisions'
import type { MemoryMessage } from '@/types/memory'
import type {
  MemoryEntry,
  MemoryRevisionCommand,
  MemoryRevisionPreview,
} from '@/types/memory-revisions'
import { MemoryAdoptionConfirmation } from './memory-adoption-confirmation'
import { MemoryOperationPanel } from './memory-operation-panel'
import { MemoryVerificationPanel } from './memory-verification-panel'
import { MemorySourcePanel } from './memory-source-panel'

export function MemoryRevisionPanel({
  memoryId,
  message,
}: {
  memoryId: string
  message: MemoryMessage
}) {
  const { t } = useTranslation()
  const capabilities = useMemoryCapabilities(memoryId)
  const id = editableMemoryId(message.message_id)
  const supported = capabilities.data?.revisions?.supported === true
  const entry = useManagedEntry(
    memoryId,
    id ?? '',
    supported && !!id && message.message_type !== 'raw',
  )
  const [confirmed, setConfirmed] = useState(false)
  const [operationId, setOperationId] = useState('')
  const adopt = useMemoryCommand(memoryId, (op: string) =>
    memoryAPI.revision.adoptEntry(memoryId, op, id!),
  )
  if (capabilities.isPending) return <PageLoadingState />
  if (capabilities.isError)
    return (
      <PageErrorState
        description={t('memory.revisions.capabilitiesFailed')}
        onRetry={() => capabilities.refetch()}
      />
    )
  if (!supported) return null
  if (!id)
    return <Alert variant="warning">{t('memory.revisions.unsafeId')}</Alert>
  if (message.message_type === 'raw')
    return <MemorySourcePanel memoryId={memoryId} sourceId={id} />
  if (entry.isPending) return <PageLoadingState />
  if (entry.isError) return <PageErrorState onRetry={() => entry.refetch()} />
  const refresh = () => {
    void entry.refetch()
    void capabilities.refetch()
  }
  if (entry.data)
    return (
      <MemoryRevisionEditor
        key={entry.data.entry_id}
        memoryId={memoryId}
        entry={entry.data}
        maxReasonChars={capabilities.data?.revisions?.max_reason_chars ?? 1024}
        onRefresh={refresh}
      />
    )
  return (
    <section className="space-y-space-base border-t border-line-subtle pt-space-base">
      <h3 className="text-sm font-medium">{t('memory.revisions.title')}</h3>
      <p className="text-sm text-fg-muted">
        {t('memory.revisions.adoptDescription')}
      </p>
      <MemoryAdoptionConfirmation
        capabilities={capabilities.data}
        managed={capabilities.data?.revisions?.managed === true}
        checked={confirmed}
        onCheckedChange={setConfirmed}
      />
      <Button
        disabled={!confirmed || adopt.isPending || !!operationId}
        onClick={async () => {
          const op = `memory-${uuid()}`
          setOperationId(op)
          try {
            await adopt.mutateAsync(op)
            refresh()
          } catch (error) {
            if (isKnownMemoryRejection(error)) {
              setOperationId('')
              setConfirmed(false)
            }
            refresh()
          }
        }}
      >
        {t('memory.revisions.adopt')}
      </Button>
      {adopt.isError && (
        <p role="alert" className="text-sm text-danger-fg">
          {t(memoryCommandErrorKey(adopt.error))}
        </p>
      )}
      {operationId && (
        <MemoryOperationPanel
          memoryId={memoryId}
          operationId={operationId}
          onRefresh={refresh}
        />
      )}
    </section>
  )
}

function MemoryRevisionEditor({
  memoryId,
  entry,
  maxReasonChars,
  onRefresh,
}: {
  memoryId: string
  entry: MemoryEntry
  maxReasonChars: number
  onRefresh: () => void
}) {
  const { t } = useTranslation()
  const [content, setContent] = useState(entry.current.content ?? '')
  const [reason, setReason] = useState('')
  const [mode, setMode] = useState<'content' | 'patch'>('content')
  const [oldText, setOldText] = useState('')
  const [newText, setNewText] = useState('')
  const [preview, setPreview] = useState<MemoryRevisionPreview | null>(null)
  const [previewReason, setPreviewReason] = useState('')
  const [operationId, setOperationId] = useState('')
  const [cursor, setCursor] = useState<string>()
  const history = useMemoryRevisionHistory(memoryId, entry.entry_id, cursor)
  const command = useMemoryCommand(memoryId, (input: MemoryRevisionCommand) =>
    memoryAPI.revision.revise(memoryId, entry.entry_id, input),
  )
  const valid =
    !!reason.trim() &&
    reason.length <= maxReasonChars &&
    new TextEncoder().encode(content).length <= 65535 &&
    (mode === 'content' ? !!content.trim() : !!oldText)
  const currentPreview =
    preview &&
    preview.expected_revision === entry.current_revision &&
    reason === previewReason
  const redacted = entry.current.redacted || entry.current.content === null
  const editable =
    entry.state === 'active' && entry.current.content !== null && !operationId
  const resetPreview = () => setPreview(null)
  const run = async (dryRun: boolean) => {
    const op = `memory-${uuid()}`
    if (!dryRun) setOperationId(op)
    try {
      const result = await command.mutateAsync({
        operation_id: op,
        expected_revision: entry.current_revision,
        ...(mode === 'content'
          ? { content }
          : { patch: { old_text: oldText, new_text: newText } }),
        reason,
        dry_run: dryRun,
      })
      if ('dry_run' in result && result.dry_run) {
        setPreview(result)
        setPreviewReason(reason)
      } else {
        setPreview(null)
        onRefresh()
      }
    } catch (error) {
      setPreview(null)
      if (isKnownMemoryRejection(error)) setOperationId('')
      onRefresh()
    }
  }
  return (
    <section className="space-y-space-base border-t border-line-subtle pt-space-base">
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <h3 className="text-sm font-medium">
          {t('memory.revisions.title')} ·{' '}
          {t('memory.revisions.version', { revision: entry.current_revision })}
        </h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            resetPreview()
            onRefresh()
          }}
        >
          {t('memory.revisions.refresh')}
        </Button>
      </div>
      <Alert variant="info">{t('memory.revisions.userAsserted')}</Alert>
      {!editable && !operationId && (
        <Alert variant="warning">{t('memory.revisions.readOnly')}</Alert>
      )}
      {!redacted && (
        <>
          <div className="flex gap-space-sm">
            <Button
              size="sm"
              variant={mode === 'content' ? 'secondary' : 'ghost'}
              disabled={!editable}
              onClick={() => {
                setMode('content')
                resetPreview()
              }}
            >
              {t('memory.revisions.replace')}
            </Button>
            <Button
              size="sm"
              variant={mode === 'patch' ? 'secondary' : 'ghost'}
              disabled={!editable}
              onClick={() => {
                setMode('patch')
                resetPreview()
              }}
            >
              {t('memory.revisions.exactPatch')}
            </Button>
          </div>
          {mode === 'content' ? (
            <div className="space-y-space-xs">
              <Label htmlFor="revision-content">
                {t('memory.revisions.content')}
              </Label>
              <Textarea
                id="revision-content"
                value={content}
                disabled={!editable || command.isPending}
                onChange={(event) => {
                  setContent(event.target.value)
                  resetPreview()
                }}
              />
            </div>
          ) : (
            <>
              <div className="space-y-space-xs">
                <Label htmlFor="revision-old">
                  {t('memory.revisions.oldText')}
                </Label>
                <Textarea
                  id="revision-old"
                  value={oldText}
                  disabled={!editable || command.isPending}
                  onChange={(event) => {
                    setOldText(event.target.value)
                    resetPreview()
                  }}
                />
              </div>
              <div className="space-y-space-xs">
                <Label htmlFor="revision-new">
                  {t('memory.revisions.newText')}
                </Label>
                <Textarea
                  id="revision-new"
                  value={newText}
                  disabled={!editable || command.isPending}
                  onChange={(event) => {
                    setNewText(event.target.value)
                    resetPreview()
                  }}
                />
              </div>
            </>
          )}
          <div className="space-y-space-xs">
            <Label htmlFor="revision-reason">
              {t('memory.revisions.reason')}
            </Label>
            <Input
              id="revision-reason"
              value={reason}
              maxLength={maxReasonChars}
              disabled={!editable || command.isPending}
              onChange={(event) => {
                setReason(event.target.value)
                resetPreview()
              }}
            />
          </div>
          <div className="flex gap-space-sm">
            <Button
              variant="outline"
              disabled={!editable || !valid || command.isPending}
              onClick={() => run(true)}
            >
              {t('memory.revisions.preview')}
            </Button>
            <Button
              disabled={!editable || !currentPreview || command.isPending}
              onClick={() => run(false)}
            >
              {t('memory.revisions.submit')}
            </Button>
          </div>
        </>
      )}
      {command.isError && (
        <p role="alert" className="text-sm text-danger-fg">
          {t(memoryCommandErrorKey(command.error))}
        </p>
      )}
      {preview && !redacted && (
        <div className="space-y-space-sm rounded-radius-lg bg-sunken p-space-base">
          <h4 className="text-sm font-medium">
            {t('memory.revisions.previewTitle')}
          </h4>
          <p className="text-xs text-fg-muted">
            {t('memory.revisions.estimatedTokens', {
              count: preview.estimated_tokens,
            })}
          </p>
          <div className="space-y-space-xs">
            <h5 className="text-xs">{t('memory.revisions.before')}</h5>
            <p className="text-sm break-words whitespace-pre-wrap">
              {preview.diff.old_text}
            </p>
          </div>
          <div className="space-y-space-xs">
            <h5 className="text-xs">{t('memory.revisions.after')}</h5>
            <p className="text-sm break-words whitespace-pre-wrap">
              {preview.diff.new_text}
            </p>
          </div>
        </div>
      )}
      {operationId && (
        <MemoryOperationPanel
          memoryId={memoryId}
          operationId={operationId}
          onRefresh={onRefresh}
        />
      )}
      <MemoryVerificationPanel memoryId={memoryId} entryId={entry.entry_id} />
      <details className="space-y-space-sm">
        <summary className="cursor-pointer text-sm font-medium">
          {t('memory.revisions.history')}
        </summary>
        {history.isPending ? (
          <PageLoadingState />
        ) : history.isError ? (
          <PageErrorState onRetry={() => history.refetch()} />
        ) : (
          <>
            {history.data?.revisions.map((revision) => (
              <article
                key={revision.revision}
                className="space-y-space-xs border-b border-line-subtle py-space-sm"
              >
                <h4 className="text-sm">
                  {t('memory.revisions.version', {
                    revision: revision.revision,
                  })}{' '}
                  · {revision.origin}
                </h4>
                <p className="text-sm break-words whitespace-pre-wrap">
                  {revision.redacted
                    ? t('memory.revisions.redacted')
                    : revision.content}
                </p>
                <p className="text-xs text-fg-muted">
                  {t('memory.revisions.userAsserted')}
                </p>
                {revision.sources.map((source) => (
                  <MemorySourcePanel
                    key={`${revision.revision}:${source.source_id}`}
                    memoryId={memoryId}
                    sourceId={source.source_id}
                  />
                ))}
              </article>
            ))}
            <div className="flex gap-space-sm">
              <Button
                size="sm"
                variant="ghost"
                disabled={!cursor}
                onClick={() => setCursor(undefined)}
              >
                {t('memory.revisions.firstHistory')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!history.data?.next_cursor}
                onClick={() =>
                  setCursor(history.data?.next_cursor ?? undefined)
                }
              >
                {t('common.nextPage')}
              </Button>
            </div>
          </>
        )}
      </details>
    </section>
  )
}
