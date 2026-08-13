import React from 'react'
import { Outlet } from 'react-router-dom'
import { AuthGuard } from '@/components/auth'
import { ApplicationCommandProvider } from '@/lib/commands'
import { PlatformKind, usePlatform } from '@/platform'
import { AppShell } from './app-shell'

const DesktopWorkbench = React.lazy(async () => {
  const module = await import('./desktop')
  return { default: module.DesktopWorkbench }
})

const DesktopWorkbenchFallback: React.FC = () => (
  <div
    className="h-dvh bg-components-app-shell-bg"
    aria-busy="true"
    data-desktop-workbench-loading="true"
  />
)

export const Layout: React.FC = () => {
  const platform = usePlatform()
  const content = <Outlet />

  return (
    <AuthGuard requireAuth={true}>
      <ApplicationCommandProvider>
        {platform.kind === PlatformKind.DESKTOP ? (
          <React.Suspense fallback={<DesktopWorkbenchFallback />}>
            <DesktopWorkbench>{content}</DesktopWorkbench>
          </React.Suspense>
        ) : (
          <AppShell>{content}</AppShell>
        )}
      </ApplicationCommandProvider>
    </AuthGuard>
  )
}
