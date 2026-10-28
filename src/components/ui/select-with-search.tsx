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
  useState,
} from 'react'

import { useTranslation } from 'react-i18next'
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

// 单个选项类型
export interface SelectOption {
  label: ReactNode
  value: string
  disabled?: boolean
  icon?: ReactNode
  description?: ReactNode
  keywords?: string[]
}

// 分组选项类型（用于按厂商分组）
export interface SelectOptionGroup extends Omit<SelectOption, 'value'> {
  label: ReactNode // 分组标题
  value?: string // 如果有 value 则为普通选项
  disabled?: boolean
  options?: SelectOption[] // 分组下的选项
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
  searchPlaceholder?: string
  ariaLabel?: string
  variant?: 'default' | 'compact' | 'minimal'
  side?: 'top' | 'bottom'
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
      searchPlaceholder = '搜索...',
      ariaLabel,
      variant = 'default',
      side = 'bottom',
    },
    ref,
  ) => {
    const { t } = useTranslation()
    const id = useId()
    const [open, setOpen] = useState<boolean>(false)
    const [value, setValue] = useState<string>(val)
    const selectedOption = options
      .flatMap(
        (group) =>
          group.options ??
          (group.value ? [{ ...group, value: group.value }] : []),
      )
      .find((option) => option.value === value)
    const rich = options.some(
      (group) =>
        group.icon ||
        group.options?.some((option) => option.icon || option.description),
    )

    const selectLabel = selectedOption?.label

    const handleSelect = useCallback(
      (val: string) => {
        setValue(val)
        setOpen(false)
        onChange?.(val)
      },
      [onChange],
    )

    const handleClear: MouseEventHandler<HTMLButtonElement> = useCallback(
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
        <div
          className={cn(
            'relative min-w-0',
            variant !== 'default' && 'inline-flex max-w-full',
          )}
        >
          <PopoverTrigger asChild>
            <Button
              id={id}
              variant="outline"
              role="combobox"
              aria-label={ariaLabel}
              aria-expanded={open}
              ref={ref}
              disabled={disabled}
              className={cn(
                'group h-10 w-full justify-between border border-border bg-transparent px-3 font-normal outline-hidden outline-offset-0 hover:bg-state-hover focus-visible:border-components-select-border-focus focus-visible:ring-1 focus-visible:ring-state-focus/30 [&_svg]:pointer-events-auto',
                triggerClassName,
                variant !== 'default' && 'w-auto max-w-full',
                variant === 'minimal' && 'border-transparent shadow-none',
                value && allowClear && 'pr-14',
              )}
            >
              {selectedOption?.icon && (
                <span
                  aria-hidden
                  className="mr-2 flex size-6 shrink-0 items-center justify-center"
                >
                  {selectedOption.icon}
                </span>
              )}
              {value && selectLabel ? (
                <div className="min-w-0 flex-1 overflow-hidden text-left">
                  {selectLabel}
                </div>
              ) : (
                <span className="flex-1 text-left text-text-tertiary">
                  {placeholder}
                </span>
              )}
              <div className="ml-2 flex shrink-0 items-center">
                <ChevronDownIcon
                  size={16}
                  className="ml-1 shrink-0 text-text-tertiary"
                  aria-hidden="true"
                />
              </div>
            </Button>
          </PopoverTrigger>
          {value && allowClear && (
            <button
              type="button"
              disabled={disabled}
              aria-label={
                ariaLabel
                  ? t('common.modelPicker.clear', { name: ariaLabel })
                  : t('common.clear')
              }
              onClick={handleClear}
              className="absolute top-1/2 right-8 flex size-6 -translate-y-1/2 items-center justify-center rounded-radius-sm text-text-tertiary hover:bg-state-hover focus-visible:ring-2 focus-visible:ring-state-focus"
            >
              <XIcon aria-hidden className="size-3.5" />
            </button>
          )}
        </div>
        <PopoverContent
          className={cn(
            'w-[var(--radix-popper-anchor-width)] max-w-[calc(100vw-2rem)] overflow-hidden rounded-radius-lg border-border p-0 shadow-elevation-high',
            rich && 'w-[max(var(--radix-popper-anchor-width),22rem)]',
          )}
          align="start"
          side={side}
          sideOffset={8}
        >
          <Command
            defaultValue={value}
            className="rounded-none bg-background-surface"
          >
            {options && options.length > 0 && (
              <div className="border-b border-border-subtle p-2 focus-within:bg-background-subtle">
                <CommandInput
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  className="h-9 border-0 placeholder:text-text-tertiary focus:border-0 focus:ring-0 focus-visible:ring-0"
                />
              </div>
            )}
            <CommandList
              className="max-h-[min(24rem,var(--radix-popover-content-available-height))] scroll-py-2 p-1 outline-hidden"
              onMouseEnter={undefined}
            >
              <CommandEmpty>
                <div className="text-text-tertiary">{emptyText}</div>
              </CommandEmpty>
              {options.map((group, idx) => {
                if (group.options && group.options.length > 0) {
                  return (
                    <Fragment key={idx}>
                      <CommandGroup
                        heading={group.label}
                        className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-normal [&_[cmdk-group-heading]]:normal-case"
                      >
                        {group.options.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            keywords={buildOptionSearchKeywords(option.label, [
                              option.value,
                              typeof group.label === 'string'
                                ? group.label
                                : undefined,
                              ...(option.keywords ?? []),
                            ])}
                            disabled={option.disabled}
                            onSelect={handleSelect}
                            className={cn(
                              'min-h-10 gap-3 rounded-radius-md px-2.5 py-2.5',
                              value === option.value
                                ? "bg-state-selected-bg data-[selected='true']:bg-state-selected-bg"
                                : '',
                            )}
                          >
                            {option.icon && (
                              <span
                                aria-hidden
                                className="flex size-8 shrink-0 items-center justify-center rounded-radius-md bg-background-subtle [&_svg]:size-5"
                              >
                                {option.icon}
                              </span>
                            )}
                            <span className="min-w-0 flex-1 space-y-1 text-left">
                              <span className="block truncate leading-5 font-medium">
                                {option.label}
                              </span>
                              {option.description && (
                                <span className="block">
                                  {option.description}
                                </span>
                              )}
                            </span>
                            {value === option.value && (
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
                } else {
                  return (
                    <CommandItem
                      key={group.value}
                      value={group.value}
                      keywords={buildOptionSearchKeywords(group.label, [
                        group.value,
                        ...(group.keywords ?? []),
                      ])}
                      disabled={group.disabled}
                      onSelect={handleSelect}
                      className={cn(
                        'min-h-9',
                        value === group.value
                          ? "bg-state-selected-bg data-[selected='true']:bg-state-selected-bg"
                          : '',
                      )}
                    >
                      {group.icon && (
                        <span
                          aria-hidden
                          className="flex size-8 shrink-0 items-center justify-center"
                        >
                          {group.icon}
                        </span>
                      )}
                      <span className="min-w-0 flex-1 leading-5">
                        {group.label}
                        {group.description && (
                          <span className="block text-xs text-text-secondary">
                            {group.description}
                          </span>
                        )}
                      </span>
                      {value === group.value && (
                        <CheckIcon
                          size={16}
                          className="ml-auto text-state-selected-text"
                        />
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
