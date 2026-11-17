import { useTranslation } from 'react-i18next'
import type { GatewayQuotaPeriod } from '@/api/model-gateway'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SegmentedControl } from '@/components/ui/segmented-control'
import type { LimitDraft, QuotaDraft } from '../form-model'
import { PREFIX } from '../utils'

interface LimitFieldsProps {
  idPrefix: string
  value: LimitDraft
  disabled?: boolean
  onChange: (next: LimitDraft) => void
}

const FIELDS = [
  ['rpm', `${PREFIX}.limits.rpm`],
  ['tpm', `${PREFIX}.limits.tpm`],
  ['parallel', `${PREFIX}.limits.parallel`],
] as const

/** Requests per minute, tokens per minute and concurrency; empty is unlimited. */
export const LimitFields = ({
  idPrefix,
  value,
  disabled,
  onChange,
}: LimitFieldsProps) => {
  const { t } = useTranslation()
  return (
    <div className="grid gap-space-md sm:grid-cols-3">
      {FIELDS.map(([field, labelKey]) => (
        <div key={field} className="space-y-space-xs">
          <Label htmlFor={`${idPrefix}-${field}`}>{t(labelKey)}</Label>
          <Input
            id={`${idPrefix}-${field}`}
            inputMode="numeric"
            value={value[field]}
            disabled={disabled}
            placeholder={t(`${PREFIX}.limits.unlimited`)}
            onChange={(event) =>
              onChange({ ...value, [field]: event.target.value })
            }
          />
        </div>
      ))}
    </div>
  )
}

interface QuotaFieldsProps {
  idPrefix: string
  value: QuotaDraft
  disabled?: boolean
  onChange: (next: QuotaDraft) => void
}

/** A token budget per UTC day or month; an empty amount means no quota. */
export const QuotaFields = ({
  idPrefix,
  value,
  disabled,
  onChange,
}: QuotaFieldsProps) => {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap items-end gap-space-md">
      <div className="min-w-48 flex-1 space-y-space-xs">
        <Label htmlFor={`${idPrefix}-quota-tokens`}>
          {t(`${PREFIX}.keyForm.quotaTokens`)}
        </Label>
        <Input
          id={`${idPrefix}-quota-tokens`}
          inputMode="numeric"
          value={value.tokens}
          disabled={disabled}
          placeholder={t(`${PREFIX}.quota.tokensPlaceholder`)}
          onChange={(event) =>
            onChange({ ...value, tokens: event.target.value })
          }
        />
      </div>
      <SegmentedControl<GatewayQuotaPeriod>
        aria-label={t(`${PREFIX}.keyForm.quotaPeriod`)}
        value={value.period}
        disabled={disabled}
        onValueChange={(period) => onChange({ ...value, period })}
        options={[
          { value: 'day', label: t(`${PREFIX}.quota.day`) },
          { value: 'month', label: t(`${PREFIX}.quota.month`) },
        ]}
      />
    </div>
  )
}
