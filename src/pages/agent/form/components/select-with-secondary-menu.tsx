import { Button } from '@/components/ui/button'
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import get from 'lodash/get.js'
import { Braces, ChevronDownIcon, XIcon } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { JsonSchemaDataType } from '../../constant'

type Item = {
  label: string
  value: string
}

type Option = {
  label: string
  value: string
  parentLabel?: string
  children?: Item[]
}

type Group = {
  label: string | React.ReactNode
  options: Option[]
}

interface GroupedSelectWithSecondaryMenuProps {
  options: Group[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  types?: (typeof JsonSchemaDataType)[keyof typeof JsonSchemaDataType][]
  triggerClassName?: string
}

export function GroupedSelectWithSecondaryMenu({
  options,
  value,
  onChange,
  placeholder,
  triggerClassName,
}: GroupedSelectWithSecondaryMenuProps) {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)

  // Find the label of the selected item
  const flattenedOptions = options.flatMap((g) => g.options)

  const selectedItem = flattenedOptions
    .flatMap((o) => [o, ...(o.children || [])])
    .find((o) => o.value === value)

  // Handle clear click
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.('')
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'bg-surface-primary hover:bg-surface-secondary border-border-primary w-full justify-between gap-space-sm px-space-sm font-normal outline-offset-0 outline-none focus-visible:outline-[3px] [&_svg]:pointer-events-auto',
            triggerClassName,
          )}
        >
          {value && selectedItem ? (
            <span className="inline-flex min-w-0 items-center gap-space-xs rounded-radius-sm bg-components-system-accent-soft px-space-xs py-[2px] text-components-system-accent-text">
              <Braces className="size-3.5 shrink-0" />
              <span className="truncate text-xs opacity-75">
                {get(selectedItem, 'parentLabel')}
              </span>
              <span className="opacity-50">/</span>
              <span className="truncate text-xs font-medium">
                {selectedItem.label}
              </span>
              {(selectedItem as { type?: string }).type && (
                <span className="ml-space-xs shrink-0 rounded-radius-sm bg-surface-primary/60 px-1 font-mono text-[10px] text-text-secondary">
                  {(selectedItem as { type?: string }).type}
                </span>
              )}
            </span>
          ) : (
            <span className="truncate text-text-secondary">
              {placeholder || t('common.selectPlaceholder')}
            </span>
          )}
          <span className="ml-auto flex shrink-0 items-center gap-space-xs">
            {value && (
              <XIcon
                className="size-4 cursor-pointer text-text-secondary hover:text-text-primary"
                onClick={handleClear}
              />
            )}
            <ChevronDownIcon
              size={16}
              className="text-text-secondary"
              aria-hidden="true"
            />
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[220px] max-w-[420px] bg-surface-primary p-0 shadow-elevation-medium"
        align="start"
        sideOffset={6}
      >
        <Command value={value}>
          <CommandInput placeholder={t('common.searchPlaceholder', 'Search...')} />
          <CommandList className="overflow-auto">
            {options.map((group, idx) => (
              <CommandGroup key={idx} heading={group.label}>
                {group.options.map((option) => {
                  return option.children ? (
                    <HoverCard
                      key={option.value}
                      openDelay={100}
                      closeDelay={150}
                    >
                      <HoverCardTrigger asChild>
                        <CommandItem
                          onSelect={() => {}}
                          className="flex items-center justify-between cursor-default"
                        >
                          {option.label}
                          <span className="ml-auto text-text-secondary">
                            ›
                          </span>
                        </CommandItem>
                      </HoverCardTrigger>
                      <HoverCardContent
                        side="right"
                        align="start"
                        className="w-[180px] p-space-xs"
                      >
                        {option.children.map((child) => (
                          <div
                            key={child.value}
                            className={cn(
                              'cursor-pointer rounded-radius-sm px-space-sm py-1.5 text-sm hover:bg-surface-secondary',
                              value === child.value &&
                                'bg-surface-accent text-text-accent-foreground',
                            )}
                            onClick={() => {
                              onChange?.(child.value)
                              setOpen(false)
                            }}
                          >
                            {child.label}
                          </div>
                        ))}
                      </HoverCardContent>
                    </HoverCard>
                  ) : (
                    <CommandItem
                      key={option.value}
                      onSelect={() => {
                        onChange?.(option.value)
                        setOpen(false)
                      }}
                      className="flex items-center justify-between"
                    >
                      <span>{option.label}</span>
                      <span className="text-text-secondary">
                        {get(option, 'type')}
                      </span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
