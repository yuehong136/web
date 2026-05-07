import * as React from 'react'

export type PortalTheme = 'light' | 'dark'

export function resolvePortalTheme(value?: string | null): PortalTheme | undefined {
  return value === 'light' || value === 'dark' ? value : undefined
}

export function getElementPortalTheme(element?: Element | null): PortalTheme | undefined {
  const scopedTheme = element
    ?.closest<HTMLElement>('[data-theme]')
    ?.getAttribute('data-theme')

  return resolvePortalTheme(scopedTheme)
}

export function getActiveElementPortalTheme(): PortalTheme | undefined {
  if (typeof document === 'undefined') {
    return undefined
  }

  return getElementPortalTheme(document.activeElement)
}

export function useActivePortalTheme(
  active: boolean,
  explicitTheme?: string | null,
): PortalTheme | undefined {
  const [theme, setTheme] = React.useState<PortalTheme | undefined>(() =>
    resolvePortalTheme(explicitTheme) ?? getActiveElementPortalTheme(),
  )

  React.useLayoutEffect(() => {
    if (!active) {
      return
    }

    setTheme(resolvePortalTheme(explicitTheme) ?? getActiveElementPortalTheme())
  }, [active, explicitTheme])

  return theme
}

export function useNearestPortalTheme(
  ref: React.RefObject<Element | null | undefined>,
  active: boolean,
  explicitTheme?: string | null,
): PortalTheme | undefined {
  const [theme, setTheme] = React.useState<PortalTheme | undefined>(() =>
    resolvePortalTheme(explicitTheme) ?? getElementPortalTheme(ref.current),
  )

  React.useLayoutEffect(() => {
    if (!active) {
      return
    }

    setTheme(
      resolvePortalTheme(explicitTheme) ??
        getElementPortalTheme(ref.current) ??
        getActiveElementPortalTheme(),
    )
  }, [active, explicitTheme, ref])

  return theme
}
