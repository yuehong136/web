import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useNearestPortalTheme, usePortalContainer } from './portal-theme'

export interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  children?: React.ReactNode
  disabled?: boolean
}

export interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode
}

export interface SelectContentProps {
  children?: React.ReactNode
  className?: string
}

export interface SelectItemProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children'
> {
  value: string
  children?: React.ReactNode
  disabled?: boolean
}

export interface SelectValueProps {
  placeholder?: string
}

interface ItemRegistry {
  /** How many items per value are mounted. */
  mounted: ReadonlyMap<string, number>
  /** The last text of items that unmounted, e.g. filtered out by a search. */
  labels: ReadonlyMap<string, React.ReactNode>
}

interface SelectContextValue {
  value: string
  placeholder?: string
  disabled: boolean
  open: boolean
  rootRef: React.RefObject<HTMLDivElement | null>
  items: ItemRegistry
  registerItem: (
    value: string,
    label: React.RefObject<React.ReactNode>,
  ) => () => void
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

function useSelectContext(component: string) {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error(`${component} must be used within Select`)
  return context
}

/**
 * Radix Select behind the long-standing controlled API: `value` is always
 * controlled (`undefined` and `''` both show the placeholder) and
 * `onValueChange` only reports a pick the user made.
 */
export const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  placeholder,
  children,
  disabled = false,
}) => {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const [open, setOpen] = React.useState(false)
  // A list left open when the select becomes disabled would still accept a pick.
  if (disabled && open) setOpen(false)

  // Radix renders closed items off-document, so this knows on first paint
  // whether the value has an item to show, and what an item said last.
  const [items, setItems] = React.useState<ItemRegistry>(() => ({
    mounted: new Map(),
    labels: new Map(),
  }))
  const registerItem = React.useCallback(
    (itemValue: string, label: React.RefObject<React.ReactNode>) => {
      setItems((prev) => ({
        ...prev,
        mounted: new Map(prev.mounted).set(
          itemValue,
          (prev.mounted.get(itemValue) ?? 0) + 1,
        ),
      }))
      return () => {
        const lastLabel = label.current
        setItems((prev) => {
          const mounted = new Map(prev.mounted)
          const count = (prev.mounted.get(itemValue) ?? 1) - 1
          if (count > 0) mounted.set(itemValue, count)
          else mounted.delete(itemValue)
          return {
            mounted,
            labels: new Map(prev.labels).set(itemValue, lastLabel),
          }
        })
      }
    },
    [],
  )

  const selected = value ?? ''
  const handleValueChange = (next: string) => {
    // Inside a <form>, Radix mirrors the value into a hidden native select
    // that reports '' back whenever the value has no matching option yet
    // (options still loading, a stale saved value). That is not a pick.
    if (next === '' || disabled) return
    onValueChange?.(next)
  }

  const context = React.useMemo<SelectContextValue>(
    () => ({
      value: selected,
      placeholder,
      disabled,
      open,
      rootRef,
      items,
      registerItem,
    }),
    [selected, placeholder, disabled, open, items, registerItem],
  )

  return (
    <SelectContext.Provider value={context}>
      {/* The wrapper keeps Radix's hidden native select out of the parent's layout. */}
      <div ref={rootRef} className="relative">
        <SelectPrimitive.Root
          value={selected}
          onValueChange={handleValueChange}
          open={open}
          onOpenChange={setOpen}
          disabled={disabled}
        >
          {children}
        </SelectPrimitive.Root>
      </div>
    </SelectContext.Provider>
  )
}

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  SelectTriggerProps
>(({ className, children, onKeyDown, ...props }, ref) => {
  const { disabled } = useSelectContext('SelectTrigger')

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        'group flex h-12 w-full items-center justify-between gap-space-sm rounded-radius-xl border border-components-select-border bg-components-select-bg px-space-md py-space-base text-left text-sm text-components-select-text outline-hidden transition-colors',
        'focus:border-components-select-border-focus focus-visible:ring-2 focus-visible:ring-state-focus-10 data-[state=open]:border-components-select-border-focus',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        // Radix still runs typeahead on a disabled trigger; keep the value put.
        if (disabled || props.disabled) event.preventDefault()
      }}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="size-icon-sm shrink-0 transition-transform group-data-[state=open]:rotate-180" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
})
SelectTrigger.displayName = 'SelectTrigger'

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  const { t } = useTranslation()
  const {
    value,
    placeholder: selectPlaceholder,
    items,
  } = useSelectContext('SelectValue')
  // Radix shows the text of the matching item. With none mounted (options
  // still loading, or filtered out by a search) show what that item said
  // last, or the value itself, rather than nothing.
  const fallback =
    value !== '' && !items.mounted.has(value)
      ? (items.labels.get(value) ?? value)
      : undefined

  return (
    <span className="min-w-0 flex-1 truncate">
      <SelectPrimitive.Value
        placeholder={
          <span className="text-components-select-placeholder">
            {placeholder || selectPlaceholder || t('common.selectPlaceholder')}
          </span>
        }
      >
        {fallback}
      </SelectPrimitive.Value>
    </span>
  )
}

