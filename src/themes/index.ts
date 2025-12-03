/**
 * 主题系统入口文件
 * 导出所有主题相关的模块
 */

export { cssVariables, defaultTokens } from './tokens'
export { default as tailwindVars } from './tailwind-vars'
export type { DesignTokens } from './tokens'

// 主题枚举
export const Theme = {
  LIGHT: 'light' as const,
  DARK: 'dark' as const,
  SYSTEM: 'system' as const
}

export type Theme = typeof Theme[keyof typeof Theme]

// 主题工具函数
export const setTheme = (theme: Theme) => {
  if (theme === Theme.SYSTEM) {
    // 移除手动设置的主题，让浏览器使用系统偏好
    document.documentElement.removeAttribute('data-theme')
    localStorage.removeItem('theme')
  } else {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }
}

export const getTheme = (): Theme => {
  const stored = localStorage.getItem('theme') as Theme
  if (stored && Object.values(Theme).includes(stored)) {
    return stored
  }
  return Theme.SYSTEM
}

export const getResolvedTheme = (): 'light' | 'dark' => {
  const theme = getTheme()
  if (theme === Theme.SYSTEM) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme as 'light' | 'dark'
}

// 初始化主题
export const initTheme = () => {
  const theme = getTheme()
  if (theme === Theme.SYSTEM) {
    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updateTheme = () => {
      const resolvedTheme = mediaQuery.matches ? 'dark' : 'light'
      document.documentElement.setAttribute('data-theme', resolvedTheme)
    }
    
    updateTheme()
    mediaQuery.addEventListener('change', updateTheme)
    
    return () => mediaQuery.removeEventListener('change', updateTheme)
  } else {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

// React hook: 检测当前是否为暗黑模式
import { useState, useEffect } from 'react'

export const useIsDarkTheme = (): boolean => {
  const [isDark, setIsDark] = useState(() => getResolvedTheme() === 'dark')

  useEffect(() => {
    // 检查初始状态
    setIsDark(getResolvedTheme() === 'dark')

    // 监听 data-theme 属性变化
    const observer = new MutationObserver(() => {
      setIsDark(getResolvedTheme() === 'dark')
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (getTheme() === Theme.SYSTEM) {
        setIsDark(mediaQuery.matches)
      }
    }
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return isDark
}