import React from 'react'
import { Outlet } from 'react-router-dom'
import { AuthGuard } from '@/components/auth'
import { AppShell } from './app-shell'

export const Layout: React.FC = () => {
  return (
    <AuthGuard requireAuth={true}>
      <AppShell>
        <Outlet />
      </AppShell>
    </AuthGuard>
  )
}
