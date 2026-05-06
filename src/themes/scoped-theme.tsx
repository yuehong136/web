import { useMemo, type ReactNode } from 'react'
import { ConfigProvider } from 'antd'
import { buildAntdTheme } from '@/lib/antd-theme'

export type ScopedThemeValue = 'light' | 'dark'

export function resolveScopedTheme(value?: string | null): ScopedThemeValue | undefined {
  return value === 'light' || value === 'dark' ? value : undefined
}

interface ScopedThemeProps {
  theme?: string | null
  children: ReactNode
  className?: string
}

export function ScopedTheme({ theme, children, className }: ScopedThemeProps) {
  const scoped = resolveScopedTheme(theme)
  const antdTheme = useMemo(
    () => (scoped ? buildAntdTheme(scoped === 'dark') : undefined),
    [scoped],
  )

  const subtree = (
    <div data-theme={scoped} className={className ?? 'contents'}>
      {children}
    </div>
  )

  if (!antdTheme) {
    return subtree
  }

  // antd / antd-x 的颜色由根 XProvider 决定，与 host <html data-theme> 绑死。
  // 这里嵌套 ConfigProvider，让分享 / 嵌入子树切到 URL 指定主题的 algorithm，
  // 否则会出现 host=dark + share=light 时浅底面板上画白图标的视觉错位。
  return <ConfigProvider theme={antdTheme}>{subtree}</ConfigProvider>
}
