import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { LimitDraft, QuotaDraft } from '../form-model'

interface LimitFieldsProps {
  idPrefix: string
  value: LimitDraft
  disabled?: boolean
  onChange: (next: LimitDraft) => void
}

const FIELDS = [
  ['rpm', 'settings.modelGateway.limits.rpm'],
  ['tpm', 'settings.modelGateway.limits.tpm'],
  ['parallel', 'settings.modelGateway.limits.parallel'],
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
    <div className="grid gap-space-base sm:grid-cols-3">
      {FIELDS.map(([field, labelKey]) => (
        <div key={field} className="space-y-space-xs">
          <Label htmlFor={`${idPrefix}-${field}`}>{t(labelKey)}</Label>
          <Input
            id={`${idPrefix}-${field}`}
            inputMode="numeric"
            value={value[field]}
            disabled={disabled}
            placeholder={t('settings.modelGateway.limits.unlimited')}
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

/** A token budget per UTC day or month; "none" removes the quota. */
export const QuotaFields = ({
  idPrefix,
  value,
  disabled,
  onChange,
}: QuotaFieldsProps) => {
  const { t } = useTranslation()
  return (
    <div className="grid gap-space-base sm:grid-cols-3">
      <div className="space-y-space-xs">
        <Label htmlFor={`${idPrefix}-quota-period`}>
          {t('settings.modelGateway.quota.period')}
        </Label>
        <Select
          value={value.period}
          disabled={disabled}
          onValueChange={(period) =>
            onChange({ ...value, period: period as QuotaDraft['period'] })
          }
        >
          <SelectTrigger id={`${idPrefix}-quota-period`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              {t('settings.modelGateway.quota.none')}
            </SelectItem>
            <SelectItem value="day">
              {t('settings.modelGateway.quota.day')}
            </SelectItem>
            <SelectItem value="month">
              {t('settings.modelGateway.quota.month')}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-space-xs sm:col-span-2">
        <Label htmlFor={`${idPrefix}-quota-tokens`}>
          {t('settings.modelGateway.quota.tokens')}
        </Label>
        <Input
          id={`${idPrefix}-quota-tokens`}
          inputMode="numeric"
          value={value.tokens}
          disabled={disabled || value.period === 'none'}
          placeholder={t('settings.modelGateway.quota.tokensPlaceholder')}
          onChange={(event) =>
            onChange({ ...value, tokens: event.target.value })
          }
        />
      </div>
    </div>
  )
}
