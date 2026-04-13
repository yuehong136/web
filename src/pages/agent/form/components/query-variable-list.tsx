import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { useMemo } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { JsonSchemaDataType } from '../../constant'
import { useBuildNodeOutputOptions } from '../../hooks/use-build-options'
import type { FormListHeaderProps } from './dynamic-form-header'
import { DynamicFormHeader } from './dynamic-form-header'
import { QueryVariable } from './query-variable'
import {
  filterQueryVariableOptionGroupsByTypes,
  flattenQueryVariableOptions,
} from './query-variable-utils'

type QueryVariableListProps = {
  name?: string
  types?: (typeof JsonSchemaDataType)[keyof typeof JsonSchemaDataType][]
} & FormListHeaderProps

export function QueryVariableList({
  name = 'query',
  types,
  label,
  tooltip,
}: QueryVariableListProps) {
  const form = useFormContext()
  const optionGroups = useBuildNodeOutputOptions()

  const availableValues = useMemo(() => {
    return flattenQueryVariableOptions(
      filterQueryVariableOptionGroupsByTypes(optionGroups, types),
    )
  }, [optionGroups, types])

  const { fields, remove, append } = useFieldArray({
    name,
    control: form.control,
  })

  return (
    <section className="space-y-space-sm">
      <DynamicFormHeader
        label={label}
        tooltip={tooltip}
        onClick={() => append({ input: availableValues.at(0)?.value ?? '' })}
        disabled={!availableValues.length}
      />
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
              />
              <Button type="button" variant="ghost" onClick={() => remove(index)}>
                <X className="text-text-secondary" />
              </Button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
