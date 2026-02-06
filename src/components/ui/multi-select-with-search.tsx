'use client'

import { CheckIcon, ChevronDownIcon, XIcon } from 'lucide-react'
import {
  type MouseEventHandler,
  type ReactNode,
  Fragment,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface SelectOption {
  label: ReactNode
  value: string
  disabled?: boolean
}

export interface SelectOptionGroup {
  label: ReactNode
  value?: string
  disabled?: boolean
  options?: SelectOption[]
}

export interface MultiSelectWithSearchProps {
  options?: SelectOptionGroup[]
  value?: string[]
  onChange?(value: string[]): void
  triggerClassName?: string
  allowClear?: boolean
  disabled?: boolean
  placeholder?: string
  emptyText?: string
  maxDisplayItems?: number
}

function findLabel(
  options: SelectOptionGroup[],
  value: string,
): ReactNode {
  // Check flat options first
  for (const opt of options) {
    if (opt.value === value) return opt.label
    if (opt.options) {
      const found = opt.options.find((o) => o.value === value)
      if (found) return found.label
    }
  }
  return value
}

export const MultiSelectWithSearch = forwardRef<
  React.ComponentRef<typeof Button>,
  MultiSelectWithSearchProps
>(
  (
    {
      value: val = [],
      onChange,
      options = [],
      triggerClassName,
      allowClear = false,
      disabled = false,
      placeholder = 'Select...',
      emptyText = 'No options available',
      maxDisplayItems = 3,
    },
    ref,
  ) => {
    const id = useId()
    const [open, setOpen] = useState<boolean>(false)
    const [values, setValues] = useState<string[]>([])

    const selectedLabels = useMemo(() => {
      return values.map((v) => ({ value: v, label: findLabel(options, v) }))
    }, [options, values])

    const handleSelect = useCallback(
      (selectedValue: string) => {
        const newValues = values.includes(selectedValue)
          ? values.filter((v) => v !== selectedValue)
          : [...values, selectedValue]
        setValues(newValues)
        onChange?.(newValues)
      },
      [onChange, values],
    )

    const handleRemove = useCallback(
      (valueToRemove: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const newValues = values.filter((v) => v !== valueToRemove)
        setValues(newValues)
        onChange?.(newValues)
      },
      [onChange, values],
    )

    const handleClear: MouseEventHandler<SVGElement> = useCallback(
      (e) => {
        e.stopPropagation()
        setValues([])
        onChange?.([])
      },
      [onChange],
    )

    useEffect(() => {
      setValues(val)
    }, [val])

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            ref={ref}
            disabled={disabled}
            className={cn(
              'bg-transparent hover:bg-accent/30 border border-border w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30 [&_svg]:pointer-events-auto group h-auto min-h-10 py-1.5',
              triggerClassName,
            )}
          >
            {values.length > 0 ? (
              <div className="flex-1 min-w-0 flex flex-wrap gap-1 items-center">
                {selectedLabels.slice(0, maxDisplayItems).map(({ value, label }) => (
                  <Badge
                    key={value}
                    variant="secondary"
                    className="text-xs px-2 py-0.5"
                  >
                    {label}
                    <XIcon
                      className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                      onClick={(e) => handleRemove(value, e)}
                    />
                  </Badge>
                ))}
                {values.length > maxDisplayItems && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    +{values.length - maxDisplayItems}
                  </Badge>
                )}
              </div>
            ) : (
              <span className="flex-1 text-text-tertiary text-left">{placeholder}</span>
            )}
            <div className="flex items-center shrink-0 ml-2">
              {values.length > 0 && allowClear && (
                <XIcon
                  className="h-4 w-4 mx-1 cursor-pointer text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity hover:text-text-secondary"
                  onClick={handleClear}
                />
              )}
              <ChevronDownIcon
                size={16}
                className="text-text-tertiary shrink-0 ml-1"
                aria-hidden="true"
              />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="border-border w-full min-w-[var(--radix-popper-anchor-width)] p-0"
          align="start"
        >
          <Command className="p-4">
            {options && options.length > 0 && (
              <CommandInput
                placeholder="Search..."
                className="placeholder:text-text-tertiary"
              />
            )}
            <CommandList className="mt-2 outline-none">
              <CommandEmpty>
                <div className="text-text-tertiary">{emptyText}</div>
              </CommandEmpty>
              {options.map((group, idx) => {
                if (group.options && group.options.length > 0) {
                  return (
                    <Fragment key={idx}>
                      <CommandGroup heading={group.label}>
                        {group.options.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            disabled={option.disabled}
                            onSelect={() => handleSelect(option.value)}
                            className={cn(
                              'min-h-9',
                              values.includes(option.value) ? 'bg-card' : ''
                            )}
                          >
                            <span className="leading-none flex-1">{option.label}</span>
                            {values.includes(option.value) && (
                              <CheckIcon size={16} className="ml-auto text-primary" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Fragment>
                  )
                } else if (group.value) {
                  return (
                    <CommandItem
                      key={group.value}
                      value={group.value}
                      disabled={group.disabled}
                      onSelect={() => handleSelect(group.value!)}
                      className={cn(
                        'min-h-9',
                        values.includes(group.value) ? 'bg-card' : ''
                      )}
                    >
                      <span className="leading-none flex-1">{group.label}</span>
                      {values.includes(group.value) && (
                        <CheckIcon size={16} className="ml-auto text-primary" />
                      )}
                    </CommandItem>
                  )
                }
                return null
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  },
)

MultiSelectWithSearch.displayName = 'MultiSelectWithSearch'
