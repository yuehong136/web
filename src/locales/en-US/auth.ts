export const authResource = {
  auth: {
    login: {
      title: 'Sign in to your account',
      description: 'Welcome back. Continue where you left off.',
      email: 'Email address',
      emailPlaceholder: 'name@example.com',
      password: 'Password',
      passwordPlaceholder: 'Enter your password',
      remember: 'Remember me',
      submit: 'Sign in',
      submitting: 'Signing in...',
      noAccount: "Don't have an account?",
      register: 'Create one',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      expiredTitle: 'Session expired',
      expiredDescription: 'Sign in again to continue using the application.',
      closeAlert: 'Dismiss message',
      validation: {
        email: 'Enter a valid email address',
        password: 'Password must contain at least 4 characters',
      },
    },
  },
} as const
