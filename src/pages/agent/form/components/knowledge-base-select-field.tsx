import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { MultiSelectWithSearch } from '@/components/ui/multi-select-with-search'
import { useKnowledgeOptions } from '@/hooks/use-knowledge-request'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

interface KnowledgeBaseSelectFieldProps {
  name?: string
  label?: string
  placeholder?: string
}

export function KnowledgeBaseSelectField({
  name = 'kb_ids',
  label,
  placeholder,
}: KnowledgeBaseSelectFieldProps) {
  const { t } = useTranslation()
  const form = useFormContext()
  const { options, isLoading } = useKnowledgeOptions()

  // Transform to SelectOptionGroup format (flat list without groups)
  const selectOptions = options.map((opt) => ({
    label: opt.label,
    value: opt.value,
  }))

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label || t('flow.knowledgeBases', 'Knowledge Bases')}</FormLabel>
          <FormControl>
            <MultiSelectWithSearch
              options={selectOptions}
              value={field.value ?? []}
              onChange={field.onChange}
              placeholder={placeholder || t('flow.selectKnowledgeBases', 'Select knowledge bases')}
              emptyText={isLoading ? t('common.loading', 'Loading...') : t('flow.noKnowledgeBases', 'No knowledge bases available')}
              allowClear
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
