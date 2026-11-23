import { lazy, Suspense, useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'motion/react'
import { Toaster } from 'sonner'
import { handleCaughtApplicationError } from '@/components/ui/error-boundary'
import { queryClient } from './lib/query-client'
import { router } from './lib/router'
import { initializeStores } from './stores'
import i18n, {
  applyDocumentLocale,
  getCurrentLanguage,
  normalizeLocale,
} from './locales/i18n'
import { PlatformProvider, type ApplicationComposition } from './platform'
import { useResolvedAppearance } from '@/themes'

/**
 * TanStack Query devtools are a development aid. Their floating button sits
 * over the bottom-right corner, where sheets and dialogs keep their primary
 * action, so they load only on request (`VITE_QUERY_DEVTOOLS=true` in a
 * local env file). Production builds never include them.
 */
const QueryDevtools =
  import.meta.env.DEV && import.meta.env.VITE_QUERY_DEVTOOLS === 'true'
    ? lazy(() =>
        import('@tanstack/react-query-devtools').then((module) => ({
          default: module.ReactQueryDevtools,
        })),
      )
    : null

export interface ApplicationProps {
  readonly composition: ApplicationComposition
}

export function Application({ composition }: ApplicationProps) {
  const appearance = useResolvedAppearance()
  const isDark = appearance.resolvedMode === 'dark'

  // 初始化stores
  useEffect(() => {
    initializeStores()
  }, [])

  useEffect(() => {
    applyDocumentLocale(getCurrentLanguage())

    const handleLanguageChanged = (language: string) => {
      applyDocumentLocale(normalizeLocale(language) ?? getCurrentLanguage())
    }

    i18n.on('languageChanged', handleLanguageChanged)
    return () => {
      i18n.off('languageChanged', handleLanguageChanged)
    }
  }, [])

  return (
    <PlatformProvider composition={composition}>
      <QueryClientProvider client={queryClient}>
        {/* JS-driven motion follows the in-app setting, which already folds in
            the system's unless the user chose full motion. */}
        <MotionConfig
          reducedMotion={appearance.reducedMotion ? 'always' : 'never'}
        >
          <RouterProvider
            router={router}
            onError={handleCaughtApplicationError}
          />
          <Toaster
            theme={isDark ? 'dark' : 'light'}
            position="top-right"
            richColors
            closeButton
          />
          {QueryDevtools ? (
            <Suspense fallback={null}>
              <QueryDevtools initialIsOpen={false} />
            </Suspense>
          ) : null}
        </MotionConfig>
      </QueryClientProvider>
    </PlatformProvider>
  )
}

export default Application
