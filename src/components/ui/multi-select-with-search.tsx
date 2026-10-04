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
import { buildOptionSearchKeywords } from './select-with-search.utils'

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

function findLabel(options: SelectOptionGroup[], value: string): ReactNode {
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
              'group h-auto min-h-10 w-full justify-between border border-border bg-transparent px-3 py-1.5 font-normal outline-hidden outline-offset-0 hover:bg-accent/30 focus-visible:border-components-select-border-focus focus-visible:ring-1 focus-visible:ring-state-focus/30 [&_svg]:pointer-events-auto',
              triggerClassName,
            )}
          >
            {values.length > 0 ? (
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                {selectedLabels
                  .slice(0, maxDisplayItems)
                  .map(({ value, label }) => (
                    <Badge
                      key={value}
                      variant="secondary"
                      className="px-2 py-0.5 text-xs"
                    >
                      {label}
                      <XIcon
                        className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={(e) => handleRemove(value, e)}
                      />
                    </Badge>
                  ))}
                {values.length > maxDisplayItems && (
                  <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                    +{values.length - maxDisplayItems}
                  </Badge>
                )}
              </div>
            ) : (
              <span className="flex-1 text-left text-text-tertiary">
                {placeholder}
              </span>
            )}
            <div className="ml-2 flex shrink-0 items-center">
              {values.length > 0 && allowClear && (
                <XIcon
                  className="mx-1 h-4 w-4 cursor-pointer text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100 hover:text-text-secondary"
                  onClick={handleClear}
                />
              )}
              <ChevronDownIcon
                size={16}
                className="ml-1 shrink-0 text-text-tertiary"
                aria-hidden="true"
              />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-full min-w-[var(--radix-popper-anchor-width)] border-border p-0"
          align="start"
        >
          <Command className="p-4">
            {options && options.length > 0 && (
              <CommandInput
                placeholder="Search..."
                className="placeholder:text-text-tertiary"
              />
            )}
            <CommandList className="mt-2 outline-hidden">
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
                            keywords={buildOptionSearchKeywords(option.label, [
                              option.value,
                              typeof group.label === 'string'
                                ? group.label
                                : undefined,
                            ])}
                            disabled={option.disabled}
                            onSelect={() => handleSelect(option.value)}
                            className={cn(
                              'min-h-9',
                              values.includes(option.value)
                                ? "bg-state-selected-bg data-[selected='true']:bg-state-selected-bg"
                                : '',
                            )}
                          >
                            <span className="flex-1 leading-none">
                              {option.label}
                            </span>
                            {values.includes(option.value) && (
                              <CheckIcon
                                size={16}
                                className="ml-auto text-state-selected-text"
                              />
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
                      keywords={buildOptionSearchKeywords(group.label, [
                        group.value,
                      ])}
                      disabled={group.disabled}
                      onSelect={() => handleSelect(group.value!)}
                      className={cn(
                        'min-h-9',
                        values.includes(group.value)
                          ? "bg-state-selected-bg data-[selected='true']:bg-state-selected-bg"
                          : '',
                      )}
                    >
                      <span className="flex-1 leading-none">{group.label}</span>
                      {values.includes(group.value) && (
                        <CheckIcon
                          size={16}
                          className="ml-auto text-state-selected-text"
                        />
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
