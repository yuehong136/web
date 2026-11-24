import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
  type RouteObject,
} from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import zhLayout from '@/locales/zh-CN/layout'
import enLayout from '@/locales/en-US/layout'
import { appRoutes } from '@/lib/router'
import { setProductLanguage } from '@/locales/i18n'
import { RouteDocument, usePageEntityTitle } from '../route-document'
import { routeMeta, useRouteMeta, type RouteMeta } from '../route-meta'

vi.mock('@/pages/home', () => ({ HomePage: () => <h1>Home</h1> }))

function Shell() {
  const { section } = useRouteMeta()
  return (
    <div data-section={section}>
      <div>
        <section data-main-task-area>
          <Outlet />
        </section>
      </div>
    </div>
  )
}

function KnowledgeBase() {
  usePageEntityTitle('Research library')
  return <h1>Research library</h1>
}

const routes: RouteObject[] = [
  {
    element: (
      <RouteDocument>
        <Outlet />
      </RouteDocument>
    ),
    children: [
      {
        element: <Shell />,
        children: [
          {
            path: '/home',
            handle: routeMeta('home', 'home'),
            element: <h1>Home</h1>,
          },
          {
            path: '/knowledge/:id',
            handle: routeMeta('knowledge', 'knowledge'),
            element: <Outlet />,
            children: [
              {
                path: 'documents',
                handle: routeMeta(undefined, 'knowledgeDocuments'),
                element: <KnowledgeBase />,
              },
            ],
          },
          { path: '/document/x/preview', element: <h1>Preview</h1> },
        ],
      },
    ],
  },
]

describe('route document', () => {
  let container: HTMLDivElement
  let root: Root
  beforeEach(async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    await setProductLanguage('zh-CN')
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })
  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  async function render(path: string) {
    const router = createMemoryRouter(routes, { initialEntries: [path] })
    await act(async () => root.render(<RouterProvider router={router} />))
    return router
  }

  it('titles the tab from the deepest route handle, the entity and the brand', async () => {
    const router = await render('/home')
    expect(document.title).toBe('首页 · Cairvo')
    expect(
      container.querySelector('[data-section]')?.getAttribute('data-section'),
    ).toBe('home')

    await act(async () => router.navigate('/knowledge/kb-1/documents'))
    expect(document.title).toBe('Research library · 文档 · Cairvo')
    // The child names no section; it inherits its layout route's.
    expect(
      container.querySelector('[data-section]')?.getAttribute('data-section'),
    ).toBe('knowledge')
    router.dispose()
  })

  it('announces a page change and moves focus to its heading, but not on the first load', async () => {
    vi.useFakeTimers()
    const router = await render('/home')
    await act(async () => vi.advanceTimersByTime(300))
    const announcer = container.querySelector('[data-route-announcer]')!
    expect(announcer.getAttribute('aria-live')).toBe('polite')
    expect(announcer.textContent).toBe('')
    expect(document.activeElement).toBe(document.body)

    await act(async () => router.navigate('/knowledge/kb-1/documents'))
    await act(async () => vi.advanceTimersByTime(300))
    expect(announcer.textContent).toBe('文档 页面')
    const heading = container.querySelector('h1')!
    expect(document.activeElement).toBe(heading)
    expect(heading.tabIndex).toBe(-1)

    // A query change on the same page neither re-announces nor moves focus.
    ;(document.activeElement as HTMLElement).blur()
    await act(async () => router.navigate('/knowledge/kb-1/documents?page=2'))
    await act(async () => vi.advanceTimersByTime(300))
    expect(document.activeElement).toBe(document.body)
    router.dispose()
  })

  it('falls back to the pathname rule for routes without a section', async () => {
    const router = await render('/document/x/preview')
    // No handle: the legacy prefix rule still answers.
    expect(
      container.querySelector('[data-section]')?.getAttribute('data-section'),
    ).toBe('home')
    expect(document.title).toBe('Cairvo')
    router.dispose()
  })
})

describe('app route metadata', () => {
  const walk = (
    list: RouteObject[],
    parent: RouteMeta,
    visit: (path: string, meta: RouteMeta, route: RouteObject) => void,
    prefix = '',
  ) => {
    for (const route of list) {
      const handle = (route.handle ?? {}) as RouteMeta
      const meta = {
        section: handle.section ?? parent.section,
        title: handle.title ?? parent.title,
      }
      const path = route.path?.startsWith('/')
        ? route.path
        : [prefix, route.path].filter(Boolean).join('/')
      visit(path, meta, route)
      if (route.children) walk(route.children, meta, visit, path)
    }
  }

  it('gives every titled route a title in both catalogs', () => {
    const titles = new Set<string>()
    walk(appRoutes, {}, (_, meta) => meta.title && titles.add(meta.title))
    expect(titles.size).toBeGreaterThan(40)
    for (const title of titles) {
      expect(zhLayout.layout.pageTitles, title).toHaveProperty(title)
      expect(enLayout.layout.pageTitles, title).toHaveProperty(title)
    }
  })

  it('names the section of pages the pathname rule misplaced', () => {
    const sections = new Map<string, RouteMeta>()
    walk(appRoutes, {}, (path, meta) => sections.set(path, meta))
    expect(sections.get('/document/:docId/preview')).toEqual({
      section: 'knowledge',
      title: 'documentPreview',
    })
    expect(sections.get('/settings/api/keys')).toEqual({
      section: 'settings',
      title: 'apiKeys',
    })
    expect(sections.get('/skills/:spaceId')?.section).toBe('knowledge')
    // Memory routes live in their own module and still carry metadata.
    expect(sections.get('/memory/:id/operations')).toEqual({
      section: 'knowledge',
      title: 'memoryOperations',
    })
    expect(sections.get('/memory/:id/maintenance/batches')).toEqual({
      section: 'knowledge',
      title: 'memoryBatches',
    })
  })

  it('keeps the not-found route and a page error boundary inside the workbench', () => {
    const layout = appRoutes[0].children!.find((route) => route.path === '/')!
    const [boundary] = layout.children!
    expect(boundary.path).toBeUndefined()
    expect(boundary.errorElement).toBeTruthy()
    expect(boundary.children!.some((route) => route.path === '*')).toBe(true)
  })
})
