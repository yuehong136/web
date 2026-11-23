import { useContext } from 'react'
import { UNSAFE_DataRouterStateContext, useLocation } from 'react-router-dom'
import type { TranslationKey } from '@/locales/typed-translation'
import {
  getWorkbenchSection,
  type WorkbenchSection,
} from './workbench-navigation'

/** A key under `layout.pageTitles`. */
export type PageTitleKey =
  Extract<
    TranslationKey<'layout'>,
    `pageTitles.${string}`
  > extends `pageTitles.${infer Key}`
    ? Key
    : never

/**
 * Route `handle` metadata. Nested routes inherit what they leave out, so a
 * layout route can name the section once and its children add their titles.
 */
export interface RouteMeta {
  /** Workbench section: rail highlight and secondary panel. */
  section?: WorkbenchSection
  /** Page title; the browser tab reads "<title> · <brand>". */
  title?: PageTitleKey
}

export const routeMeta = (
  section: WorkbenchSection | undefined,
  title?: PageTitleKey,
): RouteMeta => ({ section, title })

const isRouteMeta = (handle: unknown): handle is RouteMeta =>
  typeof handle === 'object' && handle !== null

/**
 * The deepest matched route's metadata, merged with its ancestors'. Outside a
 * data router (unit tests with MemoryRouter) there are no matches, so the
 * section falls back to the pathname rule.
 */
export function useRouteMeta(): Required<Pick<RouteMeta, 'section'>> &
  RouteMeta {
  const state = useContext(UNSAFE_DataRouterStateContext)
  const { pathname } = useLocation()
  let meta: RouteMeta = {}
  for (const match of state?.matches ?? []) {
    const handle: unknown = match.route.handle
    if (!isRouteMeta(handle)) continue
    meta = {
      section: handle.section ?? meta.section,
      title: handle.title ?? meta.title,
    }
  }
  return { ...meta, section: meta.section ?? getWorkbenchSection(pathname) }
}
