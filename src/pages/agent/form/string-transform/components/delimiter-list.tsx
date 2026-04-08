import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { memo } from 'react'
import type { Control } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'

interface DelimiterListProps {
  control: Control<{ delimiters?: string[] }>
  fields: Array<{ id: string }>
  onAppend: () => void
  onRemove: (index: number) => void
}

export const DelimiterList = memo(function DelimiterList({
  control,
  fields,
  onAppend,
  onRemove,
}: DelimiterListProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <FormLabel>{t('flow.delimiters', 'Delimiters')}</FormLabel>
        <Button type="button" variant="ghost" size="icon" onClick={onAppend}>
          <Plus className="size-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-space-sm">
            <FormField
              control={control}
              name={`delimiters.${index}`}
              render={({ field: inputField }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input {...inputField} value={inputField.value ?? ''} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(index)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
})
