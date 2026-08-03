import { CheckCircle2, KeyRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import type { ChannelProviderManifest } from '@/api/channel'
import {
  getProviderFields,
  type ChannelFormValues,
  type ProviderFieldDefinition,
} from '../form-model'

interface ProviderFieldsProps {
  manifest: ChannelProviderManifest
  secretConfigured: boolean
}

const useFieldCopy = (field: ProviderFieldDefinition) => {
  const { t } = useTranslation()
  return {
    label: t(`channel.fields.${field.key}.label`, {
      defaultValue: field.title ?? field.key,
    }),
    description: t(`channel.fields.${field.key}.description`, {
      defaultValue: field.description ?? '',
    }),
    placeholder: t(`channel.fields.${field.key}.placeholder`, {
      defaultValue: '',
    }),
  }
}

const ProviderField = ({
  field,
  secretConfigured,
}: {
  field: ProviderFieldDefinition
  secretConfigured: boolean
}) => {
  const { t } = useTranslation()
  const copy = useFieldCopy(field)
  const name =
    `${field.kind === 'secret' ? 'secrets' : 'config'}.${field.key}` as
      | `secrets.${string}`
      | `config.${string}`

  return (
    <FormField<ChannelFormValues, typeof name>
      name={name}
      render={({ field: formField }) => (
        <FormItem>
          <div className="gap-space-sm flex items-center justify-between">
            <FormLabel required={field.required}>{copy.label}</FormLabel>
            {field.kind === 'secret' && secretConfigured ? (
              <span className="gap-space-xs flex items-center text-xs text-status-success">
                <CheckCircle2 className="size-icon-sm" aria-hidden="true" />
                {t('channel.secret.configured')}
              </span>
            ) : null}
          </div>
          <FormControl>
            {field.kind === 'string_list' ? (
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
                type={field.kind === 'secret' ? 'password' : 'text'}
                autoComplete={field.kind === 'secret' ? 'new-password' : 'off'}
                spellCheck={false}
                leftIcon={
                  field.kind === 'secret' ? (
                    <KeyRound className="size-icon-sm" aria-hidden="true" />
                  ) : undefined
                }
                placeholder={
                  field.kind === 'secret' && secretConfigured
                    ? t('channel.secret.keepPlaceholder')
                    : copy.placeholder
                }
              />
            )}
          </FormControl>
          {copy.description ? (
            <FormDescription>{copy.description}</FormDescription>
          ) : null}
          {field.kind === 'secret' && secretConfigured ? (
            <FormDescription>{t('channel.secret.keepHelp')}</FormDescription>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export const ProviderFields = ({
  manifest,
  secretConfigured,
}: ProviderFieldsProps) => (
  <div className="space-y-space-base">
    {getProviderFields(manifest).map((field) => (
      <ProviderField
        key={field.key}
        field={field}
        secretConfigured={secretConfigured}
      />
    ))}
  </div>
)
