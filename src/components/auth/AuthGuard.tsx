import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Loading } from '@/components/ui/loading'
import { ROUTES } from '@/constants'

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
  const { isAuthenticated, isLoading, user, hasPermission, hasRole } = useAuthStore()

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading variant="spinner" size="lg" />
      </div>
    )
  }

  // 如果需要认证但用户未登录，重定向到登录页
  if (requireAuth && !isAuthenticated) {
    return (
      <Navigate 
        to={ROUTES.LOGIN} 
        state={{ from: location.pathname }} 
        replace 
      />
    )
  }

  // 如果用户已登录但访问登录/注册页，重定向到仪表板
  if (!requireAuth && isAuthenticated && (
    location.pathname === ROUTES.LOGIN || 
    location.pathname === ROUTES.REGISTER
  )) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  // 检查权限
  if (requiredPermissions.length > 0 && user) {
    const hasAllPermissions = requiredPermissions.every(permission => 
      hasPermission(permission)
    )
    if (!hasAllPermissions) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">访问被拒绝</h2>
            <p className="text-gray-600">您没有访问此页面的权限</p>
          </div>
        </div>
      )
    }
  }

  // 检查角色
  if (requiredRoles.length > 0 && user) {
    const hasAllRoles = requiredRoles.every(role => hasRole(role))
    if (!hasAllRoles) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">访问被拒绝</h2>
            <p className="text-gray-600">您没有访问此页面的角色权限</p>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}