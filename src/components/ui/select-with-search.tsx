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

// 单个选项类型
export interface SelectOption {
  label: ReactNode
  value: string
  disabled?: boolean
}

// 分组选项类型（用于按厂商分组）
export interface SelectOptionGroup {
  label: ReactNode  // 分组标题
  value?: string    // 如果有 value 则为普通选项
  disabled?: boolean
  options?: SelectOption[]  // 分组下的选项
}

export interface SelectWithSearchProps {
  options?: SelectOptionGroup[]
  value?: string
  onChange?(value: string): void
  triggerClassName?: string
  allowClear?: boolean
  disabled?: boolean
  placeholder?: string
  emptyText?: string
}

// 在选项列表中查找选中项的 label（无分组）
function findLabelWithoutOptions(
  options: SelectOptionGroup[],
  value: string,
): ReactNode {
  return options.find((opt) => opt.value === value)?.label || ''
}

// 在选项列表中查找选中项的 label（有分组）
function findLabelWithOptions(
  options: SelectOptionGroup[],
  value: string,
): ReactNode {
  return options
    .map((group) => group?.options?.find((item) => item.value === value))
    .filter(Boolean)[0]?.label
}

export const SelectWithSearch = forwardRef<
  React.ComponentRef<typeof Button>,
  SelectWithSearchProps
>(
  (
    {
      value: val = '',
      onChange,
      options = [],
      triggerClassName,
      allowClear = false,
      disabled = false,
      placeholder = '请选择模型',
      emptyText = '暂无可用模型',
    },
    ref,
  ) => {
    const id = useId()
    const [open, setOpen] = useState<boolean>(false)
    const [value, setValue] = useState<string>('')

    // 获取当前选中项的 label
    const selectLabel = useMemo(() => {
      if (!value) return null
      
      if (options.every((x) => x.options === undefined)) {
        return findLabelWithoutOptions(options, value)
      } else if (options.every((x) => Array.isArray(x.options))) {
        return findLabelWithOptions(options, value)
      } else {
        // 混合结构
        const optionsWithOptions = options.filter((x) =>
          Array.isArray(x.options),
        )
        const optionsWithoutOptions = options.filter(
          (x) => x.options === undefined,
        )

        const label = findLabelWithOptions(optionsWithOptions, value)
        if (label) {
          return label
        }
        return findLabelWithoutOptions(optionsWithoutOptions, value)
      }
    }, [options, value])

    const handleSelect = useCallback(
      (val: string) => {
        setValue(val)
        setOpen(false)
        onChange?.(val)
      },
      [onChange],
    )

    const handleClear: MouseEventHandler<SVGElement> = useCallback(
      (e) => {
        e.stopPropagation()
        setValue('')
        onChange?.('')
      },
      [onChange],
    )

    useEffect(() => {
      setValue(val)
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
              'bg-transparent hover:bg-accent/30 border border-border w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30 [&_svg]:pointer-events-auto group h-10',
              triggerClassName,
            )}
          >
            {value && selectLabel ? (
              <div className="flex-1 min-w-0 overflow-hidden text-left">
                {selectLabel}
              </div>
            ) : (
              <span className="flex-1 text-text-tertiary text-left">{placeholder}</span>
            )}
            <div className="flex items-center shrink-0 ml-2">
              {value && allowClear && (
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
                placeholder="搜索..."
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
                            onSelect={handleSelect}
                            className={cn(
                              'min-h-9',
                              value === option.value ? 'bg-card' : ''
                            )}
                          >
                            <span className="leading-none flex-1">{option.label}</span>
                            {value === option.value && (
                              <CheckIcon size={16} className="ml-auto text-primary" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Fragment>
                  )
                } else {
                  return (
                    <CommandItem
                      key={group.value}
                      value={group.value}
                      disabled={group.disabled}
                      onSelect={handleSelect}
                      className={cn(
                        'min-h-9',
                        value === group.value ? 'bg-card' : ''
                      )}
                    >
                      <span className="leading-none flex-1">{group.label}</span>
                      {value === group.value && (
                        <CheckIcon size={16} className="ml-auto text-primary" />
                      )}
                    </CommandItem>
                  )
                }
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  },
)

SelectWithSearch.displayName = 'SelectWithSearch'
