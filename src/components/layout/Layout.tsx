import React from 'react'
import { Toaster } from '@/pages/ai-tools/ref/sonner'
import { Outlet } from 'react-router-dom'
import { AuthGuard } from '@/components/auth'
import { AppShell } from './app-shell'

export const Layout: React.FC = () => {
  return (
    <AuthGuard requireAuth={true}>
      <AppShell>
        <Outlet />
        <Toaster position="top-right" richColors closeButton />
      </AppShell>
    </AuthGuard>
  )
}
