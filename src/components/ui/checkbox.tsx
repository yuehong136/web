import React from 'react'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  indeterminate?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox: React.FC<CheckboxProps> = ({
  className,
  indeterminate = false,
  checked,
  onCheckedChange,
  onChange,
  ...props
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked
    onCheckedChange?.(isChecked)
    onChange?.(event)
  }

  return (
    <div className="relative">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={handleChange}
        {...props}
      />
      <div
        className={cn(
          'flex h-4 w-4 items-center justify-center rounded border border-primary text-current',
          'hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          {
            'bg-primary text-primary-foreground': checked || indeterminate,
            'bg-background': !checked && !indeterminate,
          },
          className
        )}
        onClick={() => onCheckedChange?.(!checked)}
      >
        {indeterminate ? (
          <Minus className="h-3 w-3" />
        ) : checked ? (
          <Check className="h-3 w-3" />
        ) : null}
      </div>
    </div>
  )
}

export { Checkbox }