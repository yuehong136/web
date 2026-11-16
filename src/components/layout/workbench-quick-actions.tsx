import { useTranslation } from 'react-i18next'
import { Search, SquarePen } from 'lucide-react'
import { KbdShortcut } from '@/components/ui/kbd'
import { cn } from '@/lib/utils'
import {
  getCommandShortcutKeys,
  ProductCommandId,
  useOptionalApplicationCommands,
} from '@/lib/commands'

interface WorkbenchQuickActionsProps {
  /** Offer "New chat" (sections where a conversation applies). */
  newConversation?: boolean
  /**
   * A transient surface (the hover flyout) closes first and the command runs
   * on the next task, so the palette takes focus after the flyout gave it up.
   */
  onDismiss?: () => void
  /** Mobile sheet: 44px rows, a field-like search entry and no key caps. */
  touch?: boolean
}

/**
 * Top of the secondary panel, its hover flyout and the mobile sheet: "New
 * chat" where a chat applies and "Search ⌘K" for the command palette. Renders
 * nothing outside the command provider (standalone shells and tests).
 */
export const WorkbenchQuickActions = ({
  newConversation = false,
  onDismiss,
  touch = false,
}: WorkbenchQuickActionsProps) => {
  const { t } = useTranslation()
  const commands = useOptionalApplicationCommands()
  if (!commands) return null
  const run = (id: ProductCommandId) => {
    if (!onDismiss) {
      void commands.execute(id)
      return
    }
    onDismiss()
    window.setTimeout(() => void commands.execute(id), 0)
  }
  const keys = (id: ProductCommandId) => {
    const shortcut = touch ? undefined : getCommandShortcutKeys(id)
    return shortcut ? (
      <KbdShortcut keys={shortcut} className="ml-auto" aria-hidden="true" />
    ) : null
  }
  /** `aria-keyshortcuts` names keys the way the platform reports them. */
  const ariaKeys = (id: ProductCommandId) =>
    getCommandShortcutKeys(id)
      ?.map((key) => (key === '⌘' ? 'Meta' : key === 'Ctrl' ? 'Control' : key))
      .join('+')
  return (
    <div
      data-workbench-quick-actions
      className="flex shrink-0 flex-col gap-space-xs px-space-sm pb-space-sm"
    >
      {newConversation ? (
        <button
          type="button"
          aria-keyshortcuts={ariaKeys(ProductCommandId.NEW_CONVERSATION)}
          onClick={() => run(ProductCommandId.NEW_CONVERSATION)}
          className={cn(
            'flex w-full items-center gap-space-sm rounded-radius-md border border-border-default bg-background-surface px-space-sm text-sm font-medium text-text-primary shadow-elevation-low outline-hidden transition-colors hover:border-border-strong hover:bg-state-hover focus-visible:ring-2 focus-visible:ring-state-focus motion-reduce:transition-none',
            touch ? 'min-h-11' : 'min-h-[var(--control-height-sm)]',
          )}
        >
          <SquarePen className="size-icon-sm shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-left">
            {t('layout.sidebar.newChat')}
          </span>
          {keys(ProductCommandId.NEW_CONVERSATION)}
        </button>
      ) : null}
      <button
        type="button"
        aria-haspopup="dialog"
        aria-keyshortcuts={ariaKeys(ProductCommandId.OPEN_PALETTE)}
        onClick={() => run(ProductCommandId.OPEN_PALETTE)}
        className={cn(
          'flex w-full items-center gap-space-sm rounded-radius-md px-space-sm text-sm text-text-secondary outline-hidden transition-colors hover:bg-state-hover hover:text-text-primary focus-visible:ring-2 focus-visible:ring-state-focus motion-reduce:transition-none',
          touch
            ? 'min-h-11 border border-border-default bg-background-surface text-text-tertiary'
            : 'min-h-[var(--control-height-sm)]',
        )}
      >
        <Search className="size-icon-sm shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-left">
          {touch
            ? t('layout.sidebar.searchEverything')
            : t('layout.sidebar.search')}
        </span>
        {keys(ProductCommandId.OPEN_PALETTE)}
      </button>
    </div>
  )
}
