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
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import get from 'lodash/get.js'
import { ChevronDownIcon, XIcon } from 'lucide-react'
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
            'bg-surface-primary hover:bg-surface-secondary border-border-primary w-full justify-between px-space-base font-normal outline-offset-0 outline-none focus-visible:outline-[3px] [&_svg]:pointer-events-auto',
            triggerClassName,
            !value && 'text-text-secondary',
          )}
        >
          {value ? (
            <div className="truncate flex items-center gap-space-xs">
              <span>{get(selectedItem, 'parentLabel')}</span>
              <span className="text-text-disabled">/</span>
              <span className="text-text-accent">{selectedItem?.label}</span>
            </div>
          ) : (
            <span className="text-text-secondary">
              {placeholder || t('common.selectPlaceholder')}
            </span>
          )}
          <div className="flex items-center justify-between">
            {value && (
              <>
                <XIcon
                  className="h-4 mx-space-sm cursor-pointer text-text-secondary"
                  onClick={handleClear}
                />
                <Separator
                  orientation="vertical"
                  className="flex min-h-6 h-full"
                />
              </>
            )}
            <ChevronDownIcon
              size={16}
              className="text-text-secondary shrink-0 ml-space-sm"
              aria-hidden="true"
            />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0" align="start">
        <Command value={value}>
          <CommandInput placeholder="Search..." />
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
