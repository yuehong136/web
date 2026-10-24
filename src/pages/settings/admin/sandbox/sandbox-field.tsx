import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { SandboxField as Field, SandboxValue } from './types'

interface Props {
  name: string
  field: Field
  value: SandboxValue | undefined
  savedSecret: boolean
  onChange: (value: SandboxValue) => void
  onClear: () => void
}

export function SandboxField({
  name,
  field,
  value,
  savedSecret,
  onChange,
  onClear,
}: Props) {
  const { t } = useTranslation()
  const id = `sandbox-${name}`
  const label = t(`sandbox.fields.${name}`, {
    defaultValue: field.label ?? name,
  })
  const required = field.required && !savedSecret
  const common = {
    id,
    disabled: Boolean(field.readonly),
    required,
    autoComplete: 'off',
  }
  const displayValue = field.readonly ? field.default : value
  return (
    <div className="min-w-0 space-y-space-sm">
      <Label htmlFor={id}>
        {label}
        {required ? ' *' : ''}
      </Label>
      {field.type === 'boolean' ? (
        <div className="flex items-center gap-space-sm">
          <Switch
            id={id}
            checked={Boolean(displayValue)}
            disabled={field.readonly}
            onCheckedChange={onChange}
          />
          <span className="text-sm text-text-secondary">
            {displayValue ? t('sandbox.enabled') : t('sandbox.disabled')}
          </span>
        </div>
      ) : field.multiline ? (
        <Textarea
          {...common}
          rows={5}
          value={String(displayValue ?? '')}
          onChange={(event) => onChange(event.target.value)}
          placeholder={savedSecret ? t('sandbox.keepSecret') : undefined}
          className="font-mono"
          spellCheck={false}
        />
      ) : (
        <Input
          {...common}
          type={
            field.type === 'integer'
              ? 'number'
              : field.secret
                ? 'password'
                : 'text'
          }
          min={field.min}
          max={field.max}
          step={field.type === 'integer' ? 1 : undefined}
          value={
            typeof displayValue === 'boolean'
              ? String(displayValue)
              : (displayValue ?? '')
          }
          onChange={(event) =>
            onChange(
              field.type === 'integer' && event.target.value !== ''
                ? Number(event.target.value)
                : event.target.value,
            )
          }
          placeholder={savedSecret ? t('sandbox.keepSecret') : undefined}
        />
      )}
      {field.secret && savedSecret ? (
        <div className="flex items-center justify-between gap-space-sm text-xs text-text-secondary">
          <span>{t('sandbox.secretConfigured')}</span>
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            {t('sandbox.clearSecret')}
          </Button>
        </div>
      ) : null}
      {field.type === 'integer' ? (
        <p className="text-xs text-text-caption">
          {t('sandbox.range', { min: field.min ?? 0, max: field.max ?? '—' })}
        </p>
      ) : null}
    </div>
  )
}
