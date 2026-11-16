import { useEffect, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AiWorkspace } from '@/components/layout/ai-workspace'
import { ContextPanel } from './context-panel'

export interface InspectorPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Panel heading; also the Sheet's accessible title on narrow screens. */
  title: string
  description?: string
  /** Header actions next to the close button (open full page, more…). */
  actions?: ReactNode
  footer?: ReactNode
  /** Panel body. */
  content: ReactNode
  /** Changing it (e.g. another knowledge base) closes the panel. */
  scopeKey?: string
}

export interface InspectorProps extends InspectorPanelProps {
  /** The main area. It stays mounted while the panel opens, docks or sheets. */
  children: ReactNode
}

const DOCKED_PANEL = '[data-workspace-detail] [data-context-panel]'
const EDITABLE = 'input, textarea, select, [contenteditable="true"]'

/**
 * Right-hand detail panel for the selected row: docked beside the main area
 * on wide containers, a Sheet on narrow ones (shared with the chat evidence
 * panel through `AiWorkspace`, including its saved width). Opening moves focus
 * into the panel; Esc closes it and focus returns to the opener.
 */
export function Inspector({
  open,
  onOpenChange,
  title,
  description,
  actions,
  footer,
  content,
  scopeKey = 'inspector',
  children,
}: InspectorProps) {
  const { t } = useTranslation()
  const container = useRef<HTMLDivElement>(null)
  const wasOpen = useRef(false)

  // AiWorkspace (a child) records the opener in its own effect first; only
  // then move focus into a docked panel. A Sheet traps focus itself.
  useEffect(() => {
    const opened = open && !wasOpen.current
    wasOpen.current = open
    if (opened)
      container.current
        ?.querySelector<HTMLElement>(DOCKED_PANEL)
        ?.focus({ preventScroll: true })
  }, [open])

  // Esc from the docked panel, or from the main area outside text fields.
  // A native listener: portalled menus and the Sheet never bubble here.
  useEffect(() => {
    const element = container.current
    if (!element || !open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      const target = event.target as HTMLElement
      if (!target.closest(DOCKED_PANEL) && target.closest(EDITABLE)) return
      event.preventDefault()
      onOpenChange(false)
    }
    element.addEventListener('keydown', onKeyDown)
    return () => element.removeEventListener('keydown', onKeyDown)
  }, [open, onOpenChange])

  return (
    <div
      ref={container}
      data-slot="inspector"
      className="flex h-full min-h-0 min-w-0 flex-1 overflow-hidden"
    >
      <AiWorkspace
        open={open}
        onOpenChange={onOpenChange}
        scopeKey={scopeKey}
        detailTitle={title}
        detailDescription={description}
        resizeLabel={t('common.patterns.inspector.resize')}
        detail={
          <ContextPanel
            tabIndex={-1}
            title={title}
            description={description}
            actions={actions}
            footer={footer}
            width="full"
            className="border-l-0 outline-hidden"
            onClose={() => onOpenChange(false)}
            closeLabel={t('common.patterns.inspector.close')}
          >
            {content}
          </ContextPanel>
        }
      >
        {children}
      </AiWorkspace>
    </div>
  )
}
