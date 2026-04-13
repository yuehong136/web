import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import {
  SelectWithSearch,
  type SelectOptionGroup,
} from '@/components/ui/select-with-search'
import { Switch } from '@/components/ui/switch'
import type { ReactNode } from 'react'
import type { useFormContext } from 'react-hook-form'
import { FIELD_LABEL_CLASSNAME } from './constants'
import type { ParserFormValues } from './schema'

export function ParserFieldLabel({ children }: { children: ReactNode }) {
  return <FormLabel className={FIELD_LABEL_CLASSNAME}>{children}</FormLabel>
}

export function ParserSelectField({
  control,
  name,
  label,
  options,
  value,
  onValueChange,
  placeholder,
  emptyText,
  triggerClassName,
}: {
  control: ReturnType<typeof useFormContext<ParserFormValues>>['control']
  name: `setups.${number}.${string}`
  label: string
  options: SelectOptionGroup[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  emptyText?: string
  triggerClassName: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-space-md">
          <ParserFieldLabel>{label}</ParserFieldLabel>
          <FormControl>
            <SelectWithSearch
              options={options}
              value={value ?? field.value ?? ''}
              onChange={(nextValue) => {
                onValueChange?.(nextValue)
                field.onChange(nextValue)
              }}
              placeholder={placeholder}
              emptyText={emptyText}
              triggerClassName={triggerClassName}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function ParserSwitchField({
  control,
  name,
  label,
}: {
  control: ReturnType<typeof useFormContext<ParserFormValues>>['control']
  name: `setups.${number}.${string}`
  label: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex min-h-12 items-center justify-between rounded-radius-xl border border-border-default bg-surface-primary px-space-base py-space-sm">
          <ParserFieldLabel>{label}</ParserFieldLabel>
          <FormControl>
            <Switch
              checked={Boolean(field.value)}
              onCheckedChange={field.onChange}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}
