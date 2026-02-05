import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from 'react-i18next'
import { useFormContext } from 'react-hook-form'

export function DescriptionField() {
  const { t } = useTranslation()
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem className="flex-1">
          <FormLabel>{t('flow.description', 'Description')}</FormLabel>
          <FormControl>
            <Textarea {...field} />
          </FormControl>
        </FormItem>
      )}
    />
  )
}
