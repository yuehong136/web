import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useBuildNodeOutputOptions } from '../../hooks/use-build-options'
import useGraphStore from '../../store'
import { GroupedSelectWithSecondaryMenu } from './select-with-secondary-menu'
import {
  filterQueryVariableOptionGroupsByTypes,
  normalizeVariableReference,
  type QueryVariableOptionGroup,
} from './query-variable-utils'

type QueryVariableProps = {
  name?: string
  label?: string
  hideLabel?: boolean
  className?: string
  triggerClassName?: string
  onChange?: (value: string) => void
  types?: string[]
  nodeId?: string
  optionGroups?: QueryVariableOptionGroup[]
}

export function QueryVariable({
  name = 'query',
  label,
  hideLabel = false,
  className,
  triggerClassName,
  onChange,
  types,
  nodeId,
  optionGroups,
}: QueryVariableProps) {
  const { t } = useTranslation()
  const form = useFormContext()
  const clickedNodeId = useGraphStore((state) => state.clickedNodeId)
  const upstreamOptionGroups = useBuildNodeOutputOptions(nodeId || clickedNodeId)

  const options = useMemo(() => {
    return filterQueryVariableOptionGroupsByTypes(
      optionGroups || upstreamOptionGroups,
      types,
    ).map((group) => ({
      label: group.label,
      options: group.options.map((option) => ({
        label: option.label,
        value: option.value,
        parentLabel: group.title,
        type: (option as { type?: string }).type,
      })),
    }))
  }, [optionGroups, types, upstreamOptionGroups])

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {!hideLabel && (
            <FormLabel>{label || t('flow.query', 'Query')}</FormLabel>
          )}
          <FormControl>
            <GroupedSelectWithSecondaryMenu
              options={options}
              value={normalizeVariableReference(field.value)}
              onChange={(val) => {
                const nextValue = normalizeVariableReference(val)
                field.onChange(nextValue)
                onChange?.(nextValue)
              }}
              placeholder={t('flow.selectVariable', 'Select variable')}
              triggerClassName={triggerClassName}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
