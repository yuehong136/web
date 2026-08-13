import React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { useTranslation } from 'react-i18next'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command'
import type { ProductCommand } from './types'

interface CommandPaletteProps {
  commands: ProductCommand[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onExecute: (command: ProductCommand) => void
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  commands,
  open,
  onOpenChange,
  onExecute,
}) => {
  const { t } = useTranslation()
  const inputRef = React.useRef<HTMLInputElement>(null)

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-components-dialog-overlay backdrop-blur-sm" />
        <DialogPrimitive.Content
          className="rounded-radius-xl shadow-elevation-high fixed left-1/2 top-1/3 z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden border border-components-dialog-border bg-components-dialog-bg focus:outline-none"
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            inputRef.current?.focus()
          }}
        >
          <DialogPrimitive.Title className="sr-only">
            {t('desktop.commands.paletteLabel')}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {t('desktop.commands.paletteDescription')}
          </DialogPrimitive.Description>
          <Command aria-label={t('desktop.commands.paletteLabel')}>
            <CommandInput
              ref={inputRef}
              placeholder={t('desktop.commands.searchPlaceholder')}
            />
            <CommandList>
              <CommandEmpty>{t('desktop.commands.empty')}</CommandEmpty>
              <CommandGroup heading={t('desktop.commands.group')}>
                {commands.map((command) => (
                  <CommandItem
                    key={command.id}
                    disabled={command.isEnabled?.() === false}
                    value={`${t(command.titleKey, command.fallbackTitle)} ${command.id}`}
                    onSelect={() => onExecute(command)}
                  >
                    <span>{t(command.titleKey, command.fallbackTitle)}</span>
                    {command.shortcut ? (
                      <CommandShortcut>{command.shortcut}</CommandShortcut>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
