import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { MultiSelectWithSearch } from '@/components/ui/multi-select-with-search'
import { useMemoryList } from '@/hooks/use-memory'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

type MemorySelectFieldProps = {
  name?: string
  label?: string
}

export function MemorySelectField({
  name = 'memory_ids',
  label,
}: MemorySelectFieldProps) {
  const { t } = useTranslation()
  const form = useFormContext()
  const memoryQuery = useMemoryList({ page_size: 1000 })

  const options = (memoryQuery.data?.memory_list || []).map((item) => ({
    label: item.name,
    value: item.id,
  }))

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label || t('flow.memories', 'Memories')}</FormLabel>
          <FormControl>
            <MultiSelectWithSearch
              options={options}
              value={field.value || []}
              onChange={field.onChange}
              placeholder={t('flow.selectMemories', 'Select memories')}
              allowClear
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
