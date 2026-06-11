import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loading } from '@/components/ui/loading'
import { useAuthStore } from '@/stores/auth'
import { ROUTES } from '@/constants'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { AuthCarousel } from '@/components/auth/AuthCarousel'

interface FormData {
  nickname: string
  email: string
  password: string
  confirmPassword: string
  company: string
  role: string
}

const steps = [
  { title: '个人信息', description: '告诉我们关于您的基本信息' },
  { title: '账户设置', description: '创建您的安全账户' },
  { title: '工作信息', description: '帮助我们个性化您的体验' },
]

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const { register: registerUser, isLoading } = useAuthStore()
  const [currentStep, setCurrentStep] = React.useState(0)
  const [formData, setFormData] = React.useState<FormData>({
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    role: '',
  })
  const [showPassword, _setShowPassword] = React.useState(false)
  const [showConfirmPassword, _setShowConfirmPassword] = React.useState(false)

  const progress = ((currentStep + 1) / steps.length) * 100

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      // 只发送后端需要的字段
      await registerUser({
        nickname: formData.nickname,
        email: formData.email,
        password: formData.password,
      })
      navigate(ROUTES.HOME)
    } catch (error: any) {
      console.error('注册失败:', error.message || '注册失败，请重试')
    }
  }

  return (
    <div className="flex min-h-screen">
      <AuthCarousel
        gradientFrom="from-status-success"
        gradientTo="to-state-focus"
      />
      <div className="flex flex-1 flex-col justify-center bg-background-body px-8 py-12 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-2xl font-bold">创建您的账户</h1>
            <p className="text-text-secondary">加入我们，开始您的协作之旅</p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="mb-2 flex justify-between text-xs text-text-tertiary">
              <span>
                步骤 {currentStep + 1} / {steps.length}
              </span>
              <span>{Math.round(progress)}% 完成</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="mt-3">
              <h3 className="text-sm font-medium text-text-primary">
                {steps[currentStep].title}
              </h3>
              <p className="text-xs text-text-secondary">
                {steps[currentStep].description}
              </p>
            </div>
          </div>

          {/* Form Steps */}
          <form className="space-y-4">
            {/* Step 1: Personal Info */}
            {currentStep === 0 && (
              <>
                <div>
                  <Label htmlFor="nickname">昵称</Label>
                  <Input
                    id="nickname"
                    value={formData.nickname}
                    onChange={(e) =>
                      handleInputChange('nickname', e.target.value)
                    }
                    placeholder="请输入您的昵称"
                  />
                </div>
                <div>
                  <Label htmlFor="email">邮箱地址</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="zhangsan@example.com"
                  />
                </div>
              </>
            )}

            {/* Step 2: Account Setup */}
            {currentStep === 1 && (
              <>
                <div>
                  <Label htmlFor="password">密码</Label>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange('password', e.target.value)
                    }
                    placeholder="创建一个强密码"
                  />
                  <p className="mt-1 text-xs text-text-tertiary">
                    密码至少4位字符
                  </p>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">确认密码</Label>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange('confirmPassword', e.target.value)
                    }
                    placeholder="确认您的密码"
                  />
                </div>
              </>
            )}

            {/* Step 3: Work Details */}
            {currentStep === 2 && (
              <>
                <div>
                  <Label htmlFor="company">公司（可选）</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) =>
                      handleInputChange('company', e.target.value)
                    }
                    placeholder="您的公司名称"
                  />
                </div>
                <div>
                  <Label htmlFor="role">职位（可选）</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    placeholder="您的职位名称"
                  />
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4">
              {currentStep > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex-1"
                >
                  上一步
                </Button>
              )}
              {currentStep < steps.length - 1 ? (
                <Button type="button" onClick={handleNext} className="flex-1">
                  下一步
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loading variant="spinner" size="sm" className="mr-2" />
                      创建中...
                    </>
                  ) : (
                    '创建账户'
                  )}
                </Button>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-text-secondary">
            已有账户？{' '}
            <Link
              to={ROUTES.LOGIN}
              className="hover:text-text-accent/80 font-medium text-text-accent"
            >
              立即登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
