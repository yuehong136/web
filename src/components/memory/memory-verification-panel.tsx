import { useState, useLayoutEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { v4 as uuid } from 'uuid'
import { useAuthStore } from '@/stores/auth'
import { APIError } from '@/api/client'
import { memoryAPI } from '@/api/memory'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import {
  PageErrorState,
  PageLoadingState,
  PageEmptyState,
} from '@/components/patterns/page-states'
import { useMemoryCapabilities } from '@/hooks/use-memory-revisions'
import {
  useMemoryVerificationReads,
  useMemoryVerificationCommand,
} from '@/hooks/use-memory-verification'
import { useMemoryActionScope } from '@/hooks/use-memory-action-scope'
import { memoryVerificationError } from '@/lib/memory-verification'
import type {
  MemoryVerificationCommand,
  MemoryVerificationRevocation,
} from '@/types/memory-verification'
import { MemoryVerificationSnapshot } from './memory-verification-snapshot'
import { MemoryVerificationRecord } from './memory-verification-record'
import {
  MemoryVerificationForm,
  type MemoryVerificationDraft,
} from './memory-verification-form'
type Command =
  | { kind: 'record'; body: MemoryVerificationCommand }
  | { kind: 'revoke'; recordId: string; body: MemoryVerificationRevocation }
export function MemoryVerificationPanel(props: {
  memoryId: string
  entryId: string
}) {
  const capability = useMemoryCapabilities(props.memoryId)
  const token = useAuthStore((state) => state.token)
  const [owner, setOwner] = useState({ token, generation: 0 })
  if (owner.token !== token)
    setOwner({ token, generation: owner.generation + 1 })
  return capability.data?.verification?.supported === true ? (
    <MemoryVerificationOwner key={owner.generation} {...props} />
  ) : null
}
function MemoryVerificationOwner({
  memoryId,
  entryId,
}: {
  memoryId: string
  entryId: string
}) {
  const { t } = useTranslation(),
    [params, setParams] = useSearchParams()
  const op = params.get('verification_operation') ?? '',
    opRef = useRef(op)
  useLayoutEffect(() => {
    opRef.current = op
  }, [op])
  const setOp = (id: string) => {
    opRef.current = id
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      if (id) {
        next.set('verification_operation', id)
        next.set('verification_entry', entryId)
      } else next.delete('verification_operation')
      return next
    })
  }
  const [cursor, setCursor] = useState<string>(),
    [prepared, setPrepared] = useState(false),
    [command, setCommand] = useState<Command>(),
    [error, setError] = useState('')
  const reads = useMemoryVerificationReads(memoryId, entryId, op, cursor, true)
  const action = useMemoryActionScope(memoryId, entryId, '')
  const mutation = useMemoryVerificationCommand(memoryId, (value: Command) =>
    value.kind === 'record'
      ? memoryAPI.verification.record(memoryId, entryId, value.body)
      : memoryAPI.verification.revoke(memoryId, value.recordId, value.body),
  )
  const submit = async (value: Command) => {
    const current = action()
    setCommand(structuredClone(value))
    setOp(value.body.operation_id)
    setError('')
    try {
      await mutation.mutateAsync(value)
      if (!current() || opRef.current !== value.body.operation_id) return
      setPrepared(false)
      setCommand(undefined)
      void reads.history.refetch()
    } catch (error) {
      if (!current() || opRef.current !== value.body.operation_id) return
      setError(memoryVerificationError(error))
      if (error instanceof APIError && [409, 422].includes(error.status)) {
        setPrepared(false)
        setCommand(undefined)
        setOp('')
      }
    }
  }
  const record = (draft: MemoryVerificationDraft) => {
    const snapshot = reads.snapshot.data
    if (
      !snapshot?.can_record ||
      snapshot.entry_content === null ||
      !prepared ||
      op
    )
      return
    void submit({
      kind: 'record',
      body: {
        ...draft,
        operation_id: `memory-verification-${uuid()}`,
        expected_head_version: snapshot.head_version,
        expected_binding_sha256: snapshot.binding_sha256,
      },
    })
  }
  const snapshot = reads.snapshot.data,
    locked = mutation.isPending || !!op
  return (
    <section
      className="min-w-0 space-y-space-base border-t border-border-subtle pt-space-base"
      aria-label={t('memory.verification.title')}
    >
      <h3 className="text-sm font-medium">{t('memory.verification.title')}</h3>
      <Alert variant="info">{t('memory.verification.boundary')}</Alert>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="h-auto min-h-9 max-w-full text-left whitespace-normal"
      >
        <Link
          to={`/memory/${encodeURIComponent(memoryId)}/verification?${new URLSearchParams({ verification_entry: entryId, ...(op ? { verification_operation: op } : {}) })}`}
        >
          {t('memory.verification.queueLink')}
        </Link>
      </Button>
      {op && (
        <div className="min-w-0 space-y-space-sm rounded-radius-lg border border-border-default p-space-base">
          <p className="text-xs">
            {t('memory.verification.originalOperation')}
          </p>
          <p className="font-mono text-xs break-all">{op}</p>
          <Button
            variant="outline"
            size="sm"
            disabled={mutation.isPending}
            onClick={() => void reads.operation.refetch()}
          >
            {t('memory.verification.read')}
          </Button>
          {reads.operation.isPending ? (
            <PageLoadingState />
          ) : reads.operation.isError ? (
            <Alert variant="warning">
              {t('memory.verification.operationUnconfirmed')}
            </Alert>
          ) : (
            reads.operation.data && (
              <>
                <Alert variant="info">
                  {t('memory.verification.recordingReady')}
                </Alert>
                <MemoryVerificationRecord value={reads.operation.data.record} />
                <Button
                  className="h-auto min-h-9 max-w-full text-left whitespace-normal"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOp('')
                    setPrepared(false)
                    setCommand(undefined)
                    setError('')
                  }}
                >
                  {t('memory.verification.finishOperation')}
                </Button>
              </>
            )
          )}
          {command && mutation.isError && !reads.operation.isSuccess && (
            <Button
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => void submit(command)}
            >
              {t('memory.verification.retry')}
            </Button>
          )}
        </div>
      )}
      {error && !reads.operation.isSuccess && (
        <Alert variant="warning">{t(error)}</Alert>
      )}
      <Button
        variant="outline"
        disabled={locked || reads.snapshot.isFetching}
        onClick={async () => {
          const current = action()
          setPrepared(false)
          const result = await reads.snapshot.refetch()
          if (current()) {
            setPrepared(!result.isError)
            setError('')
          }
        }}
      >
        {t('memory.verification.prepare')}
      </Button>
      {reads.snapshot.isError && (
        <PageErrorState onRetry={() => void reads.snapshot.refetch()} />
      )}
      {prepared && snapshot && (
        <>
          <MemoryVerificationSnapshot
            memoryId={memoryId}
            entryId={snapshot.entry_id}
            revision={snapshot.binding.entry.revision}
            content={snapshot.entry_content}
            contentHash={snapshot.binding.entry.content_sha256}
            scope={snapshot.binding.entry.scope}
            sources={snapshot.binding.sources.map((source) => ({
              sourceId: source.source_id,
              revision: source.source_revision,
              generation: source.source_generation,
              contentHash: source.content_sha256,
            }))}
          />
          {!snapshot.can_record && (
            <Alert variant="warning">{t('memory.verification.stale')}</Alert>
          )}
          {snapshot.can_record && snapshot.entry_content !== null && (
            <MemoryVerificationForm
              key={snapshot.binding_sha256 + ':' + snapshot.head_version}
              locked={locked}
              onSubmit={record}
            />
          )}
        </>
      )}
      <details className="min-w-0 space-y-space-sm" open>
        <summary className="cursor-pointer text-sm font-medium">
          {t('memory.verification.history')}
        </summary>
        {reads.history.isPending ? (
          <PageLoadingState />
        ) : reads.history.isError ? (
          <PageErrorState onRetry={() => reads.history.refetch()} />
        ) : !reads.history.data?.records.length ? (
          <PageEmptyState title={t('memory.verification.noRecords')} />
        ) : (
          reads.history.data.records.map((value) => (
            <MemoryVerificationRecord
              key={value.verification_id}
              value={value}
              locked={locked}
              onRevoke={(row, reason) =>
                void submit({
                  kind: 'revoke',
                  recordId: row.verification_id,
                  body: {
                    operation_id: `memory-verification-${uuid()}`,
                    expected_head_version: row.head_version,
                    reason,
                  },
                })
              }
            />
          ))
        )}
        <div className="flex flex-wrap gap-space-sm">
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
            disabled={!reads.history.data?.next_cursor}
            onClick={() =>
              setCursor(reads.history.data?.next_cursor ?? undefined)
            }
          >
            {t('common.nextPage')}
          </Button>
        </div>
      </details>
    </section>
  )
}
