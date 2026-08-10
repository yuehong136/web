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
import { AlertTriangle, Eye, EyeOff, Mail, X } from 'lucide-react'
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
    defaultValues: {
      remember: false,
    },
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
