import React from 'react'
import { ChevronLeft, ChevronRight, Command, PanelLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Tooltip } from '@/components/ui/tooltip'
import { ProductCommandId, useApplicationCommands } from '@/lib/commands'

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
    <Tooltip content={label}>
      <button
        type="button"
        className="rounded-radius-md flex size-8 items-center justify-center text-text-secondary transition-colors hover:bg-components-icon-button-bg-hover hover:text-text-primary"
        aria-label={label}
        onClick={() => void execute(command)}
      >
        {children}
      </button>
    </Tooltip>
  )
}

export const DesktopToolbar: React.FC = () => {
  const { t } = useTranslation()
  return (
    <header className="px-space-sm relative flex h-12 shrink-0 items-center justify-between border-b border-components-main-workbench-border bg-components-main-workbench-surface">
      <div className="gap-space-2xs flex items-center">
        <ToolbarCommand
          command={ProductCommandId.TOGGLE_SIDEBAR}
          label={t('desktop.commands.toggleSidebar')}
        >
          <PanelLeft className="size-icon-sm" />
        </ToolbarCommand>
        <ToolbarCommand
          command={ProductCommandId.NAVIGATE_BACK}
          label={t('desktop.commands.back')}
        >
          <ChevronLeft className="size-icon-sm" />
        </ToolbarCommand>
        <ToolbarCommand
          command={ProductCommandId.NAVIGATE_FORWARD}
          label={t('desktop.commands.forward')}
        >
          <ChevronRight className="size-icon-sm" />
        </ToolbarCommand>
      </div>
      <ToolbarPaletteButton />
      <div className="w-24" aria-hidden="true" />
    </header>
  )
}

const ToolbarPaletteButton: React.FC = () => {
  const { execute } = useApplicationCommands()
  const { t } = useTranslation()
  return (
    <button
      type="button"
      className="gap-space-sm px-space-sm rounded-radius-md absolute left-1/2 flex h-8 -translate-x-1/2 items-center border border-components-button-secondary-border bg-components-button-secondary-bg text-xs text-components-button-secondary-text transition-colors hover:bg-components-button-secondary-bg-hover"
      onClick={() => void execute(ProductCommandId.OPEN_PALETTE)}
      aria-label={t('desktop.commands.openPalette')}
    >
      <Command className="size-icon-sm" />
      <span>{t('desktop.commands.openPalette')}</span>
      <kbd className="text-text-tertiary">⌘/Ctrl K</kbd>
    </button>
  )
}
