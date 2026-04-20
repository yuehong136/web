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
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { JsonSchemaDataType } from '../../constant'
import {
  useFindAgentStructuredOutputLabel,
  useShowSecondaryMenu,
} from '../../hooks/use-build-structured-output'
import { StructuredOutputSecondaryMenu } from './structured-output-secondary-menu'

type Item = {
  label: string
  value: string
}

type Option = {
  label: string
  value: string
  parentLabel?: string
  children?: Item[]
  type?: string
}

type Group = {
  label: string | React.ReactNode
  options: Option[]
}

type FlexibleOption = Option & { parentLabel?: React.ReactNode }

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
  types,
}: GroupedSelectWithSecondaryMenuProps) {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)

  const showSecondaryMenu = useShowSecondaryMenu()
  const findAgentStructuredOutputLabel = useFindAgentStructuredOutputLabel()

  const flattenedOptions = React.useMemo(
    () => options.flatMap((group) => group.options),
    [options],
  )

  const selectedItem = React.useMemo(() => {
    if (!value) return undefined
    const direct = flattenedOptions
      .flatMap((o) => [o, ...(o.children || [])])
      .find((o) => o.value === value)

    if (direct) return direct as FlexibleOption

    return findAgentStructuredOutputLabel(
      value,
      flattenedOptions as FlexibleOption[],
    ) as FlexibleOption | undefined
  }, [findAgentStructuredOutputLabel, flattenedOptions, value])

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation()
    onChange?.('')
    setOpen(false)
  }

  const handleSecondaryMenuClick = useCallback(
    (record: { label: React.ReactNode; value: string }) => {
      onChange?.(record.value)
      setOpen(false)
    },
    [onChange],
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'min-h-10 h-auto w-full justify-between gap-space-sm border-border-default bg-background-surface px-space-sm py-space-xs font-normal outline-offset-0 outline-none hover:bg-components-dropdown-item-bg-hover focus-visible:outline-[3px] [&_svg]:pointer-events-auto',
            triggerClassName,
          )}
        >
          {value && selectedItem ? (
            <span className="inline-flex min-w-0 items-center gap-space-xs rounded-radius-sm bg-components-system-accent-soft px-space-sm py-0.5 text-sm text-components-system-accent-text">
              <Braces className="size-4 shrink-0" />
              <span className="truncate text-sm opacity-75">
                {selectedItem.parentLabel as React.ReactNode}
              </span>
              <span className="opacity-50">/</span>
              <span className="truncate text-sm font-medium">
                {selectedItem.label}
              </span>
              {selectedItem.type ? (
                <span className="ml-space-xs shrink-0 rounded-radius-sm bg-background-surface/60 px-1 font-mono text-xs text-text-secondary">
                  {selectedItem.type}
                </span>
              ) : null}
            </span>
          ) : (
            <span className="truncate text-sm text-text-secondary">
              {placeholder || t('common.selectPlaceholder')}
            </span>
          )}
          <span className="ml-auto flex shrink-0 items-center gap-space-xs">
            {value ? (
              <XIcon
                className="size-4 cursor-pointer text-text-secondary hover:text-text-primary"
                onClick={handleClear}
              />
            ) : null}
            <ChevronDownIcon
              size={16}
              className="text-text-secondary"
              aria-hidden="true"
            />
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[220px] max-w-[420px] bg-components-dropdown-bg p-0 shadow-lg"
        align="start"
        sideOffset={6}
      >
        <Command value={value}>
          <CommandInput
            placeholder={t('common.searchPlaceholder', 'Search...')}
          />
          <CommandList className="overflow-auto">
            <CommandEmpty>
              {t('flow.variablePickerEmptyTitle', 'No variables found')}
            </CommandEmpty>
            {options.map((group, idx) => (
              <CommandGroup key={idx} heading={group.label}>
                {group.options.map((option) => {
                  const shouldShowSecondary = showSecondaryMenu(
                    option.value,
                    option.label,
                  )

                  if (shouldShowSecondary) {
                    return (
                      <StructuredOutputSecondaryMenu
                        key={option.value}
                        data={option}
                        types={types}
                        click={handleSecondaryMenuClick}
                      />
                    )
                  }

                  return option.children ? (
                    <HoverCard
                      key={option.value}
                      openDelay={100}
                      closeDelay={150}
                    >
                      <HoverCardTrigger asChild>
                        <CommandItem
                          onSelect={() => {}}
                          className="flex cursor-default items-center justify-between"
                        >
                          {option.label}
                          <span className="ml-auto text-text-secondary">›</span>
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
                              'cursor-pointer rounded-radius-sm px-space-sm py-1.5 text-sm hover:bg-components-dropdown-item-bg-hover',
                              value === child.value &&
                                'bg-components-system-accent-soft text-components-system-accent-text',
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
