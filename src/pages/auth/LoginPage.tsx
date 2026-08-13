import React from 'react'
import { PlatformKind, usePlatform } from '@/platform'
import { LoginForm } from './components/login-form'
import { LoginFrame } from './components/login-frame'

export const LoginPage: React.FC = () => {
  const platform = usePlatform()
  return (
    <LoginFrame desktop={platform.kind === PlatformKind.DESKTOP}>
      <LoginForm />
    </LoginFrame>
  )
}
