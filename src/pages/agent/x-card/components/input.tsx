import { Button as UIButton } from '@/components/ui/button'
import { Checkbox as UICheckbox } from '@/components/ui/checkbox'
import { Input as UIInput } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider as UISlider } from '@/components/ui/slider'
import {
  normalizeOption,
  renderButtonContent,
  toArray,
  toBoolean,
  toDisplayString,
  toNumber,
  toWritableDataPath,
  type ActionComponentProps,
  type CommonProps,
  type DataComponentProps,
} from './shared'

export function XCardButton({
  action,
  children,
  onAction,
  variant = 'default',
}: ActionComponentProps & CommonProps & {
  variant?: 'borderless' | 'default' | 'primary'
}) {
  const buttonVariant =
    variant === 'primary' ? 'default' : variant === 'borderless' ? 'ghost' : 'outline'

  return (
    <UIButton
      type="button"
      variant={buttonVariant}
      size="sm"
      className="w-full [&_*]:text-current"
      onClick={() => {
        const name = action?.event?.name
        if (name) onAction?.(name, {})
      }}
    >
      {renderButtonContent(children)}
    </UIButton>
  )
}

export function XCardTextField({
  dataPath,
  label,
  onDataChange,
  value,
  variant,
}: DataComponentProps & {
  label?: unknown
  value?: unknown
  variant?: string
}) {
  const writablePath = toWritableDataPath(dataPath)

  return (
    <label className="block space-y-space-xs">
      {label ? <span className="text-xs text-text-secondary">{toDisplayString(label)}</span> : null}
      <UIInput
        type={variant === 'number' ? 'number' : variant === 'obscured' ? 'password' : 'text'}
        value={toDisplayString(value)}
        onChange={(event) => {
          if (writablePath) onDataChange?.(writablePath, event.target.value)
        }}
      />
    </label>
  )
}

export function XCardCheckBox({
  dataPath,
  label,
  onDataChange,
  value,
}: DataComponentProps & {
  label?: unknown
  value?: unknown
}) {
  const writablePath = toWritableDataPath(dataPath)

  return (
    <label className="flex items-center gap-space-sm text-sm text-text-primary">
      <UICheckbox
        checked={toBoolean(value)}
        onCheckedChange={(nextValue) => {
          if (writablePath) onDataChange?.(writablePath, nextValue === true)
        }}
      />
      <span>{toDisplayString(label)}</span>
    </label>
  )
}

export function XCardChoicePicker({
  displayStyle = 'checkbox',
  dataPath,
  filterable,
  label,
  onDataChange,
  options = [],
  value,
  variant = 'mutuallyExclusive',
}: DataComponentProps & {
  displayStyle?: 'checkbox' | 'chips'
  filterable?: boolean
  label?: unknown
  options?: Array<{ label?: unknown; value?: unknown }>
  value?: unknown
  variant?: 'multipleSelection' | 'mutuallyExclusive'
}) {
  const writablePath = toWritableDataPath(dataPath)
  const normalizedOptions = options.map(normalizeOption).filter((option) => option.value)
  const selectedValues = toArray(value).map(toDisplayString).filter(Boolean)

  if (variant === 'multipleSelection') {
    const selectedSet = new Set(selectedValues)
    const toggleValue = (optionValue: string, checked: boolean) => {
      const nextValues = new Set(selectedSet)
      if (checked) {
        nextValues.add(optionValue)
      } else {
        nextValues.delete(optionValue)
      }
      if (writablePath) onDataChange?.(writablePath, Array.from(nextValues))
    }

    return (
      <fieldset className="space-y-space-xs">
        {label ? (
          <legend className="text-xs text-text-secondary">{toDisplayString(label)}</legend>
        ) : null}
        <div
          className={
            displayStyle === 'chips'
              ? 'flex flex-wrap gap-space-sm'
              : 'space-y-space-xs'
          }
        >
          {normalizedOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-space-sm text-sm text-text-primary"
            >
              <UICheckbox
                checked={selectedSet.has(option.value)}
                onCheckedChange={(nextValue) => toggleValue(option.value, nextValue === true)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    )
  }

  const selected = selectedValues[0] || ''

  return (
    <label className="block space-y-space-xs">
      {label ? <span className="text-xs text-text-secondary">{toDisplayString(label)}</span> : null}
      <Select
        value={selected}
        onValueChange={(nextValue) => {
          if (writablePath) onDataChange?.(writablePath, [nextValue])
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={filterable ? 'Select or search' : 'Select'} />
        </SelectTrigger>
        <SelectContent>
          {normalizedOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  )
}

export function XCardSlider({
  dataPath,
  label,
  max,
  min = 0,
  onDataChange,
  value,
}: DataComponentProps & {
  label?: unknown
  max?: unknown
  min?: unknown
  value?: unknown
}) {
  const writablePath = toWritableDataPath(dataPath)
  const minValue = toNumber(min, 0)
  const maxValue = toNumber(max, 100)
  const currentValue = toNumber(value, minValue)
  return (
    <div className="space-y-space-xs">
      <div className="flex items-center justify-between gap-space-sm text-xs text-text-secondary">
        <span>{toDisplayString(label)}</span>
        <span>{currentValue}</span>
      </div>
      <UISlider
        min={minValue}
        max={maxValue}
        value={[currentValue]}
        onValueChange={(nextValue) => {
          if (writablePath) onDataChange?.(writablePath, nextValue[0])
        }}
      />
    </div>
  )
}

export function XCardDateTimeInput({
  dataPath,
  label,
  onDataChange,
  value,
}: DataComponentProps & {
  label?: unknown
  value?: unknown
}) {
  const writablePath = toWritableDataPath(dataPath)

  return (
    <label className="block space-y-space-xs">
      {label ? <span className="text-xs text-text-secondary">{toDisplayString(label)}</span> : null}
      <UIInput
        type="datetime-local"
        value={toDisplayString(value)}
        onChange={(event) => {
          if (writablePath) onDataChange?.(writablePath, event.target.value)
        }}
      />
    </label>
  )
}
