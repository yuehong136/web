import * as React from 'react'
import { UNSAFE_DataRouterStateContext, useLocation } from 'react-router-dom'
import { useTypedTranslation } from '@/locales/use-typed-translation'
import { useRouteMeta } from './route-meta'

/**
 * The title and the announcer sit above the route locale boundary, which
 * loads bundles after the first render: re-render when they arrive.
 */
const REBIND_ON_LOAD = { bindI18nStore: 'added' } as const

const PageEntityContext = React.createContext<
  React.Dispatch<React.SetStateAction<string | null>>
>(() => undefined)

/**
 * Names the entity a page shows (a knowledge base, an agent, a conversation)
 * in the browser tab: "<entity> · <page> · <brand>". Cleared on unmount.
 */
export function usePageEntityTitle(entity: string | null | undefined) {
  const setEntity = React.useContext(PageEntityContext)
  const value = entity?.trim() || null
  React.useEffect(() => {
    setEntity(value)
    return () => setEntity((current) => (current === value ? null : current))
  }, [setEntity, value])
}

/**
 * Owns the document title and the route announcer for every route, above the
 * locale boundary so neither remounts while a page's strings load. React 19
 * hoists the `<title>` into the head. The page part comes from the deepest
 * route `handle.title`; a router-level (loader) error names that instead,
 * while a render error keeps the page's title beside its in-place recovery.
 */
export function RouteDocument({ children }: React.PropsWithChildren) {
  const [entity, setEntity] = React.useState<string | null>(null)
  return (
    <PageEntityContext.Provider value={setEntity}>
      <RouteTitle entity={entity} />
      <RouteAnnouncer />
      {children}
    </PageEntityContext.Provider>
  )
}

function RouteTitle({ entity }: { entity: string | null }) {
  const { t } = useTypedTranslation('layout', REBIND_ON_LOAD)
  const state = React.useContext(UNSAFE_DataRouterStateContext)
  const { title } = useRouteMeta()
  const failed = Boolean(state?.errors)
  const page = failed
    ? t('pageTitles.error')
    : title
      ? t(`pageTitles.${title}`)
      : null
  const parts = [failed ? null : entity, page, t('brandName')]
  return <title>{parts.filter(Boolean).join(' · ')}</title>
}

/** How long, in ms, a lazily loaded page has to render its heading. */
const HEADING_WAIT_MS = 3000

/**
 * Moves focus to the new page's h1 unless the page already placed focus in
 * its own area (an autofocused composer, say). The h1 may be portaled into the
 * workbench header, so the search covers the whole main surface.
 */
function focusPageHeading(): boolean {
  const area = document.querySelector<HTMLElement>('[data-main-task-area]')
  const surface = area?.parentElement
  // Signed-out pages have no workbench; the browser keeps its own focus.
  if (!surface) return false
  const active = document.activeElement
  if (active && active !== document.body && surface.contains(active))
    return true
  const heading = surface.querySelector<HTMLElement>('h1')
  if (!heading) return false
  if (!heading.hasAttribute('tabindex')) heading.tabIndex = -1
  heading.dataset.routeFocus = ''
  heading.focus({ preventScroll: true })
  return true
}

/**
 * After a page change (not a query or hash change, not the first load) a
 * polite live region names the new page and focus moves to its heading, so
 * screen reader users learn where they landed (WCAG 2.4.2 / 4.1.3).
 */
function RouteAnnouncer() {
  const { pathname } = useLocation()
  const { title } = useRouteMeta()
  const { t } = useTypedTranslation('layout', REBIND_ON_LOAD)
  const [message, setMessage] = React.useState('')
  const previous = React.useRef(pathname)
  // Strings can arrive after the navigation; read the latest ones when the
  // timers fire, without restarting (and so cancelling) the announcement.
  const latest = React.useRef({ t, title })
  React.useEffect(() => {
    latest.current = { t, title }
  })
  React.useEffect(() => {
    if (previous.current === pathname) return
    previous.current = pathname
    // Clear first so landing on a page with the same title is spoken again.
    const clear = window.setTimeout(() => setMessage(''), 0)
    const announce = window.setTimeout(() => {
      const { t, title } = latest.current
      const label = title ? t(`pageTitles.${title}`) : t('brandName')
      setMessage(t('routeAnnouncement', { title: label }))
    }, 150)
    let observer: MutationObserver | undefined
    const stop = window.setTimeout(
      () => observer?.disconnect(),
      HEADING_WAIT_MS,
    )
    const focus = window.setTimeout(() => {
      if (focusPageHeading() || typeof MutationObserver === 'undefined') return
      // The page, or the whole workbench while its strings load, is not
      // there yet: watch until its heading renders.
      observer = new MutationObserver(() => {
        if (focusPageHeading()) observer?.disconnect()
      })
      observer.observe(document.body, { childList: true, subtree: true })
    }, 0)
    return () => {
      ;[clear, announce, stop, focus].forEach(window.clearTimeout)
      observer?.disconnect()
    }
  }, [pathname])
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      data-route-announcer
    >
      {message}
    </div>
  )
}
