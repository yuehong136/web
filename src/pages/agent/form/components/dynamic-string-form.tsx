import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormField,
  FormItem,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Trash2 } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import type { FormListHeaderProps } from './dynamic-form-header'
import { DynamicFormHeader } from './dynamic-form-header'

type DynamicStringFormProps = { name: string } & FormListHeaderProps

export function DynamicStringForm({ name, label }: DynamicStringFormProps) {
  const form = useFormContext()

  const { fields, append, remove } = useFieldArray({
    name: name,
    control: form.control,
  })

  return (
    <section>
      <DynamicFormHeader
        label={label}
        onClick={() => append({ value: '' })}
      />
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-space-sm">
            <FormField
              control={form.control}
              name={`${name}.${index}.value`}
              render={({ field: inputField }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input {...inputField} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </section>
  )
}
