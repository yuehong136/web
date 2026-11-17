import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SegmentedControl } from '@/components/ui/segmented-control'
import {
  EXPIRY_PRESETS,
  parseExpiry,
  presetExpiry,
  type ExpiryDraft,
  type ExpiryPreset,
} from '../../form-model'
import { PREFIX, formatInstant } from '../../utils'

interface ExpiryFieldProps {
  value: ExpiryDraft
  disabled?: boolean
  onChange: (next: ExpiryDraft) => void
}

/** Never, 30/90/365 days to the end of that local day, or a custom time. */
export function ExpiryField({ value, disabled, onChange }: ExpiryFieldProps) {
  const { t } = useTranslation()
  let hint: string
  if (value.preset === 'never') hint = t(`${PREFIX}.keyForm.expiryNeverHint`)
  else if (value.preset === 'custom') {
    const at = parseExpiry(value.custom)
    hint = at
      ? t(`${PREFIX}.keyForm.expiryAt`, { value: formatInstant(at) })
      : t(`${PREFIX}.keyForm.expiryCustomHint`)
  } else
    hint = t(`${PREFIX}.keyForm.expiryAt`, {
      value: formatInstant(presetExpiry(Number(value.preset)).toISOString()),
    })

  return (
    <div className="flex flex-col gap-space-sm">
      <span
        id="gateway-key-expiry-label"
        className="text-sm font-medium text-text-primary"
      >
        {t(`${PREFIX}.keyForm.expiry`)}
      </span>
      <SegmentedControl<ExpiryPreset>
        aria-labelledby="gateway-key-expiry-label"
        aria-describedby="gateway-key-expiry-hint"
        className="flex-wrap"
        value={value.preset}
        disabled={disabled}
        onValueChange={(preset) => onChange({ ...value, preset })}
        options={EXPIRY_PRESETS.map((preset) => ({
          value: preset,
          label: t(`${PREFIX}.keyForm.expiryOptions.${preset}`),
        }))}
      />
      {value.preset === 'custom' ? (
        <div className="max-w-64 space-y-space-xs">
          <Label htmlFor="gateway-key-expiry-custom" className="sr-only">
            {t(`${PREFIX}.keyForm.expiryCustomLabel`)}
          </Label>
          <Input
            id="gateway-key-expiry-custom"
            type="datetime-local"
            value={value.custom}
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...value, custom: event.target.value })
            }
          />
        </div>
      ) : null}
      <p id="gateway-key-expiry-hint" className="text-xs text-text-tertiary">
        {hint}
      </p>
    </div>
  )
}
