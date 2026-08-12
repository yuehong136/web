import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Loading } from '@/components/ui/loading'
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

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading variant="spinner" size="lg" />
      </div>
    )
  }

  // 如果需要认证但用户未登录，重定向到登录页
  if (requireAuth && !isAuthenticated) {
    // 检查是否因为token过期而重定向
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

  // 如果用户已登录但访问登录/注册页，重定向到仪表板
  if (
    !requireAuth &&
    isAuthenticated &&
    (location.pathname === ROUTES.LOGIN ||
      location.pathname === ROUTES.REGISTER)
  ) {
    return <Navigate to={ROUTES.HOME} replace />
  }

  // 检查权限
  if (requiredPermissions.length > 0 && user) {
    const hasAllPermissions = requiredPermissions.every((permission) =>
      hasPermission(permission),
    )
    if (!hasAllPermissions) {
      return <RouteRecoveryPage kind={RouteErrorKind.FORBIDDEN} />
    }
  }

  // 检查角色
  if (requiredRoles.length > 0 && user) {
    const hasAllRoles = requiredRoles.every((role) => hasRole(role))
    if (!hasAllRoles) {
      return <RouteRecoveryPage kind={RouteErrorKind.FORBIDDEN} />
    }
  }

  return <>{children}</>
}
