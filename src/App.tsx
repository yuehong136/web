import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { XProvider } from '@ant-design/x'
import { App as AntApp } from 'antd'
import { Toaster } from 'sonner'
import { handleCaughtApplicationError } from '@/components/ui/error-boundary'
import { queryClient } from './lib/query-client'
import { router } from './lib/router'
import { buildAntdTheme } from './lib/antd-theme'
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
        <XProvider theme={buildAntdTheme(isDark)} direction="ltr">
          <AntApp>
            <RouterProvider
              router={router}
              onError={handleCaughtApplicationError}
            />
            <Toaster position="top-right" richColors closeButton />
            <ReactQueryDevtools initialIsOpen={false} />
          </AntApp>
        </XProvider>
      </QueryClientProvider>
    </PlatformProvider>
  )
}

export default Application
