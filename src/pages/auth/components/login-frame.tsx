import React from 'react'
import { BrandMark } from '@/components/layout/brand-mark'

/** The card's h1 and its one-line lead, shared by sign in and register. */
export const AuthHeading = ({
  title,
  description,
}: {
  title: React.ReactNode
  description: React.ReactNode
}) => (
  <div className="mb-space-lg flex flex-col gap-space-xs">
    <h1 className="text-xl font-semibold tracking-tight text-fg">{title}</h1>
    <p className="text-sm text-fg-muted">{description}</p>
  </div>
)

interface LoginFrameProps extends React.PropsWithChildren {
  /** Desktop shell window; the composition is the same, only marked. */
  desktop: boolean
}

/**
 * Account pages (sign in, register): the brand wordmark over one centred
 * card on the shell tone. No marketing panel, so the form is the page; the
 * card is a hairline surface like the task area, lifted only slightly.
 */
export const LoginFrame: React.FC<LoginFrameProps> = ({
  desktop,
  children,
}) => (
  <main
    className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-space-base py-space-2xl"
    data-auth-frame={desktop ? 'desktop' : 'web'}
  >
    <div className="flex w-full max-w-md flex-col gap-space-xl">
      <BrandMark className="self-center" />
      <section className="rounded-radius-xl border border-line-subtle bg-surface p-space-lg shadow-elevation-low sm:p-space-xl">
        {children}
      </section>
    </div>
  </main>
)
