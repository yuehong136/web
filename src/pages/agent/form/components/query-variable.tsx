import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import useGraphStore from '../../store'

type QueryVariableProps = {
  name?: string
  label?: string
  hideLabel?: boolean
  className?: string
  onChange?: (value: string) => void
  types?: string[]
  triggerClassName?: string
  contentClassName?: string
}

export function QueryVariable({
  name = 'query',
  label,
  hideLabel = false,
  className,
  onChange,
  types,
  triggerClassName,
  contentClassName,
}: QueryVariableProps) {
  const { t } = useTranslation()
  const form = useFormContext()
  const nodes = useGraphStore((state) => state.nodes)

  // Build variable options from upstream nodes
  const options = useMemo(() => {
    const result: Array<{ label: string; value: string }> = []

    for (const node of nodes) {
      const nodeLabel = node.data?.label
      const nodeName = node.data?.name || nodeLabel
      const form = node.data?.form

      // Add node outputs as selectable variables
      if (form?.outputs && typeof form.outputs === 'object') {
        for (const key of Object.keys(form.outputs)) {
          result.push({
            label: `${nodeName}.${key}`,
            value: `{${node.id}@${key}}`,
          })
        }
      }
    }

    return result
  }, [nodes])

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {!hideLabel && (
            <FormLabel>
              {label || t('flow.query', 'Query')}
            </FormLabel>
          )}
          <FormControl>
            <Select
              value={field.value}
              onValueChange={(val) => {
                field.onChange(val)
                onChange?.(val)
              }}
            >
              <SelectTrigger className={triggerClassName}>
                <SelectValue placeholder={t('flow.selectVariable', 'Select variable')} />
              </SelectTrigger>
              <SelectContent className={contentClassName}>
                {options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
