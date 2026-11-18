import React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { QueryClientContext } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { KbdShortcut } from '@/components/ui/kbd'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { usePortalContainer } from '@/components/ui/portal-theme'
import { usePaletteEntityItems } from './palette-entity-items'
import {
  groupInScope,
  highlightMatch,
  PALETTE_GROUPS,
  PALETTE_SCOPES,
  usePaletteCommandItems,
  type PaletteItem,
  type PaletteScope,
} from './palette-items'
import type { ProductCommand } from './types'

interface CommandPaletteProps {
  commands: ProductCommand[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onExecute: (command: ProductCommand) => void
}

/**
 * ⌘/Ctrl K palette: commands and destinations plus recent conversations,
 * knowledge bases and apps, grouped, with a scope switch (Tab cycles it).
 */
export const CommandPalette: React.FC<CommandPaletteProps> = ({
  commands,
  open,
  onOpenChange,
  onExecute,
}) => {
  const { t } = useTranslation()
  const container = usePortalContainer()
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal container={container}>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim" />
        <DialogPrimitive.Content
          data-command-palette
          className="fixed top-1/6 left-1/2 z-50 flex max-h-[calc(100dvh-var(--space-2xl))] w-[calc(100%-var(--space-xl))] max-w-2xl -translate-x-1/2 flex-col overflow-hidden rounded-radius-xl border border-line-subtle bg-overlay text-fg shadow-elevation-high focus:outline-hidden"
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            const content = event.currentTarget
            if (content instanceof HTMLElement)
              content.querySelector<HTMLInputElement>('[cmdk-input]')?.focus()
          }}
        >
          <DialogPrimitive.Title className="sr-only">
            {t('desktop.commands.paletteLabel')}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {t('desktop.commands.paletteDescription')}
          </DialogPrimitive.Description>
          <PaletteBody
            commands={commands}
            onExecute={onExecute}
            onClose={() => onOpenChange(false)}
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

interface PaletteBodyProps {
  commands: ProductCommand[]
  onExecute: (command: ProductCommand) => void
  onClose: () => void
}

const NO_ENTITIES = { items: [] as PaletteItem[], loading: false }

/** Key names are printed on the caps as-is in every language. */
const KEY_CAPS = {
  select: ['↑', '↓'],
  open: ['Enter'],
  scope: ['Tab'],
  close: ['Esc'],
} as const

const PaletteBody = (props: PaletteBodyProps) => {
  const [query, setQuery] = React.useState('')
  const [scope, setScope] = React.useState<PaletteScope>('all')
  const queryClient = React.useContext(QueryClientContext)
  const state = { ...props, query, setQuery, scope, setScope }
  // Data results need a Query client; bare command hosts keep commands only.
  return queryClient ? (
    <PaletteWithEntities {...state} />
  ) : (
    <PaletteResults {...state} entities={NO_ENTITIES} />
  )
}

interface PaletteState extends PaletteBodyProps {
  query: string
  setQuery: (query: string) => void
  scope: PaletteScope
  setScope: (scope: PaletteScope) => void
}

const PaletteWithEntities = (props: PaletteState) => {
  const entities = usePaletteEntityItems(props.query, props.onClose)
  return <PaletteResults {...props} entities={entities} />
}

const groupLabels: Record<(typeof PALETTE_GROUPS)[number], string> = {
  conversations: 'desktop.commands.palette.groups.conversations',
  knowledge: 'desktop.commands.palette.groups.knowledge',
  apps: 'desktop.commands.palette.groups.apps',
  navigation: 'desktop.commands.palette.groups.navigation',
  commands: 'desktop.commands.palette.groups.commands',
}

