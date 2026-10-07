import React from 'react'
import { AuthCarousel } from '@/components/auth/AuthCarousel'
import { cn } from '@/lib/utils'

interface LoginFrameProps extends React.PropsWithChildren {
  desktop: boolean
}

export const LoginFrame: React.FC<LoginFrameProps> = ({
  desktop,
  children,
}) => {
  if (desktop) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-components-app-shell-bg p-space-xl"
        data-auth-frame="desktop"
      >
        <section className="w-full max-w-lg rounded-radius-xl border border-components-main-workbench-border bg-components-main-workbench-surface p-space-xl shadow-elevation-high">
          {children}
        </section>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen" data-auth-frame="web">
      <AuthCarousel />
      <section
        className={cn(
          'flex flex-1 flex-col justify-center bg-background-body px-space-xl py-space-2xl',
          'lg:px-space-2xl',
        )}
      >
        <div className="mx-auto w-full max-w-md">{children}</div>
      </section>
    </main>
  )
}
