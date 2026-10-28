import { useTranslation } from 'react-i18next'
import { useFormContext } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { ModelSelect } from '@/components/models/model-select'
import type { ModelOption } from '@/components/models/model-select-options'
import type { SelectOptionGroup } from '@/components/ui/select-with-search'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'

interface EmbeddingModelFormFieldProps {
  name?: string
  options: SelectOptionGroup[]
  knownOptions?: ModelOption[]
  error?: unknown
  onRetry?: () => unknown
  loading?: boolean
  disabled?: boolean
  className?: string
}

export function EmbeddingModelFormField({
  name = 'embd_id',
  options,
  knownOptions,
  error,
  onRetry,
  loading = false,
  disabled = false,
  className,
}: EmbeddingModelFormFieldProps) {
  const { t } = useTranslation()
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn('flex items-center gap-1 space-y-0', className)}
        >
          <FormLabel
            required
            tooltip={t('knowledge.settings.fields.embeddingModelTooltip')}
            className="w-1/4 shrink-0 text-sm text-text-secondary"
          >
            {t('knowledge.settings.fields.embeddingModel')}
          </FormLabel>
          <div className="w-3/4">
            <FormControl>
              <ModelSelect
                value={field.value}
                onChange={field.onChange}
                options={options}
                knownOptions={knownOptions}
                loading={loading}
                error={error}
                onRetry={onRetry}
                placeholder={
                  loading
                    ? t('knowledge.settings.fields.loading')
                    : t('knowledge.settings.fields.embeddingModelPlaceholder')
                }
                disabled={disabled || loading}
              />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
