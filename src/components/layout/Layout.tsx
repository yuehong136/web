import React from 'react'
import { Outlet } from 'react-router-dom'
import { AuthGuard } from '@/components/auth'
import { ApplicationCommandProvider } from '@/lib/commands'
import { PlatformKind, usePlatform } from '@/platform'
import { AppShell } from './app-shell'
import { DesktopWorkbench } from './desktop'

export const Layout: React.FC = () => {
  const platform = usePlatform()
  const content = <Outlet />

  return (
    <AuthGuard requireAuth={true}>
      <ApplicationCommandProvider>
        {platform.kind === PlatformKind.DESKTOP ? (
          <DesktopWorkbench>{content}</DesktopWorkbench>
        ) : (
          <AppShell>{content}</AppShell>
        )}
      </ApplicationCommandProvider>
    </AuthGuard>
  )
}
