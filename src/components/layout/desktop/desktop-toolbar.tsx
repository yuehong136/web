import React from 'react'
import { ChevronLeft, ChevronRight, Command, PanelLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Tooltip } from '@/components/ui/tooltip'
import { ProductCommandId, useApplicationCommands } from '@/lib/commands'
import { cn } from '@/lib/utils'

const ICON_BUTTON =
  'flex size-8 shrink-0 items-center justify-center rounded-radius-md text-fg-muted outline-hidden transition-colors hover:bg-fill-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-line-focus'

interface ToolbarCommandProps {
  command: ProductCommandId
  label: string
  children: React.ReactNode
}

const ToolbarCommand: React.FC<ToolbarCommandProps> = ({
  command,
  label,
  children,
}) => {
  const { execute } = useApplicationCommands()
  return (
    <Tooltip content={label} asChild>
      <button
        type="button"
        className={ICON_BUTTON}
        aria-label={label}
        onClick={() => void execute(command)}
      >
        {children}
      </button>
    </Tooltip>
  )
}

export interface DesktopToolbarProps {
  /** Portal target for a page template's or conversation's title row. */
  titleRef?: React.Ref<HTMLDivElement>
  /** Portal target for actions placed at the toolbar's end. */
  actionsRef?: React.Ref<HTMLDivElement>
  /** A page owns the title area; the palette moves to the end. */
  titleClaimed?: boolean
  actionsClaimed?: boolean
}

/**
 * The desktop window's one header row: history commands, then the page's
 * own title and actions (see `workbench-header`), with the command palette
 * centred while no page claims the title.
 */
export const DesktopToolbar: React.FC<DesktopToolbarProps> = ({
  titleRef,
  actionsRef,
  titleClaimed = false,
  actionsClaimed = false,
}) => {
  const { t } = useTranslation()
  return (
    <header
      data-desktop-toolbar
      className="relative flex min-h-12 shrink-0 items-center gap-space-sm border-b border-line-subtle bg-surface px-space-sm py-space-2xs"
    >
      <div className="flex shrink-0 items-center gap-space-2xs">
        <ToolbarCommand
          command={ProductCommandId.TOGGLE_SIDEBAR}
          label={t('desktop.commands.toggleSidebar')}
        >
          <PanelLeft className="size-icon-sm" aria-hidden="true" />
        </ToolbarCommand>
        <ToolbarCommand
          command={ProductCommandId.NAVIGATE_BACK}
          label={t('desktop.commands.back')}
        >
          <ChevronLeft className="size-icon-sm" aria-hidden="true" />
        </ToolbarCommand>
        <ToolbarCommand
          command={ProductCommandId.NAVIGATE_FORWARD}
          label={t('desktop.commands.forward')}
        >
          <ChevronRight className="size-icon-sm" aria-hidden="true" />
        </ToolbarCommand>
      </div>
      <div
        ref={titleRef}
        data-workbench-title
        className={cn(
          'min-w-0 items-center ps-space-xs',
          titleClaimed ? 'flex flex-1' : 'hidden',
        )}
      />
      {titleClaimed ? null : <div className="flex-1" aria-hidden="true" />}
      <ToolbarPaletteButton compact={titleClaimed} />
      <div
        ref={actionsRef}
        data-workbench-actions
        className={cn(
          'shrink-0 items-center gap-space-sm',
          actionsClaimed ? 'flex' : 'hidden',
        )}
      />
    </header>
  )
}

const ToolbarPaletteButton: React.FC<{ compact: boolean }> = ({ compact }) => {
  const { execute } = useApplicationCommands()
  const { t } = useTranslation()
  const label = t('desktop.commands.openPalette')
  const open = () => void execute(ProductCommandId.OPEN_PALETTE)
  if (compact)
    return (
      <Tooltip content={label} asChild>
        <button
          type="button"
          data-desktop-palette="compact"
          className={ICON_BUTTON}
          onClick={open}
          aria-label={label}
          aria-keyshortcuts="Control+K Meta+K"
        >
          <Command className="size-icon-sm" aria-hidden="true" />
        </button>
      </Tooltip>
    )
  return (
    <button
      type="button"
      data-desktop-palette="centred"
      className="absolute left-1/2 flex h-8 -translate-x-1/2 items-center gap-space-sm rounded-radius-md border border-line bg-fill-muted px-space-sm text-xs text-fg outline-hidden transition-colors hover:bg-fill-pressed focus-visible:ring-2 focus-visible:ring-line-focus"
      onClick={open}
      aria-label={label}
      aria-keyshortcuts="Control+K Meta+K"
    >
      <Command className="size-icon-sm" aria-hidden="true" />
      <span>{label}</span>
      {/* i18n-ignore: keyboard shortcut */}
      <kbd className="text-fg-subtle">⌘/Ctrl K</kbd>
    </button>
  )
}
