import type { ReactNode } from 'react'

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

  return (
    <div data-theme={scoped} className={className ?? 'contents'}>
      {children}
    </div>
  )
}
