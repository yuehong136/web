import { useEffect, useState } from 'react'
import { getResolvedTheme } from '@/themes'

export const useCurrentTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(getResolvedTheme())

  useEffect(() => {
    const updateTheme = () => {
      setCurrentTheme(getResolvedTheme())
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          updateTheme()
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleMediaChange = () => {
      if (!document.documentElement.hasAttribute('data-theme')) {
        updateTheme()
      }
    }
    mediaQuery.addEventListener('change', handleMediaChange)

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', handleMediaChange)
    }
  }, [])

  return currentTheme
}