export const SelectContent: React.FC<SelectContentProps> = ({
  children,
  className,
}) => {
  const { open, rootRef } = useSelectContext('SelectContent')
  const portalContainer = usePortalContainer()
  const theme = useNearestPortalTheme(rootRef, open)

  return (
    <SelectPrimitive.Portal container={portalContainer}>
      <SelectPrimitive.Content
        position="popper"
        side="bottom"
        align="start"
        sideOffset={4}
        data-theme={theme}
        className={cn(
          'relative z-[1000] max-h-[min(15rem,var(--radix-select-content-available-height))] max-w-[var(--radix-select-content-available-width)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-radius-xl border border-components-dropdown-border bg-components-dropdown-bg text-sm text-components-dropdown-item-text shadow-elevation-medium',
          className,
        )}
        // Escape closes this list only. Legacy layers listen on document
        // without checking defaultPrevented, so the key stops here.
        onEscapeKeyDown={(event) => event.stopPropagation()}
      >
        <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-space-xs">
          <ChevronUp className="size-icon-sm" />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className="p-space-xs">
          {children}
        </SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-space-xs">
          <ChevronDown className="size-icon-sm" />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

export const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ value, children, className, ...props }, ref) => {
    const { registerItem } = useSelectContext('SelectItem')
    const label = React.useRef<React.ReactNode>(children)
    React.useLayoutEffect(() => {
      label.current = children
    })
    React.useLayoutEffect(
      () => registerItem(value, label),
      [registerItem, value],
    )

    return (
      <SelectPrimitive.Item
        ref={ref}
        value={value}
        className={cn(
          'relative flex w-full cursor-pointer items-center rounded-radius-lg py-space-sm pr-space-sm pl-space-xl text-sm text-components-dropdown-item-text outline-hidden select-none',
          'data-[state=checked]:bg-state-selected-bg data-[state=checked]:text-state-selected-text',
          // The highlight is the focus indicator, so it wins over the selection fill.
          'data-[highlighted]:bg-components-dropdown-item-bg-hover data-[highlighted]:data-[state=checked]:bg-components-dropdown-item-bg-hover',
          'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
          className,
        )}
        {...props}
      >
        <span className="absolute left-space-sm flex size-icon-sm items-center justify-center">
          <SelectPrimitive.ItemIndicator>
            <Check className="size-icon-sm" />
          </SelectPrimitive.ItemIndicator>
        </span>
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      </SelectPrimitive.Item>
    )
  },
)
SelectItem.displayName = 'SelectItem'

export const SelectGroup: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <SelectPrimitive.Group>{children}</SelectPrimitive.Group>

/** Must sit inside a SelectGroup, which it labels. */
export const SelectLabel: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => (
  <SelectPrimitive.Label
    className={cn(
      'py-space-xs pr-space-sm pl-space-xl text-sm font-semibold text-text-primary',
      className,
    )}
  >
    {children}
  </SelectPrimitive.Label>
)

export const SelectSeparator: React.FC<{ className?: string }> = ({
  className,
}) => (
  <SelectPrimitive.Separator
    className={cn('-mx-space-xs my-space-xs h-px bg-border-default', className)}
  />
)
