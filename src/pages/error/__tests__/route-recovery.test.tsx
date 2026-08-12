import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Suspense, act, lazy } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
  type RouteObject,
  useLocation,
} from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthGuard } from '@/components/auth'
import { RouteErrorKind, RouteRecoveryPage } from '@/components/routing'
import {
  ErrorBoundary,
  handleCaughtApplicationError,
} from '@/components/ui/error-boundary'
import { appRoutes } from '@/lib/router'
import { getSafeLoginRedirect } from '@/pages/auth/login-redirect'
import { useAuthStore } from '@/stores/auth'
import { ErrorFallback, getRouteErrorKind } from '..'

vi.mock('@/pages/home', () => ({
  HomePage: () => <div>Home</div>,
}))

const translations: Record<string, string> = {
  'routeErrors.notFound.title': 'Page not found',
  'routeErrors.notFound.description': 'The requested page does not exist.',
  'routeErrors.unauthorized.title': 'Please sign in again',
  'routeErrors.unauthorized.description': 'Your session has expired.',
  'routeErrors.forbidden.title': 'Access denied',
  'routeErrors.forbidden.description': 'Permission is required.',
  'routeErrors.unexpected.title': 'Unable to display this page',
  'routeErrors.unexpected.description': 'Reload to continue.',
  'routeErrors.server.title': 'Service temporarily unavailable',
  'routeErrors.server.description': 'Try again later.',
  'routeErrors.actions.home': 'Go to home',
  'routeErrors.actions.back': 'Go back',
  'routeErrors.actions.retry': 'Reload',
  'routeErrors.actions.login': 'Sign in again',
}

vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({
    t: (key: string, fallback?: string) => translations[key] ?? fallback ?? key,
  }),
}))

const loginSource = readFileSync(
  resolve(process.cwd(), 'src/pages/auth/LoginPage.tsx'),
  'utf8',
)

