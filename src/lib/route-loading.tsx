import {
  Suspense,
  lazy,
  type ComponentType,
  type LazyExoticComponent,
} from 'react'
import { useTranslation } from 'react-i18next'
import { AppScene, PageLoadingState } from '@/components/patterns'

function RouteLoadingFallback() {
  const { t } = useTranslation()
  return (
    <PageLoadingState
      scene={AppScene.CONSOLE}
      compact
      title={t('common.loading')}
    />
  )
}

/** Wrap a lazy component with Suspense */
export function withLoading(LazyComponent: LazyExoticComponent<ComponentType>) {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <LazyComponent />
    </Suspense>
  )
}

// ---------------------------------------------------------------------------
// Helper for lazy-loading named exports
// ---------------------------------------------------------------------------
export function lazyNamed<K extends string>(
  factory: () => Promise<Record<K, ComponentType>>,
  name: K,
) {
  return lazy(() => factory().then((m) => ({ default: m[name] })))
}
