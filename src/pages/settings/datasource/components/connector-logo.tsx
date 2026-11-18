import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Static class strings so Tailwind can see every size. The connector marks
// are fixed-size images or icons; the tile sizes them.
const SIZES = {
  md: 'size-7 rounded-radius-md [&_img]:size-4.5 [&_svg]:size-4.5',
  lg: 'size-10 rounded-radius-lg [&_img]:size-6 [&_svg]:size-6',
  xl: 'size-12 rounded-radius-lg [&_img]:size-7 [&_svg]:size-7',
} as const

export type ConnectorLogoSize = keyof typeof SIZES

/**
 * A connector's brand mark seated on the same neutral tile `ProviderLogo`
 * uses, so colour and single-colour marks read alike in both themes. The
 * connector name always sits beside it, so the tile is decorative.
 */
export function ConnectorLogo({
  icon,
  size = 'lg',
  className,
}: {
  /** The connector's mark from `useDataSourceInfo`. */
  icon: ReactNode
  size?: ConnectorLogoSize
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      data-slot="connector-logo"
      className={cn(
        'inline-flex shrink-0 items-center justify-center bg-sunken text-fg ring-1 ring-line-subtle ring-inset',
        SIZES[size],
        className,
      )}
    >
      {icon}
    </span>
  )
}

/** Three connector tiles fanned out: first-use art for the data source page. */
export function ConnectorStackIllustration({
  icons,
}: {
  /** Left, centre and right marks. */
  icons: [ReactNode, ReactNode, ReactNode]
}) {
  const [left, centre, right] = icons
  return (
    <div aria-hidden="true" className="relative h-20 w-40">
      <ConnectorLogo
        icon={left}
        size="xl"
        className="absolute top-6 left-4 -rotate-10 bg-surface"
      />
      <ConnectorLogo
        icon={right}
        size="xl"
        className="absolute top-6 right-4 rotate-10 bg-surface"
      />
      <ConnectorLogo
        icon={centre}
        size="xl"
        className="absolute top-1 left-1/2 -translate-x-1/2 bg-surface shadow-elevation-medium"
      />
    </div>
  )
}
