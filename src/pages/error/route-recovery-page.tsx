import { useRouteError } from 'react-router-dom'
import { RouteErrorKind, RouteRecoveryPage } from '@/components/routing'
import { getRouteErrorKind } from './route-error-kind'

export function ErrorFallback() {
  const error = useRouteError()
  return <RouteRecoveryPage kind={getRouteErrorKind(error)} />
}

/**
 * A page inside the workbench failed: recover in the main area and keep the
 * rail and panels. The router clears the error on the next navigation.
 */
export function PageErrorFallback() {
  const error = useRouteError()
  return (
    <RouteRecoveryPage kind={getRouteErrorKind(error)} placement="surface" />
  )
}

export function NotFoundPage({
  placement,
}: {
  placement?: 'screen' | 'surface'
}) {
  return (
    <RouteRecoveryPage kind={RouteErrorKind.NOT_FOUND} placement={placement} />
  )
}
