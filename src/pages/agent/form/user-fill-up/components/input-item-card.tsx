import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BeginQueryType } from '@/pages/agent/constant'
import { memo } from 'react'
import type { Control } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import type { UserFillUpFormValues } from '../types'

interface InputItemCardProps {
  control: Control<UserFillUpFormValues>
  index: number
  onRemove: () => void
}

export const InputItemCard = memo(function InputItemCard({
  control,
  index,
  onRemove,
}: InputItemCardProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-2 rounded-radius-md border border-border-default p-space-sm">
      <FormField
        control={control}
        name={`inputs.${index}.name`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.name', 'Name')}</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ''} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`inputs.${index}.type`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.type', 'Type')}</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(BeginQueryType).map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`flow.${value}`, value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`inputs.${index}.value`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.defaultValue', 'Default')}</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ''} />
            </FormControl>
          </FormItem>
        )}
      />

      <div className="flex items-center justify-between gap-space-sm">
        <FormField
          control={control}
          name={`inputs.${index}.optional`}
          render={({ field }) => (
            <FormItem className="flex items-center gap-space-sm">
              <FormControl>
                <Checkbox
                  checked={!!field.value}
                  onCheckedChange={(value) => field.onChange(Boolean(value))}
                />
              </FormControl>
              <FormLabel>{t('flow.optional', 'Optional')}</FormLabel>
            </FormItem>
          )}
        />

        <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
})
