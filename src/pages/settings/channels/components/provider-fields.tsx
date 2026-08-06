import { CheckCircle2, KeyRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import type { ChannelFormField } from '@/api/channel'
import { fieldKey, isRenderableKind } from '../form-spec'
import type { ChannelFormValues } from '../form-model'

interface ProviderFieldsProps {
  fields: readonly ChannelFormField[]
  secretConfigured: boolean
}

/**
 * Field copy, preferring a local translation over the server's label.
 *
 * Both layers matter: an existing locale entry keeps winning, and a provider
 * the frontend has never heard of is still usable immediately because the
 * server ships an English label with every field.
 */
const useFieldCopy = (field: ChannelFormField) => {
  const { t } = useTranslation()
  const key = field.i18n_key ?? `channel.fields.${fieldKey(field)}`
  return {
    label: t(`${key}.label`, {
      defaultValue: t(key, { defaultValue: field.label }),
    }),
    description: t(`${key}.description`, {
      defaultValue: field.help_text ?? '',
    }),
    placeholder: t(`${key}.placeholder`, {
      defaultValue: field.placeholder ?? '',
    }),
  }
}

const ProviderField = ({
  field,
  secretConfigured,
}: {
  field: ChannelFormField
  secretConfigured: boolean
}) => {
  const { t } = useTranslation()
  const copy = useFieldCopy(field)
  const key = fieldKey(field)
  const name = `${field.secret ? 'secrets' : 'config'}.${key}` as
    | `secrets.${string}`
    | `config.${string}`

  const isKnownKind = isRenderableKind(field.kind)

  return (
    <FormField<ChannelFormValues, typeof name>
      name={name}
      render={({ field: formField }) => (
        <FormItem>
          <div className="gap-space-sm flex items-center justify-between">
            <FormLabel required={field.required}>{copy.label}</FormLabel>
            {field.secret && secretConfigured ? (
              <span className="gap-space-xs flex items-center text-xs text-status-success">
                <CheckCircle2 className="size-icon-sm" aria-hidden="true" />
                {t('channel.secret.configured')}
              </span>
            ) : null}
          </div>
          <FormControl>
            {!isKnownKind ? (
              // An unknown kind renders disabled rather than throwing, so a
              // server that introduces a control type does not need a
              // coordinated frontend release to stay usable.
              <Input
                value=""
                disabled
                readOnly
                placeholder={t('channel.form.unsupportedField', {
                  defaultValue: field.label,
                })}
              />
            ) : field.kind === 'switch' ? (
              <Switch
                checked={formField.value === true}
                onCheckedChange={formField.onChange}
              />
            ) : field.kind === 'select' ? (
              <Select
                value={
                  typeof formField.value === 'string' ? formField.value : ''
                }
                onValueChange={formField.onChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder={copy.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {(field.options ?? []).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.kind === 'string_list' ? (
              <Textarea
                name={formField.name}
                ref={formField.ref}
                onBlur={formField.onBlur}
                onChange={formField.onChange}
                value={
                  typeof formField.value === 'string' ? formField.value : ''
                }
                rows={4}
                placeholder={copy.placeholder}
              />
            ) : (
              <Input
                name={formField.name}
                ref={formField.ref}
                onBlur={formField.onBlur}
                onChange={formField.onChange}
                value={
                  typeof formField.value === 'string' ? formField.value : ''
                }
                type={field.secret ? 'password' : 'text'}
                autoComplete={field.secret ? 'new-password' : 'off'}
                spellCheck={false}
                maxLength={field.max_length ?? undefined}
                leftIcon={
                  field.secret ? (
                    <KeyRound className="size-icon-sm" aria-hidden="true" />
                  ) : undefined
                }
                placeholder={
                  field.secret && secretConfigured
                    ? t('channel.secret.keepPlaceholder')
                    : copy.placeholder
                }
              />
            )}
          </FormControl>
          {copy.description ? (
            <FormDescription>{copy.description}</FormDescription>
          ) : null}
          {field.secret && secretConfigured ? (
            <FormDescription>{t('channel.secret.keepHelp')}</FormDescription>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export const ProviderFields = ({
  fields,
  secretConfigured,
}: ProviderFieldsProps) => (
  <div className="space-y-space-base">
    {fields.map((field) => (
      <ProviderField
        key={field.path}
        field={field}
        secretConfigured={secretConfigured}
      />
    ))}
  </div>
)
