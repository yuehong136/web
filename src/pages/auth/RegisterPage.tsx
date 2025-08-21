import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loading } from '@/components/ui/loading'
import { useAuthStore } from '@/stores/auth'
import { ROUTES } from '@/constants'
import { Eye, EyeOff, User, Mail, Lock, Building, Briefcase, Github } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { AuthCarousel } from '@/components/auth/AuthCarousel'

const registerSchema = z.object({
  nickname: z.string().min(2, '昵称至少2位'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(4, '密码至少4位'),
  confirmPassword: z.string(),
  company: z.string().optional(),
  role: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
})

interface FormData {
  nickname: string;
  email: string;
  password: string;
  confirmPassword: string;
  company: string;
  role: string;
}

const steps = [
  { title: "个人信息", description: "告诉我们关于您的基本信息" },
  { title: "账户设置", description: "创建您的安全账户" },
  { title: "工作信息", description: "帮助我们个性化您的体验" },
];

type RegisterFormData = z.infer<typeof registerSchema>

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const { register: registerUser, isLoading } = useAuthStore()
  const [currentStep, setCurrentStep] = React.useState(0)
  const [formData, setFormData] = React.useState<FormData>({
    nickname: "",
    email: "",
    password: "",
    confirmPassword: "",
    company: "",
    role: "",
  })
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      // 只发送后端需要的字段
      await registerUser({
        nickname: formData.nickname,
        email: formData.email,
        password: formData.password,
      })
      navigate(ROUTES.DASHBOARD)
    } catch (error: any) {
      console.error('注册失败:', error.message || '注册失败，请重试')
    }
  }

  const handleSocialLogin = (provider: string) => {
    window.location.href = `/api/auth/oauth/${provider.toLowerCase()}`
  }

  return (
    <div className="min-h-screen flex">
      <AuthCarousel gradientFrom="from-success-600" gradientTo="to-primary-700" />
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-12 bg-background-body">
        <div className="w-full max-w-md mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl mb-2 font-bold">创建您的账户</h1>
            <p className="text-text-secondary">
              加入我们，开始您的协作之旅
            </p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-xs text-text-tertiary mb-2">
              <span>步骤 {currentStep + 1} / {steps.length}</span>
              <span>{Math.round(progress)}% 完成</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="mt-3">
              <h3 className="text-sm font-medium text-text-primary">{steps[currentStep].title}</h3>
              <p className="text-xs text-text-secondary">
                {steps[currentStep].description}
              </p>
            </div>
          </div>

          {/* Social Login (only on first step) */}
          {currentStep === 0 && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Button
                  variant="outline"
                  onClick={() => handleSocialLogin("GitHub")}
                  className="w-full"
                >
                  <Github className="w-4 h-4 mr-2" />
                  GitHub
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSocialLogin("Google")}
                  className="w-full"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </Button>
              </div>

              <div className="relative mb-6">
                <Separator />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-background-body px-3 text-xs text-text-tertiary">
                    或继续填写邮箱
                  </span>
                </div>
              </div>
            </>
          )}

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
                    onChange={(e) => handleInputChange("nickname", e.target.value)}
                    placeholder="请输入您的昵称"
                  />
                </div>
                <div>
                  <Label htmlFor="email">邮箱地址</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
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
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="创建一个强密码"
                  />
                  <p className="text-xs text-text-tertiary mt-1">
                    密码至少4位字符
                  </p>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">确认密码</Label>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
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
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    placeholder="您的公司名称"
                  />
                </div>
                <div>
                  <Label htmlFor="role">职位（可选）</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => handleInputChange("role", e.target.value)}
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
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex-1"
                >
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
            已有账户？{" "}
            <Link
              to={ROUTES.LOGIN}
              className="text-text-accent hover:text-text-accent/80 font-medium"
            >
              立即登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}