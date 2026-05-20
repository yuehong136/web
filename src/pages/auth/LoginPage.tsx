import React from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Loading } from '@/components/ui/loading'
import { useAuthStore } from '@/stores/auth'
import { ROUTES } from '@/constants'
import { AlertTriangle, Eye, EyeOff, Github, Mail, X } from 'lucide-react'
import { AuthCarousel } from '@/components/auth/AuthCarousel'

const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(4, '密码至少4位'),
  remember: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { login, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = React.useState(false)
  const [showExpiredAlert, setShowExpiredAlert] = React.useState(false)

  // 检查是否启用注册功能
  const isRegistrationEnabled =
    import.meta.env.VITE_ENABLE_REGISTRATION === 'true'

  // 检查是否因为token过期而重定向
  React.useEffect(() => {
    const isExpired = searchParams.get('expired') === 'true'
    if (!isExpired) return

    setShowExpiredAlert(true)
    // 清除URL参数，避免刷新页面时重复显示
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('expired')
    setSearchParams(nextParams, { replace: true })

    // 8秒后自动隐藏提示
    const timer = setTimeout(() => {
      setShowExpiredAlert(false)
    }, 8000)

    return () => clearTimeout(timer)
  }, [searchParams, setSearchParams])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password, data.remember)
      navigate(ROUTES.HOME)
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : '登录失败，请重试'
      setError('root', {
        message: errorMessage,
      })
    }
  }

  const handleOAuthLogin = (provider: 'github' | 'google') => {
    window.location.href = `/api/auth/oauth/${provider}`
  }

  return (
    <div className="flex min-h-screen">
      <AuthCarousel
        gradientFrom="from-components-button-primary-bg"
        gradientTo="to-state-focus"
      />
      <div className="flex flex-1 flex-col justify-center bg-background-body px-8 py-12 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-2xl font-bold">登录您的账户</h1>
            <p className="text-text-secondary">欢迎回来，继续您的工作之旅</p>
          </div>

          {/* 登录过期提示 */}
          {showExpiredAlert && (
            <div
              className="px-space-md py-space-base rounded-radius-lg shadow-elevation-low mb-6 animate-fade-in border border-components-alert-warning-border bg-components-alert-warning-bg text-components-alert-warning-text"
              role="alert"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium">登录已过期</h3>
                  <p className="mt-1 text-xs">
                    您的登录状态已过期，请重新登录以继续使用
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    onClick={() => setShowExpiredAlert(false)}
                    className="rounded-radius-md p-space-xs text-components-alert-warning-text hover:bg-status-warning-subtle focus:outline-none focus:ring-2 focus:ring-state-focus focus:ring-offset-2 focus:ring-offset-background-body"
                    aria-label="关闭提示"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Social Login */}
          <div className="mb-6 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handleOAuthLogin('github')}
              className="w-full"
            >
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOAuthLogin('google')}
              className="w-full"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-default" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background-body px-3 text-text-tertiary">
                或使用邮箱登录
              </span>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {errors.root && (
              <div
                className="px-space-md py-space-base rounded-radius-md border border-components-alert-error-border bg-components-alert-error-bg text-components-alert-error-text"
                role="alert"
              >
                {errors.root.message}
              </div>
            )}

            <div>
              <Input
                label="邮箱地址"
                type="email"
                autoComplete="email"
                required
                {...register('email')}
                error={errors.email?.message}
                leftIcon={<Mail className="h-4 w-4" />}
                placeholder="zhangsan@example.com"
                autoFocus
              />
            </div>

            <div>
              <Input
                label="密码"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                {...register('password')}
                error={errors.password?.message}
                placeholder="请输入您的密码"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-text-tertiary transition-colors hover:text-text-secondary"
                    aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="gap-space-xs flex items-center">
                <Controller
                  name="remember"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="remember-me"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <label
                  htmlFor="remember-me"
                  className="cursor-pointer text-sm text-text-primary"
                >
                  记住我
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/auth/forgot-password"
                  className="hover:text-text-accent/80 font-medium text-text-accent"
                >
                  忘记密码？
                </Link>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loading variant="spinner" size="sm" className="mr-2" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </Button>
          </form>

          {/* Footer */}
          {isRegistrationEnabled && (
            <div className="mt-8 text-center text-sm text-text-secondary">
              还没有账户？{' '}
              <Link
                to={ROUTES.REGISTER}
                className="hover:text-text-accent/80 font-medium text-text-accent"
              >
                立即注册
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
