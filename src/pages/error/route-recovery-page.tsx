import { useRouteError } from 'react-router-dom'
import { RouteErrorKind, RouteRecoveryPage } from '@/components/routing'
import { getRouteErrorKind } from './route-error-kind'

export function ErrorFallback() {
  const error = useRouteError()
  return <RouteRecoveryPage kind={getRouteErrorKind(error)} />
}

export function NotFoundPage() {
  return <RouteRecoveryPage kind={RouteErrorKind.NOT_FOUND} />
}
