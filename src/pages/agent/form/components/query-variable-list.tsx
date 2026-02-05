import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { JsonSchemaDataType } from '../../constant'
import { DynamicFormHeader } from './dynamic-form-header'
import type { FormListHeaderProps } from './dynamic-form-header'
import { QueryVariable } from './query-variable'

type QueryVariableListProps = {
  types?: (typeof JsonSchemaDataType)[keyof typeof JsonSchemaDataType][]
} & FormListHeaderProps

export function QueryVariableList({
  types,
  label,
  tooltip,
}: QueryVariableListProps) {
  const form = useFormContext()
  const name = 'query'

  // TODO: Implement useFilterQueryVariableOptionsByTypes hook
  const options: Array<{ options: Array<{ value: string }> }> = []
  const secondOptions = options.flatMap((x) => x.options)

  const { fields, remove, append } = useFieldArray({
    name: name,
    control: form.control,
  })

  return (
    <section className="space-y-space-sm">
      <DynamicFormHeader
        label={label}
        tooltip={tooltip}
        onClick={() => append({ input: secondOptions.at(0)?.value })}
        disabled={!secondOptions.length}
      ></DynamicFormHeader>
      <div className="space-y-space-lg">
        {fields.map((field, index) => {
          const nameField = `${name}.${index}.input`

          return (
            <div key={field.id} className="flex gap-space-sm">
              <QueryVariable
                name={nameField}
                hideLabel
                className="flex-1"
                types={types}
              ></QueryVariable>
              <Button variant={'ghost'} onClick={() => remove(index)}>
                <X className="text-text-secondary" />
              </Button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