const PaletteResults = ({
  commands,
  onExecute,
  onClose,
  query,
  setQuery,
  scope,
  setScope,
  entities,
}: PaletteState & { entities: { items: PaletteItem[]; loading: boolean } }) => {
  const { t } = useTranslation()
  const hintsId = React.useId()
  const commandItems = usePaletteCommandItems({
    commands,
    query,
    onExecute,
    onClose,
  })
  const items = [...entities.items, ...commandItems]
  const scopeLabel = (value: PaletteScope) =>
    t(`desktop.commands.palette.scopes.${value}`)
  const cycleScope = (step: number) => {
    const index = PALETTE_SCOPES.indexOf(scope)
    setScope(
      PALETTE_SCOPES[
        (index + step + PALETTE_SCOPES.length) % PALETTE_SCOPES.length
      ],
    )
  }
  return (
    <Command
      shouldFilter={false}
      loop
      label={t('desktop.commands.paletteLabel')}
      className="min-h-0 flex-1 rounded-none bg-transparent"
    >
      <div className="flex shrink-0 items-center gap-space-sm border-b border-line-subtle pr-space-sm [&>[data-cmdk-input-wrapper]]:min-w-0 [&>[data-cmdk-input-wrapper]]:flex-1">
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder={t('desktop.commands.searchPlaceholder')}
          aria-describedby={hintsId}
          className="min-h-[var(--control-height-lg)] text-base"
          onKeyDown={(event) => {
            if (
              event.key !== 'Tab' ||
              event.altKey ||
              event.ctrlKey ||
              event.metaKey
            )
              return
            // Tab switches scope here; keep the dialog's focus trap out of it.
            event.preventDefault()
            event.stopPropagation()
            cycleScope(event.shiftKey ? -1 : 1)
          }}
        />
        <SegmentedControl
          size="sm"
          aria-label={t('desktop.commands.palette.scope')}
          value={scope}
          onValueChange={setScope}
          options={PALETTE_SCOPES.map((value) => ({
            value,
            label: scopeLabel(value),
          }))}
          className="max-sm:hidden"
        />
      </div>
      <p className="sr-only" aria-live="polite">
        {t('desktop.commands.palette.scopeAnnouncement', {
          scope: scopeLabel(scope),
        })}
      </p>
      <CommandList className="max-h-96 min-h-0 flex-1 p-space-xs">
        {entities.loading && items.length === 0 ? null : (
          <CommandEmpty>{t('desktop.commands.empty')}</CommandEmpty>
        )}
        {PALETTE_GROUPS.filter((group) => groupInScope(group, scope)).map(
          (group) => {
            const groupItems = items.filter((item) => item.group === group)
            if (!groupItems.length) return null
            return (
              <CommandGroup key={group} heading={t(groupLabels[group])}>
                {groupItems.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    disabled={item.disabled}
                    onSelect={item.run}
                  >
                    {item.icon}
                    <span className="min-w-0 truncate">
                      {highlightMatch(item.title, query)}
                    </span>
                    {item.subtitle ? (
                      <span className="min-w-0 shrink-2 truncate text-xs text-fg-subtle">
                        {item.subtitle}
                      </span>
                    ) : null}
                    {item.meta || item.keys ? (
                      <span className="ml-auto flex shrink-0 items-center gap-space-xs pl-space-sm text-xs text-fg-subtle">
                        {item.meta}
                        {item.keys ? <KbdShortcut keys={item.keys} /> : null}
                      </span>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            )
          },
        )}
      </CommandList>
      <footer
        id={hintsId}
        className="flex min-h-[var(--control-height)] shrink-0 flex-wrap items-center gap-x-space-md gap-y-space-2xs border-t border-line-subtle bg-sunken px-space-md py-space-2xs text-xs text-fg-subtle"
      >
        <span className="inline-flex items-center gap-space-xs">
          <KbdShortcut keys={KEY_CAPS.select} />
          {t('desktop.commands.palette.hints.select')}
        </span>
        <span className="inline-flex items-center gap-space-xs">
          <KbdShortcut keys={KEY_CAPS.open} />
          {t('desktop.commands.palette.hints.open')}
        </span>
        <span className="inline-flex items-center gap-space-xs">
          <KbdShortcut keys={KEY_CAPS.scope} />
          {t('desktop.commands.palette.hints.scope')}
        </span>
        <span className="inline-flex items-center gap-space-xs max-sm:hidden">
          <KbdShortcut keys={KEY_CAPS.close} />
          {t('desktop.commands.palette.hints.close')}
        </span>
        <output className="ml-auto">
          {entities.loading ? t('desktop.commands.palette.searching') : null}
        </output>
      </footer>
    </Command>
  )
}
