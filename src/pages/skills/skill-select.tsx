import { useId, useState } from 'react'
import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useActivePortalTheme } from '@/components/ui/portal-theme'

/** Local accessible adapter: the legacy shared select has no arrow-key support. */
export function SkillSelect({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string
  value: string
  options: { value: string; label: string; disabled?: boolean }[]
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const theme = useActivePortalTheme(open)
  return (
    <div className="flex min-w-0 flex-col gap-space-xs text-sm">
      <Label htmlFor={id}>{label}</Label>
      <Select.Root
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        open={open}
        onOpenChange={setOpen}
      >
        <Select.Trigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-label={label}
            className="h-auto min-h-10 max-w-full justify-between text-left whitespace-normal"
          >
            <Select.Value />
            <Select.Icon>
              <ChevronDown className="size-icon-sm shrink-0" />
            </Select.Icon>
          </Button>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            data-theme={theme}
            position="popper"
            sideOffset={4}
            className="z-[1000] max-h-60 max-w-[calc(100vw-2rem)] min-w-[var(--radix-select-trigger-width)] overflow-auto rounded-radius-lg border border-border-default bg-background-surface p-space-xs text-text-primary shadow-lg"
            onEscapeKeyDown={(event) => event.stopPropagation()}
          >
            <Select.Viewport>
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="relative cursor-pointer rounded-radius-sm py-space-sm pr-space-base pl-space-lg text-sm break-words whitespace-normal outline-none data-[disabled]:opacity-50 data-[highlighted]:bg-background-subtle"
                >
                  <Select.ItemIndicator className="absolute left-space-xs">
                    <Check className="size-icon-sm" />
                  </Select.ItemIndicator>
                  <Select.ItemText>{option.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  )
}
