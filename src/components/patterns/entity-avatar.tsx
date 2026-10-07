import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn } from '@/lib/utils'

/**
 * One avatar for apps, agents, knowledge bases, search apps, memories, users,
 * teams and chat roles. The image wins when it loads; otherwise a monogram (or
 * the given icon) sits on a stable categorical tint whose foreground is solved
 * for WCAG AA in both themes (`components-avatar-{1..8}-*`).
 */

// Static class strings so Tailwind can see every tone.
const TONES = [
  'bg-components-avatar-1-bg text-components-avatar-1-text',
  'bg-components-avatar-2-bg text-components-avatar-2-text',
  'bg-components-avatar-3-bg text-components-avatar-3-text',
  'bg-components-avatar-4-bg text-components-avatar-4-text',
  'bg-components-avatar-5-bg text-components-avatar-5-text',
  'bg-components-avatar-6-bg text-components-avatar-6-text',
  'bg-components-avatar-7-bg text-components-avatar-7-text',
  'bg-components-avatar-8-bg text-components-avatar-8-text',
] as const

const NEUTRAL_TONE = 'bg-background-subtle text-text-secondary'

const SIZES = {
  '2xs': 'size-4 text-[0.5625rem] [&_svg]:size-2.5',
  xs: 'size-5 text-[0.6875rem] [&_svg]:size-3',
  sm: 'size-6 text-xs [&_svg]:size-3.5',
  md: 'size-8 text-sm [&_svg]:size-4',
  lg: 'size-10 text-base [&_svg]:size-5',
  xl: 'size-12 text-lg [&_svg]:size-6',
  '2xl': 'size-16 text-2xl [&_svg]:size-8',
} as const

// Rounded tiles keep their corner proportional to the tile.
const RADII: Record<EntityAvatarSize, string> = {
  '2xs': 'rounded-radius-sm',
  xs: 'rounded-radius-sm',
  sm: 'rounded-radius-sm',
  md: 'rounded-radius-md',
  lg: 'rounded-radius-lg',
  xl: 'rounded-radius-lg',
  '2xl': 'rounded-radius-xl',
}

export type EntityAvatarSize = keyof typeof SIZES

export interface EntityAvatarProps extends Omit<
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
  'children'
> {
  /** Display name; drives the monogram and, without `seed`, the tone. */
  name?: string | null
  /** Image URL, data URL or bare base64 payload. */
  src?: string | null
  /** Stable key for the tone (for example the id), so renames keep the color. */
  seed?: string | null
  size?: EntityAvatarSize
  /** Rounded tiles for things; circles for people and chat roles. */
  shape?: 'rounded' | 'circle'
  /** Shown instead of the monogram, e.g. a Bot icon for an unnamed assistant. */
  icon?: React.ReactNode
  /** `neutral` drops the categorical tint (anonymous users, generic roles). */
  tone?: 'auto' | 'neutral'
  /** Adds role="img" and a label; leave false when the name is shown next to it. */
  labelled?: boolean
}

/** FNV-1a: cheap, stable and well spread for short strings. */
export function getEntityToneIndex(key: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0) % TONES.length
}

let graphemes: Intl.Segmenter | undefined

/** First grapheme of the name, so emoji and CJK names stay intact. */
export function getEntityMonogram(name?: string | null): string {
  const text = name?.trim()
  if (!text) return ''
  graphemes ??= new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  const first = graphemes.segment(text)[Symbol.iterator]().next().value
  return (first?.segment ?? '').toLocaleUpperCase()
}

/** Accepts URLs and the bare base64 icons some endpoints return. */
export function resolveAvatarSrc(src?: string | null): string | undefined {
  const value = src?.trim()
  if (!value) return undefined
  return /^(data:|https?:|blob:|\/)/i.test(value)
    ? value
    : `data:image/png;base64,${value}`
}

export function EntityAvatar({
  name,
  src,
  seed,
  size = 'md',
  shape = 'rounded',
  icon,
  tone = 'auto',
  labelled = false,
  className,
  ...props
}: EntityAvatarProps) {
  const monogram = getEntityMonogram(name)
  const key = seed?.trim() || name?.trim() || ''
  const toneClass =
    tone === 'neutral' || !key ? NEUTRAL_TONE : TONES[getEntityToneIndex(key)]
  const imageSrc = resolveAvatarSrc(src)

  return (
    <AvatarPrimitive.Root
      data-slot="entity-avatar"
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? (name ?? undefined) : undefined}
      aria-hidden={labelled ? undefined : true}
      className={cn(
        'relative inline-flex shrink-0 overflow-hidden align-middle font-semibold select-none',
        // A hairline ring keeps white logos and pale tints from melting into
        // the surface behind them.
        'after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:ring-1 after:ring-border-subtle after:ring-inset',
        SIZES[size],
        shape === 'circle' ? 'rounded-full' : RADII[size],
        className,
      )}
      {...props}
    >
      {imageSrc ? (
        <AvatarPrimitive.Image
          src={imageSrc}
          alt=""
          className="size-full object-cover"
        />
      ) : null}
      <AvatarPrimitive.Fallback
        delayMs={imageSrc ? 300 : undefined}
        className={cn(
          'flex size-full items-center justify-center leading-none',
          toneClass,
        )}
      >
        {icon ?? monogram}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
}
