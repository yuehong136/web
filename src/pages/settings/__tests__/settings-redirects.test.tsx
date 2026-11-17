// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  type RouteObject,
} from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { appRoutes } from '@/lib/router'

vi.mock('@/pages/home', () => ({ HomePage: () => null }))

/** Depth-first lookup of a route by its full path. */
function findRoute(
  routes: RouteObject[],
  target: string,
  parent = '',
): RouteObject | undefined {
  for (const route of routes) {
    const path = route.path
      ? route.path.startsWith('/')
        ? route.path
        : `${parent.replace(/\/$/, '')}/${route.path}`
      : parent
    if (path === target && route.element && (route.path || route.index))
      return route
    const child = route.children
      ? findRoute(route.children, target, path)
      : undefined
    if (child) return child
  }
  return undefined
}

function LocationProbe() {
  const location = useLocation()
  return <output>{`${location.pathname}${location.search}`}</output>
}

async function redirectFrom(path: string) {
  const [pathname] = path.split('?')
  const route = findRoute(appRoutes, pathname)
  expect(route, path).toBeTruthy()
  const container = document.createElement('div')
  const root = createRoot(container)
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={pathname} element={route!.element} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    ),
  )
  const landed = container.querySelector('output')?.textContent
  await act(async () => root.unmount())
  return landed
}

it.each([
  ['/mcp-servers', '/settings/mcp'],
  ['/settings/mcp-servers', '/settings/mcp'],
  ['/settings/mcp-tools', '/settings/mcp?tab=tools'],
  ['/settings/mcp-tools?serverId=a1', '/settings/mcp?server=a1&tab=tools'],
  ['/settings/mcp-test', '/settings/mcp?tab=test'],
  ['/settings/mcp-batch', '/settings/mcp?tab=batch'],
  ['/settings/api-keys', '/settings/api/keys'],
  // The MCP playground became Home's model and MCP chat.
  ['/mcp-chat', '/home'],
  ['/mcp-chat?q=1', '/home?q=1'],
])('redirects the retired %s to %s', async (from, to) => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  expect(await redirectFrom(from)).toBe(to)
})

it('routes the new MCP and API pages', () => {
  for (const path of [
    '/settings/mcp',
    '/settings/api/keys',
    '/settings/api/docs',
  ])
    expect(findRoute(appRoutes, path), path).toBeTruthy()
})
