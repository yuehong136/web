import { useState, useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { humanVerificationCurrent } from '@/lib/memory-verification'
import type { MemoryVerificationRecord as Record } from '@/types/memory-verification'
export function MemoryVerificationRecord({
  value,
  locked = false,
  onRevoke,
}: {
  value: Record
  locked?: boolean
  onRevoke?: (record: Record, reason: string) => void
}) {
  const { t } = useTranslation(),
    id = useId(),
    [reason, setReason] = useState(''),
    [confirmed, setConfirmed] = useState(false)
  const redacted =
    value.state === 'redacted' || value.effective_status === 'redacted'
  return (
    <article className="min-w-0 space-y-space-sm rounded-radius-lg border border-border-default p-space-base">
      <Alert variant={humanVerificationCurrent(value) ? 'success' : 'warning'}>
        {t(`memory.verification.statuses.${value.effective_status}`)}
      </Alert>
      <dl className="grid min-w-0 grid-cols-1 gap-space-xs text-xs sm:grid-cols-2">
        <dt>{t('memory.verification.recordId')}</dt>
        <dd className="min-w-0 font-mono break-all">{value.verification_id}</dd>
        <dt>{t('memory.verification.entryId')}</dt>
        <dd className="min-w-0 font-mono break-all">{value.entry_id}</dd>
        <dt>{t('memory.verification.originalConclusion')}</dt>
        <dd>{t(`memory.verification.results.${value.result}`)}</dd>
        <dt>{t('memory.verification.method')}</dt>
        <dd>{t(`memory.verification.methods.${value.method}`)}</dd>
        <dt>{t('memory.verification.reviewedBy')}</dt>
        <dd className="min-w-0 font-mono break-all">{value.actor_id}</dd>
        <dt>{t('memory.verification.createdAt')}</dt>
        <dd className="min-w-0 break-all">{value.recorded_at}</dd>
        <dt>
          {t(
            value.checked_at_is_user_reported
              ? 'memory.verification.checkedAt'
              : 'memory.verification.defaultCheckTime',
          )}
        </dt>
        <dd className="min-w-0 break-all">{value.checked_at}</dd>
      </dl>
      <p className="text-xs text-text-secondary">
        {t(
          value.checked_at_is_user_reported
            ? 'memory.verification.reportedTime'
            : 'memory.verification.defaultTimeBoundary',
        )}
      </p>
      {!!value.stale_reasons.length && (
        <ul className="space-y-space-xs text-xs">
          {value.stale_reasons.map((reason) => (
            <li key={reason}>
              {t(`memory.verification.staleReasons.${reason}`, {
                defaultValue: t('memory.verification.staleReasons.other'),
              })}
            </li>
          ))}
        </ul>
      )}
      {value.review_required && (
        <p className="text-xs text-status-warning">
          {t('memory.verification.needsReviewBoundary')}
        </p>
      )}
      {redacted ? (
        <Alert variant="warning">{t('memory.verification.redacted')}</Alert>
      ) : (
        <>
          <h4 className="text-sm font-medium">
            {t('memory.verification.applicability')}
          </h4>
          <p className="text-sm wrap-anywhere whitespace-pre-wrap">
            {value.applicability}
          </p>
          <h4 className="text-sm font-medium">
            {t('memory.verification.evidence')}
          </h4>
          <p className="text-sm wrap-anywhere whitespace-pre-wrap">
            {value.notes}
          </p>
          <ul className="space-y-space-sm text-sm">
            {value.evidence.map((item, index) => (
              <li key={index} className="min-w-0">
                <p className="wrap-anywhere whitespace-pre-wrap">
                  {item.description}
                </p>
                <p className="font-mono text-xs wrap-anywhere whitespace-pre-wrap">
                  {item.reference}
                </p>
              </li>
            ))}
          </ul>
          {value.revocation_reason && (
            <p className="text-sm wrap-anywhere whitespace-pre-wrap">
              {value.revocation_reason}
            </p>
          )}
        </>
      )}
      <details className="min-w-0 text-xs">
        <summary>{t('memory.verification.binding')}</summary>
        <pre className="mt-space-sm wrap-anywhere whitespace-pre-wrap">
          {JSON.stringify(value.binding, null, 2)}
        </pre>
      </details>
      {onRevoke && value.can_actions.revoke && (
        <div className="space-y-space-sm">
          <Label htmlFor={`${id}-reason`}>
            {t('memory.verification.reason')}
          </Label>
          <Input
            id={`${id}-reason`}
            maxLength={1024}
            value={reason}
            disabled={locked}
            onChange={(event) => {
              setReason(event.target.value)
              setConfirmed(false)
            }}
          />
          <div className="flex items-start gap-space-sm">
            <Checkbox
              id={`${id}-revoke`}
              checked={confirmed}
              disabled={locked}
              onCheckedChange={(value) => setConfirmed(value === true)}
            />
            <Label htmlFor={`${id}-revoke`}>
              {t('memory.verification.revokeConfirm')}
            </Label>
          </div>
          <Button
            variant="outline"
            disabled={
              locked || !confirmed || !reason.trim() || reason.length > 1024
            }
            onClick={() => onRevoke(value, reason)}
          >
            {t('memory.verification.revoke')}
          </Button>
        </div>
      )}
    </article>
  )
}
