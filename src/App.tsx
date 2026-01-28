import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { XProvider } from '@ant-design/x'
import { App as AntApp, theme } from 'antd'
import { queryClient } from './lib/query-client'
import { router } from './lib/router'
import { initializeStores } from './stores'

function App() {
  // 检测暗色模式 - 使用 data-theme 属性
  const [isDark, setIsDark] = React.useState(() => 
    document.documentElement.getAttribute('data-theme') === 'dark'
  )

  // 初始化stores
  React.useEffect(() => {
    initializeStores()
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
        if (mutation.attributeName === 'data-theme' || mutation.attributeName === 'class') {
          checkDarkMode()
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <XProvider
        theme={{
          algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: '#14b8a6', // 使用项目的主色调 (teal-500)
            borderRadius: 8,
          },
          components: {
            Slider: {
              // 自定义 Slider 轨道颜色以提高暗色模式下的可见性
              railBg: isDark ? 'rgba(255, 255, 255, 0.25)' : '#e5e7eb',
              railHoverBg: isDark ? 'rgba(255, 255, 255, 0.35)' : '#d1d5db',
              trackBg: '#14b8a6',
              trackHoverBg: '#0d9488',
              handleColor: '#14b8a6',
              handleActiveColor: '#0d9488',
            },
          },
        }}
        direction="ltr"
      >
        <AntApp>
          <RouterProvider router={router} />
          <ReactQueryDevtools initialIsOpen={false} />
        </AntApp>
      </XProvider>
    </QueryClientProvider>
  )
}

export default App