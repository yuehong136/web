import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { I18nextProvider, useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router-dom'
import {
  AppScene,
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns'
import { getProductLanguage, i18nReady, productLocaleRuntime } from './i18n'
import { createIsolatedLocaleRuntime } from './isolated-locale'
import { normalizeLocale, type LocaleNamespace } from './locale-registry'
import type { LocaleRuntime } from './locale-runtime'
import { namespacesForPath } from './route-locales'

export function LocaleResourceBoundary({
  runtime,
  namespaces,
  children,
}: {
  runtime: LocaleRuntime
  namespaces: readonly LocaleNamespace[]
  children: ReactNode
}) {
  const snapshot = useSyncExternalStore(
    runtime.subscribe,
    runtime.getSnapshot,
    runtime.getSnapshot,
  )
  const [attempt, retry] = useState(0)
  const [failedRequest, setFailedRequest] = useState<string | undefined>(
    undefined,
  )
  const [, refresh] = useState(0)
  const { t } = useTranslation()
  const locale = snapshot.effectiveLocale
  const signature = namespaces.join(',')
  const requestKey = `${locale}:${signature}:${attempt}`
  const loaded = namespaces.every((namespace) =>
    runtime.instance.hasResourceBundle(locale, namespace),
  )

  useEffect(() => {
    let active = true
    void runtime
      .ensureNamespaces(
        locale,
        signature ? (signature.split(',') as LocaleNamespace[]) : [],
      )
      .then(
        () => {
          if (active) refresh((value) => value + 1)
        },
        () => {
          if (active) setFailedRequest(requestKey)
        },
      )
    return () => {
      active = false
    }
  }, [runtime, locale, signature, requestKey])

  if (loaded) return children
  if (failedRequest === requestKey) {
    return (
      <PageErrorState
        scene={AppScene.CONSOLE}
        title={t('common.operationFailed')}
        description={null}
        retryLabel={t('common.retry')}
        onRetry={() => retry((value) => value + 1)}
      />
    )
  }
  if (!runtime.instance.exists('common.loading', { lng: locale })) return null
  return (
    <PageLoadingState
      scene={AppScene.CONSOLE}
      compact
      title={t('common.loading')}
      description={null}
    />
  )
}

/** Route loading happens before the new Outlet renders, with no locale-keyed remount. */
export function RouteLocaleBoundary({ children }: { children?: ReactNode }) {
  const { pathname } = useLocation()
  const namespaces = useMemo(() => namespacesForPath(pathname), [pathname])
  useEffect(() => {
    void i18nReady.catch(() => undefined)
  }, [])
  return (
    <LocaleResourceBoundary
      runtime={productLocaleRuntime}
      namespaces={namespaces}
    >
      {children ?? <Outlet />}
    </LocaleResourceBoundary>
  )
}

export function IsolatedLocaleBoundary({
  locale,
  namespaces,
  children,
}: {
  locale?: unknown
  namespaces: readonly LocaleNamespace[]
  children: ReactNode
}) {
  const normalized = normalizeLocale(locale) ?? getProductLanguage()
  const [runtime] = useState(() => createIsolatedLocaleRuntime(normalized))
  useEffect(() => {
    void runtime.setProductLanguage(normalized).catch(() => undefined)
  }, [runtime, normalized])
  return (
    <I18nextProvider i18n={runtime.instance}>
      <LocaleResourceBoundary runtime={runtime} namespaces={namespaces}>
        {children}
      </LocaleResourceBoundary>
    </I18nextProvider>
  )
}
