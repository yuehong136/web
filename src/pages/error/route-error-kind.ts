import { RouteErrorKind } from '@/components/routing'

function readErrorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('status' in error)) {
    return undefined
  }

  const status = (error as { status?: unknown }).status
  return typeof status === 'number' ? status : undefined
}

export function getRouteErrorKind(error: unknown): RouteErrorKind {
  const status = readErrorStatus(error)

  if (status === 401) return RouteErrorKind.UNAUTHORIZED
  if (status === 403) return RouteErrorKind.FORBIDDEN
  if (status === 404) return RouteErrorKind.NOT_FOUND
  if (status !== undefined && status >= 500) return RouteErrorKind.SERVER

  return RouteErrorKind.UNEXPECTED
}
