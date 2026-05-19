import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SelectWithSearch } from '@/components/ui/select-with-search'
import { Switch } from '@/components/ui/switch'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

type Option = {
  label: string
  value: string
}

type BaseFieldProps = {
  name: string
  label: string
}

export function ToolTextField({
  name,
  label,
  type = 'text',
  placeholder,
}: BaseFieldProps & {
  type?: 'text' | 'email' | 'number' | 'password'
  placeholder?: string
}) {
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              type={type}
              placeholder={placeholder}
              value={field.value ?? ''}
              onChange={(event) => {
                if (type === 'number') {
                  field.onChange(Number(event.target.value))
                  return
                }
                field.onChange(event.target.value)
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function ToolNumberField({
  name,
  label,
  fallback,
  min = 1,
  keepString = false,
}: BaseFieldProps & {
  fallback?: number
  min?: number
  keepString?: boolean
}) {
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={min}
              {...field}
              value={field.value ?? fallback ?? ''}
              onChange={(event) =>
                field.onChange(
                  keepString ? event.target.value : Number(event.target.value),
                )
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function ToolSelectField({
  name,
  label,
  options,
  searchable = false,
}: BaseFieldProps & {
  options: Option[]
  searchable?: boolean
}) {
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {searchable ? (
              <SelectWithSearch
                value={field.value}
                onChange={field.onChange}
                options={options}
              />
            ) : (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function ToolSwitchField({ name, label }: BaseFieldProps) {
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center justify-between">
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Switch
              checked={field.value ?? false}
              onCheckedChange={field.onChange}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

export function useFlowLabel() {
  const { t } = useTranslation()

  return (key: string, fallback: string) => t(`flow.${key}`, fallback)
}