describe('route recovery', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container, {
      onCaughtError: handleCaughtApplicationError,
    })
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.restoreAllMocks()
  })

  async function renderRoutes(routes: RouteObject[], path = '/') {
    const router = createMemoryRouter(routes, { initialEntries: [path] })
    await act(async () => {
      root.render(
        <RouterProvider
          router={router}
          onError={handleCaughtApplicationError}
        />,
      )
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    return router
  }

  it('uses the real appRoutes catch-all for an unknown address', async () => {
    const router = await renderRoutes(appRoutes, '/missing/product/page')

    expect(container.querySelector('h1')?.textContent).toBe('Page not found')
    expect(
      container.querySelector('[data-route-error-kind="not-found"]'),
    ).not.toBeNull()
    router.dispose()
  })

  it('never exposes a raw render error to the user', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const secret = 'secret-token-do-not-render'
    const ThrowingRoute = () => {
      throw new Error(secret)
    }

    const router = await renderRoutes([
      {
        errorElement: <ErrorFallback />,
        children: [{ path: '/', element: <ThrowingRoute /> }],
      },
    ])

    expect(container.textContent).toContain('Unable to display this page')
    expect(container.textContent).not.toContain(secret)
    expect(consoleError.mock.calls.flat().map(String).join(' ')).not.toContain(
      secret,
    )
    router.dispose()
  })

  it('keeps a local boundary error out of its fallback and console', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const secret = 'secret-local-boundary-stack'
    const ThrowingChild = () => {
      throw new Error(secret)
    }

    await act(async () => {
      root.render(
        <ErrorBoundary>
          <ThrowingChild />
        </ErrorBoundary>,
      )
    })

    expect(container.textContent).toContain('Unable to display this page')
    expect(container.textContent).not.toContain(secret)
    expect(consoleError.mock.calls.flat().map(String).join(' ')).not.toContain(
      secret,
    )
  })

  it('delegates root recovery instead of re-rendering a deterministic crash', async () => {
    const onRetry = vi.fn()
    const ThrowingChild = () => {
      throw new Error('deterministic crash')
    }

    await act(async () => {
      root.render(
        <ErrorBoundary onRetry={onRetry}>
          <ThrowingChild />
        </ErrorBoundary>,
      )
    })

    await act(async () => {
      container.querySelector<HTMLButtonElement>('button')?.click()
    })

    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('classifies and safely renders a forbidden route response', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(getRouteErrorKind({ status: 403, data: 'secret' })).toBe(
      RouteErrorKind.FORBIDDEN,
    )

    const ForbiddenRoute = () => {
      throw { status: 403, data: 'secret-forbidden-detail' }
    }
    const router = await renderRoutes([
      {
        errorElement: <ErrorFallback />,
        children: [{ path: '/', element: <ForbiddenRoute /> }],
      },
    ])

    expect(container.textContent).toContain('Access denied')
    expect(container.textContent).not.toContain('secret-forbidden-detail')
    router.dispose()
  })

  it('classifies authentication and server route failures', () => {
    expect(getRouteErrorKind({ status: 401 })).toBe(RouteErrorKind.UNAUTHORIZED)
    expect(getRouteErrorKind({ status: 503 })).toBe(RouteErrorKind.SERVER)
  })

  it('catches a rejected lazy import without leaking its rejection', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const secret = 'secret-lazy-chunk-url'
    const RejectedPage = lazy(() => Promise.reject(new Error(secret)))

    const router = await renderRoutes([
      {
        errorElement: <ErrorFallback />,
        children: [
          {
            path: '/',
            element: (
              <Suspense fallback={<div>Loading</div>}>
                <RejectedPage />
              </Suspense>
            ),
          },
        ],
      },
    ])

    expect(container.textContent).toContain('Unable to display this page')
    expect(container.textContent).not.toContain(secret)
    expect(consoleError.mock.calls.flat().map(String).join(' ')).not.toContain(
      secret,
    )
    router.dispose()
  })

  it('focuses the recovery landmark and exposes working recovery actions', async () => {
    const onRetry = vi.fn()
    const router = await renderRoutes([
      {
        path: '*',
        element: (
          <RouteRecoveryPage kind={RouteErrorKind.SERVER} onRetry={onRetry} />
        ),
      },
    ])

    const main = container.querySelector<HTMLElement>('main')
    expect(document.activeElement).toBe(main)

    await act(async () => {
      container
        .querySelector<HTMLButtonElement>(
          '[data-route-recovery-action="retry"]',
        )
        ?.click()
    })
    expect(onRetry).toHaveBeenCalledOnce()

    await act(async () => {
      container
        .querySelector<HTMLButtonElement>('[data-route-recovery-action="home"]')
        ?.click()
    })
    expect(router.state.location.pathname).toBe('/home')
    router.dispose()
  })
})

describe('login recovery', () => {
  it('preserves the complete protected deep link in login route state', async () => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    })

    function LoginLocation() {
      const location = useLocation()
      return <output>{JSON.stringify(location.state)}</output>
    }

    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    const router = createMemoryRouter(
      [
        {
          element: (
            <AuthGuard>
              <Outlet />
            </AuthGuard>
          ),
          children: [{ path: '/agent/:id', element: <div>Protected</div> }],
        },
        { path: '/auth/login', element: <LoginLocation /> },
      ],
      { initialEntries: ['/agent/a?tab=run#node-x'] },
    )

    await act(async () => {
      root.render(<RouterProvider router={router} />)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(container.querySelector('output')?.textContent).toBe(
      JSON.stringify({ from: '/agent/a?tab=run#node-x' }),
    )

    await act(async () => root.unmount())
    router.dispose()
    container.remove()
  })

  it('keeps the unfinished forgot-password route out of the login UI', () => {
    expect(loginSource).not.toContain('/auth/forgot-password')
  })

  it('preserves only same-origin deep links and removes the reserved expiry flag', () => {
    expect(getSafeLoginRedirect('/agent/a?tab=run&expired=true#node-x')).toBe(
      '/agent/a?tab=run#node-x',
    )
    expect(getSafeLoginRedirect('https://evil.example/steal')).toBe('/home')
    expect(getSafeLoginRedirect('//evil.example/steal')).toBe('/home')
    expect(getSafeLoginRedirect('/\\evil.example/steal')).toBe('/home')
    expect(getSafeLoginRedirect('home')).toBe('/home')
    expect(getSafeLoginRedirect('/auth/login')).toBe('/home')
    expect(getSafeLoginRedirect('/auth/register?next=/agent/a')).toBe('/home')
  })
})
