import React from 'react'
import { BrandMark } from '@/components/layout/brand-mark'

interface LoginFrameProps extends React.PropsWithChildren {
  /** Desktop shell window; the composition is the same, only marked. */
  desktop: boolean
}

/**
 * Account pages (sign in, register): the brand wordmark over one centred
 * card on the shell tone. No marketing panel, so the form is the page.
 */
export const LoginFrame: React.FC<LoginFrameProps> = ({
  desktop,
  children,
}) => (
  <main
    className="flex min-h-dvh flex-col items-center justify-center bg-components-app-shell-bg px-space-base py-space-2xl"
    data-auth-frame={desktop ? 'desktop' : 'web'}
  >
    <div className="flex w-full max-w-md flex-col gap-space-lg">
      <BrandMark className="self-center" />
      <section className="rounded-radius-xl border border-components-main-workbench-border bg-components-main-workbench-surface p-space-lg shadow-elevation-low sm:p-space-xl">
        {children}
      </section>
    </div>
  </main>
)
