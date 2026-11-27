import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { APIError } from '@/api/client'
import type {
  GatewayImportBatch,
  GatewayImportReport,
} from '@/api/model-gateway'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useImportGatewayKeys } from '@/hooks/use-model-gateway-request'
import { downloadTextFile } from '@/lib/download'
import { PREFIX } from '../../utils'
import {
  exampleManifest,
  ManifestError,
  readImportManifest,
} from './import-manifest'

const label = `${PREFIX}.keyImport`

export function ImportKeysDialog({
  tenantId,
  onClose,
}: {
  tenantId: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const mutation = useImportGatewayKeys()
  const [file, setFile] = useState<File>()
  const [review, setReview] = useState<{
    batch: GatewayImportBatch
    report: GatewayImportReport
  }>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const blocked = review?.report.results.some((row) => row.error)
  const canApply =
    review &&
    !blocked &&
    review.report.results.some((row) => row.action === 'would_import')
  const run = async (mode: 'preview' | 'apply') => {
    if (busy || !file || (mode === 'apply' && !canApply)) return
    setBusy(true)
    setError('')
    try {
      const batch =
        mode === 'apply' && review
          ? review.batch
          : await readImportManifest(file, tenantId)
      const report = await mutation.mutateAsync({ mode, batch })
      setReview({ batch, report })
    } catch (err) {
      setReview(undefined)
      if (err instanceof ManifestError) {
        setError(
          [
            err.row && t(`${label}.row`, { row: err.row }),
            t(`${label}.${err.reason}`),
          ]
            .filter(Boolean)
            .join(' '),
        )
      } else {
        const status = err instanceof APIError ? err.status : 0
        const reason =
          (
            {
              403: 'permission',
              404: 'unavailable',
              409: 'concurrent',
              413: 'fileSize',
              422: 'invalid',
            } as Record<number, string>
          )[status] ?? 'failure'
        const row =
          err instanceof APIError && status === 422
            ? /at row (\d+)/.exec(err.message)?.[1]
            : undefined
        setError(
          [row && t(`${label}.row`, { row }), t(`${label}.${reason}`)]
            .filter(Boolean)
            .join(' '),
        )
      }
    } finally {
      mutation.reset()
      setBusy(false)
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose()
      }}
    >
      <DialogContent size="lg" showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>{t(`${label}.title`)}</DialogTitle>
          <DialogDescription>{t(`${label}.description`)}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-space-md">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadTextFile(
                exampleManifest(tenantId),
                'gateway-keys.json',
                'application/json',
              )
            }
          >
            {t(`${label}.template`)}
          </Button>
          <Input
            label={t(`${label}.file`)}
            type="file"
            accept=".json,application/json"
            disabled={busy}
            className="block w-full"
            onChange={(e) => {
              setFile(e.target.files?.[0])
              setReview(undefined)
              setError('')
            }}
          />
          {error && (
            <p role="alert" className="text-sm text-danger-fg">
              {error}
            </p>
          )}
          {review && (
            <>
              <output>
                {t(
                  `${label}.${blocked ? 'blocked' : review.report.applied ? 'done' : 'review'}`,
                  { count: review.report.results.length },
                )}
              </output>
              <ul className="max-h-64 space-y-space-xs overflow-y-auto">
                {review.report.results.map((row, index) => {
                  const policy = row.requested_policy
                  const outcome = row.error
                    ? t(`${label}.reasons.${row.error}`, {
                        defaultValue: row.error,
                      })
                    : t(`${label}.${row.action}`)
                  return (
                    <li
                      key={index}
                      className="border-b border-border py-space-xs text-sm"
                    >
                      <div className="font-medium">
                        {row.name} · {row.source_id} · {outcome}
                      </div>
                      {row.unresolved?.length ? (
                        <div>{row.unresolved.join(', ')}</div>
                      ) : null}
                      {row.action === 'already_imported' ? (
                        t(`${PREFIX}.keyStatus.${row.current_status}`)
                      ) : (
                        <div className="text-fg-subtle">
                          {t(`${PREFIX}.keyStatus.${policy.status}`)} ·{' '}
                          {policy.expires_at ?? t(`${label}.never`)} ·{' '}
                          {policy.allow_all_models
                            ? t(`${label}.all`)
                            : t(`${label}.scope`, {
                                models: policy.allowed_model_ids.length,
                                connections: policy.allowed_instance_ids.length,
                              })}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={onClose}>
            {t('common.close')}
          </Button>
          {!review && (
            <Button
              disabled={!file || busy}
              loading={busy}
              onClick={() => void run('preview')}
            >
              {t(`${label}.preview`)}
            </Button>
          )}
          {canApply && (
            <Button
              disabled={busy}
              loading={busy}
              onClick={() => void run('apply')}
            >
              {t(`${label}.apply`)}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
