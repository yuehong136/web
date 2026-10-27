import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { KnowledgeBaseSelector } from '@/components/knowledge/KnowledgeBaseSelector'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

interface KnowledgeBaseSelectFieldProps {
  name?: string
  label?: string
  placeholder?: string
}

export function KnowledgeBaseSelectField({
  name = 'dataset_ids',
  label,
  placeholder,
}: KnowledgeBaseSelectFieldProps) {
  const { t } = useTranslation()
  const form = useFormContext()
  const legacyKbIds = useWatch({
    control: form.control,
    name: 'kb_ids',
  }) as string[] | undefined

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label || t('flow.knowledgeBases', 'Knowledge Bases')}
          </FormLabel>
          <FormControl>
            <KnowledgeBaseSelector
              knowledgeBases={[]}
              showLabel={false}
              selectedIds={
                field.value ??
                (name === 'dataset_ids' ? legacyKbIds : undefined) ??
                []
              }
              onChange={(value) => {
                field.onChange(value)
                if (name === 'dataset_ids') {
                  form.setValue('kb_ids', value, { shouldDirty: true })
                }
              }}
              placeholder={
                placeholder ||
                t('flow.selectKnowledgeBases', 'Select knowledge bases')
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
