import React, { useState, useEffect } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Theme, setTheme, getTheme, getResolvedTheme } from '@/themes'

interface ThemeSwitcherProps {
  className?: string
  variant?: 'dropdown' | 'toggle' | 'compact'
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ 
  className, 
  variant = 'toggle' 
}) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(Theme.SYSTEM)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // 初始化主题状态
    const theme = getTheme()
    const resolved = getResolvedTheme()
    setCurrentTheme(theme)
    setResolvedTheme(resolved)

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (getTheme() === Theme.SYSTEM) {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const handleThemeChange = (theme: Theme) => {
    setTheme(theme)
    setCurrentTheme(theme)
    
    if (theme === Theme.SYSTEM) {
      const resolved = getResolvedTheme()
      setResolvedTheme(resolved)
    } else {
      setResolvedTheme(theme as 'light' | 'dark')
    }
    
    setIsOpen(false)
  }

  const themes = [
    {
      value: Theme.LIGHT,
      label: '亮色',
      icon: Sun,
    },
    {
      value: Theme.DARK,
      label: '暗色',
      icon: Moon,
    },
    {
      value: Theme.SYSTEM,
      label: '跟随系统',
      icon: Monitor,
    },
  ]

  const currentThemeConfig = themes.find(t => t.value === currentTheme)
  const CurrentIcon = currentThemeConfig?.icon || Monitor

  if (variant === 'toggle') {
    // 简单的切换按钮（亮/暗模式切换）
    const toggleTheme = () => {
      const newTheme = resolvedTheme === 'light' ? Theme.DARK : Theme.LIGHT
      handleThemeChange(newTheme)
    }

    return (
      <button
        onClick={toggleTheme}
        className={cn(
          "inline-flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors",
          "hover:bg-state-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-focus",
          "text-text-secondary hover:text-text-primary",
          className
        )}
        title={`切换到${resolvedTheme === 'light' ? '暗色' : '亮色'}模式`}
      >
        {resolvedTheme === 'light' ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </button>
    )
  }

  if (variant === 'compact') {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "inline-flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors",
            "hover:bg-state-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-focus",
            "text-text-secondary hover:text-text-primary",
            className
          )}
        >
          <CurrentIcon className="h-4 w-4" />
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <div className={cn(
              "absolute right-0 top-full z-50 mt-1 min-w-[140px]",
              "rounded-md border bg-components-dropdown-bg shadow-components-dropdown-shadow",
              "border-components-dropdown-border py-1"
            )}>
              {themes.map((theme) => {
                const Icon = theme.icon
                return (
                  <button
                    key={theme.value}
                    onClick={() => handleThemeChange(theme.value)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-sm",
                      "text-components-dropdown-item-text hover:bg-components-dropdown-item-bg-hover",
                      "transition-colors",
                      currentTheme === theme.value && "bg-components-dropdown-item-bg-hover"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {theme.label}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    )
  }

  // dropdown 变体
  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
          "bg-components-button-secondary-bg text-components-button-secondary-text",
          "border-components-button-secondary-border hover:bg-components-button-secondary-bg-hover",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-focus"
        )}
      >
        <CurrentIcon className="h-4 w-4" />
        <span>{currentThemeConfig?.label}</span>
        <svg
          className={cn(
            "h-4 w-4 transition-transform",
            isOpen && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className={cn(
            "absolute right-0 top-full z-50 mt-1 min-w-[160px]",
            "rounded-md border bg-components-dropdown-bg shadow-components-dropdown-shadow",
            "border-components-dropdown-border py-1"
          )}>
            {themes.map((theme) => {
              const Icon = theme.icon
              return (
                <button
                  key={theme.value}
                  onClick={() => handleThemeChange(theme.value)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-sm",
                    "text-components-dropdown-item-text hover:bg-components-dropdown-item-bg-hover",
                    "transition-colors",
                    currentTheme === theme.value && "bg-components-dropdown-item-bg-hover"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {theme.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}