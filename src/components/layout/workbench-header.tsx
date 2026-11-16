import * as React from 'react'
import { createPortal } from 'react-dom'

/** `title` replaces the section label; `actions` sits at the header's end. */
export type WorkbenchHeaderPart = 'title' | 'actions'

interface WorkbenchHeaderContextValue {
  targets: Record<WorkbenchHeaderPart, HTMLElement | null>
  claim: (part: WorkbenchHeaderPart) => () => void
}

const WorkbenchHeaderContext =
  React.createContext<WorkbenchHeaderContextValue | null>(null)

/** Page templates that may hand their title row to the shell header. */
const TEMPLATE_ROOTS =
  '[data-slot="collection-template"],[data-slot="detail-template"],[data-slot="settings-template"]'

/**
 * Shell side: the header's portal targets and how many page templates claim
 * each part. AppShell renders the header from this state.
 */
export function useWorkbenchHeaderState() {
  const [title, setTitle] = React.useState<HTMLElement | null>(null)
  const [actions, setActions] = React.useState<HTMLElement | null>(null)
  const [claims, setClaims] = React.useState({ title: 0, actions: 0 })
  const claim = React.useCallback((part: WorkbenchHeaderPart) => {
    setClaims((current) => ({ ...current, [part]: current[part] + 1 }))
    return () =>
      setClaims((current) => ({ ...current, [part]: current[part] - 1 }))
  }, [])
  const value = React.useMemo(
    () => ({ targets: { title, actions }, claim }),
    [title, actions, claim],
  )
  return {
    value,
    titleClaimed: claims.title > 0,
    actionsClaimed: claims.actions > 0,
    titleRef: setTitle,
    actionsRef: setActions,
  }
}

export const WorkbenchHeaderProvider = ({
  value,
  children,
}: React.PropsWithChildren<{ value: WorkbenchHeaderContextValue }>) => (
  <WorkbenchHeaderContext.Provider value={value}>
    {children}
  </WorkbenchHeaderContext.Provider>
)

export type WorkbenchHeaderPlacement = 'pending' | 'workbench' | 'inline'

/**
 * Template side: pass `bindRoot` as the template root's ref. Only the outermost
 * template inside the shell's task area owns the header; nested templates,
 * dialogs and standalone or embedded pages render their title inline. Until
 * the root mounts (`pending`) neither placement renders, so nothing flashes.
 */
export function useWorkbenchHeader(part: WorkbenchHeaderPart) {
  const context = React.useContext(WorkbenchHeaderContext)
  const [root, setRoot] = React.useState<HTMLElement | null>(null)
  const owns = !context
    ? false
    : root
      ? Boolean(
          root.closest('[data-main-task-area]') &&
          !root.parentElement?.closest(TEMPLATE_ROOTS),
        )
      : null
  const claim = context?.claim
  React.useLayoutEffect(
    () => (owns && claim ? claim(part) : undefined),
    [owns, claim, part],
  )
  const placement: WorkbenchHeaderPlacement =
    owns === null ? 'pending' : owns ? 'workbench' : 'inline'
  return {
    bindRoot: setRoot,
    placement,
    target: owns ? (context?.targets[part] ?? null) : null,
  }
}

/** Puts `workbench` into the shell header, or `inline` where there is none. */
export function WorkbenchHeaderSlot({
  placement,
  target,
  inline,
  children,
}: {
  placement: WorkbenchHeaderPlacement
  target: HTMLElement | null
  inline: React.ReactNode
  children: React.ReactNode
}) {
  if (placement === 'inline') return <>{inline}</>
  return target ? createPortal(children, target) : null
}
