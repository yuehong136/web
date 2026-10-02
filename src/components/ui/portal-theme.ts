import * as React from 'react'

export type PortalTheme = 'light' | 'dark'

export function resolvePortalTheme(
  value?: string | null,
): PortalTheme | undefined {
  return value === 'light' || value === 'dark' ? value : undefined
}

export function getElementPortalTheme(
  element?: Element | null,
): PortalTheme | undefined {
  const target = element?.closest<HTMLElement>('[data-theme]')

  // 全局 <html data-theme> 已经通过 CSS 继承传给 portal 出去的弹层，无需再 stamp 一次。
  // 只有当 closest 命中的是 <html> 之外的 scoped 节点（如 agent-share 内的 ScopedTheme 容器）
  // 时，才把那个 scoped 主题复制到 portal 上，让 portal 跟随子树主题而非宿主主题。
  if (
    !target ||
    (typeof document !== 'undefined' && target === document.documentElement)
  ) {
    return undefined
  }

  return resolvePortalTheme(target.getAttribute('data-theme'))
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
  const theme = React.useSyncExternalStore(
    subscribePortalTheme,
    getActiveElementPortalTheme,
    () => undefined,
  )
  return resolvePortalTheme(explicitTheme) ?? (active ? theme : undefined)
}

function subscribePortalTheme(listener: () => void) {
  document.addEventListener('focusin', listener)
  const observer = new MutationObserver(listener)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
    subtree: true,
  })
  return () => {
    document.removeEventListener('focusin', listener)
    observer.disconnect()
  }
}

export function useNearestPortalTheme(
  ref: React.RefObject<Element | null | undefined>,
  active: boolean,
  explicitTheme?: string | null,
): PortalTheme | undefined {
  const [theme, setTheme] = React.useState<PortalTheme | undefined>(
    () => resolvePortalTheme(explicitTheme) ?? getActiveElementPortalTheme(),
  )

  React.useLayoutEffect(() => {
    if (!active) {
      return
    }

    const update = () =>
      setTheme(
        resolvePortalTheme(explicitTheme) ??
          getElementPortalTheme(ref.current) ??
          getActiveElementPortalTheme(),
      )
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
      subtree: true,
    })
    return () => observer.disconnect()
  }, [active, explicitTheme, ref])

  return theme
}
