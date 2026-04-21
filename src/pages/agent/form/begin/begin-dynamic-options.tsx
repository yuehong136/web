import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Trash2 } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

export function BeginDynamicOptions() {
  const { t } = useTranslation()
  const form = useFormContext()
  const name = 'options'

  const { fields, append, remove } = useFieldArray({
    name,
    control: form.control,
  })

  return (
    <section className="space-y-space-sm">
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-start gap-space-sm">
          <FormField
            control={form.control}
            name={`${name}.${index}.value`}
            render={({ field: inputField }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    {...inputField}
                    value={`${inputField.value ?? ''}`}
                    placeholder={t('common.pleaseInput', 'Please input')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => remove(index)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ value: '' })}
      >
        {t('flow.addField', 'Add field')}
      </Button>
    </section>
  )
}
