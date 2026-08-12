import { ROUTES } from '@/constants'

export function getSafeLoginRedirect(from: unknown): string {
  if (
    typeof from !== 'string' ||
    !from.startsWith('/') ||
    from.startsWith('//')
  ) {
    return ROUTES.HOME
  }

  const trustedOrigin = 'https://app.invalid'

  try {
    const target = new URL(from, trustedOrigin)
    if (target.origin !== trustedOrigin || !target.pathname.startsWith('/')) {
      return ROUTES.HOME
    }

    if (
      target.pathname === ROUTES.LOGIN ||
      target.pathname === ROUTES.REGISTER
    ) {
      return ROUTES.HOME
    }

    target.searchParams.delete('expired')
    return `${target.pathname}${target.search}${target.hash}`
  } catch {
    return ROUTES.HOME
  }
}
