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
        className="p-space-xl flex min-h-screen items-center justify-center bg-components-app-shell-bg"
        data-auth-frame="desktop"
      >
        <section className="rounded-radius-xl shadow-elevation-high p-space-xl w-full max-w-lg border border-components-main-workbench-border bg-components-main-workbench-surface">
          {children}
        </section>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen" data-auth-frame="web">
      <AuthCarousel
        gradientFrom="from-components-button-primary-bg"
        gradientTo="to-state-focus"
      />
      <section
        className={cn(
          'px-space-xl py-space-2xl flex flex-1 flex-col justify-center bg-background-body',
          'lg:px-space-2xl',
        )}
      >
        <div className="mx-auto w-full max-w-md">{children}</div>
      </section>
    </main>
  )
}
