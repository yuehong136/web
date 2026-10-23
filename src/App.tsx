import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { handleCaughtApplicationError } from '@/components/ui/error-boundary'
import { queryClient } from './lib/query-client'
import { router } from './lib/router'
import { ApplicationStyleProvider } from '@/themes/application-style-provider'
import { initializeStores } from './stores'
import i18n, {
  applyDocumentLocale,
  getCurrentLanguage,
  normalizeLocale,
} from './locales/i18n'
import { PlatformProvider, type ApplicationComposition } from './platform'
import { useResolvedAppearance } from '@/themes'

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
        <ApplicationStyleProvider appearance={appearance}>
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
          <ReactQueryDevtools initialIsOpen={false} />
        </ApplicationStyleProvider>
      </QueryClientProvider>
    </PlatformProvider>
  )
}

export default Application
