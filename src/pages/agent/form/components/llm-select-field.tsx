import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { SelectWithSearch } from '@/components/ui/select-with-search'
import { useLLMGroupedOptions } from '@/hooks/use-llm-request'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

export type LLMType = 'chat' | 'embedding' | 'rerank'

interface LLMSelectFieldProps {
  name?: string
  label?: string
  type?: LLMType
  placeholder?: string
}

export function LLMSelectField({
  name = 'llm_id',
  label,
  type = 'chat',
  placeholder,
}: LLMSelectFieldProps) {
  const { t } = useTranslation()
  const form = useFormContext()
  const { options, isLoading } = useLLMGroupedOptions(type)

  const defaultLabel = type === 'chat'
    ? t('flow.model', 'Model')
    : type === 'embedding'
      ? t('flow.embeddingModel', 'Embedding Model')
      : t('flow.rerankModel', 'Rerank Model')

  const defaultPlaceholder = type === 'chat'
    ? t('flow.selectModel', 'Select model')
    : type === 'embedding'
      ? t('flow.selectEmbeddingModel', 'Select embedding model')
      : t('flow.selectRerankModel', 'Select rerank model')

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label || defaultLabel}</FormLabel>
          <FormControl>
            <SelectWithSearch
              options={options}
              value={field.value ?? ''}
              onChange={field.onChange}
              placeholder={placeholder || defaultPlaceholder}
              emptyText={isLoading ? t('common.loading', 'Loading...') : t('flow.noModels', 'No models available')}
              allowClear
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
