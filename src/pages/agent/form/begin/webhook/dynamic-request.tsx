import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormField,
  FormItem,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SelectWithSearch } from '@/components/ui/select-with-search'
import { Switch } from '@/components/ui/switch'
import { Trash2 } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import type { ReactNode } from 'react'
import { DynamicFormHeader } from '../../components'

function buildOptions(values: string[]) {
  return values.map((value) => ({
    label: value,
    value,
  }))
}

interface DynamicRequestProps {
  name: string
  label: ReactNode
  operatorList: string[]
}

export function DynamicRequest({
  name,
  label,
  operatorList,
}: DynamicRequestProps) {
  const form = useFormContext()
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name,
  })

  return (
    <section className="space-y-space-sm">
      <DynamicFormHeader
        label={label}
        onClick={() =>
          append({
            key: '',
            type: operatorList[0] || 'string',
            required: false,
          })
        }
      />
      <div className="space-y-space-md">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-start gap-space-sm rounded-radius-md border border-border-default px-space-sm py-space-sm"
          >
            <div className="grid min-w-0 flex-1 gap-space-sm md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto]">
              <FormField
                control={form.control}
                name={`${name}.${index}.key`}
                render={({ field: keyField }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...keyField}
                        value={keyField.value ?? ''}
                        placeholder="key"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`${name}.${index}.type`}
                render={({ field: typeField }) => (
                  <FormItem>
                    <FormControl>
                      <SelectWithSearch
                        value={typeField.value || operatorList[0] || 'string'}
                        onChange={typeField.onChange}
                        options={buildOptions(operatorList)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`${name}.${index}.required`}
                render={({ field: requiredField }) => (
                  <FormItem className="flex h-10 items-center justify-between gap-space-sm rounded-radius-md border border-border-default px-space-sm">
                    <span className="text-sm text-text-secondary">Required</span>
                    <FormControl>
                      <Switch
                        checked={Boolean(requiredField.value)}
                        onCheckedChange={(checked) =>
                          requiredField.onChange(Boolean(checked))
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

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
