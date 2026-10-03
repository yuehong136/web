import React from 'react'
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

export interface ApplicationProps {
  readonly composition: ApplicationComposition
}

export function Application({ composition }: ApplicationProps) {
  // 检测暗色模式 - 使用 data-theme 属性
  const [isDark, setIsDark] = React.useState(
    () => document.documentElement.getAttribute('data-theme') === 'dark',
  )

  // 初始化stores
  React.useEffect(() => {
    initializeStores()
  }, [])

  React.useEffect(() => {
    applyDocumentLocale(getCurrentLanguage())

    const handleLanguageChanged = (language: string) => {
      applyDocumentLocale(normalizeLocale(language) ?? getCurrentLanguage())
    }

    i18n.on('languageChanged', handleLanguageChanged)
    return () => {
      i18n.off('languageChanged', handleLanguageChanged)
    }
  }, [])

  // 监听暗色模式变化
  React.useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.getAttribute('data-theme') === 'dark')
    }

    // 初始检查
    checkDarkMode()

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.attributeName === 'data-theme' ||
          mutation.attributeName === 'class'
        ) {
          checkDarkMode()
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [])

  return (
    <PlatformProvider composition={composition}>
      <QueryClientProvider client={queryClient}>
        <ApplicationStyleProvider isDark={isDark}>
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
