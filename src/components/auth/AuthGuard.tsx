import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Spinner } from '@/components/ui/spinner'
import { ROUTES } from '@/constants'
import { RouteErrorKind, RouteRecoveryPage } from '@/components/routing'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requiredPermissions?: string[]
  requiredRoles?: string[]
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  requiredPermissions = [],
  requiredRoles = [],
}) => {
  const location = useLocation()
  const { isAuthenticated, isLoading, user, hasPermission, hasRole } =
    useAuthStore()

  // While the session resolves, hold the shell tone so nothing flashes.
  if (isLoading) {
    return (
      <div
        aria-busy="true"
        data-auth-guard="loading"
        className="flex min-h-dvh items-center justify-center bg-canvas"
      >
        <Spinner size="lg" />
      </div>
    )
  }

  // Signed-out visitors go to sign in and come back afterwards.
  if (requireAuth && !isAuthenticated) {
    // Keep the "session expired" notice when the API logged the user out.
    const urlParams = new URLSearchParams(window.location.search)
    const isExpired = urlParams.get('expired') === 'true'

    const from = `${location.pathname}${location.search}${location.hash}`

    return (
      <Navigate
        to={`${ROUTES.LOGIN}${isExpired ? '?expired=true' : ''}`}
        state={{ from }}
        replace
      />
    )
  }

  // Signed-in users skip the sign-in and register pages.
  if (
    !requireAuth &&
    isAuthenticated &&
    (location.pathname === ROUTES.LOGIN ||
      location.pathname === ROUTES.REGISTER)
  ) {
    return <Navigate to={ROUTES.HOME} replace />
  }

  // Permission and role checks end at the forbidden recovery page.
  if (requiredPermissions.length > 0 && user) {
    const hasAllPermissions = requiredPermissions.every((permission) =>
      hasPermission(permission),
    )
    if (!hasAllPermissions) {
      return <RouteRecoveryPage kind={RouteErrorKind.FORBIDDEN} />
    }
  }

  if (requiredRoles.length > 0 && user) {
    const hasAllRoles = requiredRoles.every((role) => hasRole(role))
    if (!hasAllRoles) {
      return <RouteRecoveryPage kind={RouteErrorKind.FORBIDDEN} />
    }
  }

  return <>{children}</>
}
