export const authResource = {
  auth: {
    login: {
      title: '登录您的账户',
      description: '欢迎回来，继续您的工作之旅',
      email: '邮箱地址',
      emailPlaceholder: 'zhangsan@example.com',
      password: '密码',
      passwordPlaceholder: '请输入您的密码',
      remember: '记住我',
      submit: '登录',
      submitting: '登录中...',
      noAccount: '还没有账户？',
      register: '立即注册',
      showPassword: '显示密码',
      hidePassword: '隐藏密码',
      expiredTitle: '登录已过期',
      expiredDescription: '您的登录状态已过期，请重新登录以继续使用',
      closeAlert: '关闭提示',
      validation: {
        email: '请输入有效的邮箱地址',
        password: '密码至少 4 位',
      },
    },
  },
} as const
