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
            // 主色调根据主题动态变化，与项目设计系统保持一致
            colorPrimary: isDark ? '#818cf8' : '#18181b',
            borderRadius: 8,
          },
          components: {
            Slider: {
              // 自定义 Slider 轨道颜色以提高暗色模式下的可见性
              railBg: isDark ? 'rgba(255, 255, 255, 0.25)' : '#e5e7eb',
              railHoverBg: isDark ? 'rgba(255, 255, 255, 0.35)' : '#d1d5db',
              trackBg: isDark ? '#818cf8' : '#18181b',
              trackHoverBg: isDark ? '#6366f1' : '#27272a',
              handleColor: isDark ? '#818cf8' : '#18181b',
              handleActiveColor: isDark ? '#6366f1' : '#27272a',
            },
            Select: {
              // 自定义 Select 下拉菜单选中项颜色，使其更柔和
              optionSelectedBg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              optionActiveBg: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
              optionSelectedColor: isDark ? '#ffffff' : '#1f2937',
            },
            Input: {
              // 修复 Input 在暗色模式下的背景色
              colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
              colorText: isDark ? '#ffffff' : '#1f2937',
              colorTextPlaceholder: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)',
              colorBorder: isDark ? '#424242' : '#d9d9d9',
            },
            InputNumber: {
              // 修复 InputNumber 在暗色模式下的背景色
              colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
              colorText: isDark ? '#ffffff' : '#1f2937',
              colorTextPlaceholder: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)',
              colorBorder: isDark ? '#424242' : '#d9d9d9',
            },
            Tabs: {
              // Tabs 选中状态颜色
              inkBarColor: isDark ? '#818cf8' : '#18181b',
              itemSelectedColor: isDark ? '#818cf8' : '#18181b',
              itemHoverColor: isDark ? '#a5b4fc' : '#3f3f46',
              itemColor: isDark ? '#9ca3af' : '#71717a',
            },
            Switch: {
              // Switch 开关颜色
              colorPrimary: isDark ? '#818cf8' : '#18181b',
              colorPrimaryHover: isDark ? '#6366f1' : '#27272a',
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