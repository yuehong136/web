import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Badge: a DreamJira lozenge (4px corners, 12/16 medium text) named by what
 * it means, not its colour. `tone` picks the semantic role (neutral, accent,
 * ai, info, success, warning, danger) and `variant` how strongly it is drawn
 * (soft fill, outline, solid). `identity` tints it with one of the eight
 * identity colours instead, for kinds that are categories rather than states
 * (memory types, task labels). Status with a dot is StatusDot, not a Badge.
 * Renders a span, so it can sit inside text.
 */
const badgeVariants = cva(
  'inline-flex max-w-full shrink-0 items-center gap-space-xs rounded-radius-sm border border-transparent px-space-sm py-space-2xs text-xs leading-4 font-medium whitespace-nowrap transition-colors focus-ring',
  {
    variants: {
      tone: {
        neutral: '',
        accent: '',
        ai: '',
        info: '',
        success: '',
        warning: '',
        danger: '',
      },
      variant: {
        soft: '',
        outline: 'bg-transparent',
        solid: '',
      },
    },
    compoundVariants: [
      {
        tone: 'neutral',
        variant: 'soft',
        class: 'bg-fill-muted text-fg-muted',
      },
      {
        tone: 'neutral',
        variant: 'outline',
        class: 'border-line text-fg-muted',
      },
      {
        tone: 'neutral',
        variant: 'solid',
        class: 'bg-neutral-solid text-neutral-on-solid',
      },
      {
        tone: 'accent',
        variant: 'soft',
        class: 'bg-accent-soft text-accent-fg',
      },
      {
        tone: 'accent',
        variant: 'outline',
        class: 'border-accent-line text-accent-fg',
      },
      {
        tone: 'accent',
        variant: 'solid',
        class: 'bg-accent-solid text-accent-on-solid',
      },
      { tone: 'ai', variant: 'soft', class: 'bg-ai-soft text-ai-fg' },
      { tone: 'ai', variant: 'outline', class: 'border-ai-line text-ai-fg' },
      { tone: 'ai', variant: 'solid', class: 'bg-ai-solid text-ai-on-solid' },
      { tone: 'info', variant: 'soft', class: 'bg-info-soft text-info-fg' },
      {
        tone: 'info',
        variant: 'outline',
        class: 'border-info-line text-info-fg',
      },
      {
        tone: 'info',
        variant: 'solid',
        class: 'bg-info-solid text-info-on-solid',
      },
      {
        tone: 'success',
        variant: 'soft',
        class: 'bg-success-soft text-success-fg',
      },
      {
        tone: 'success',
        variant: 'outline',
        class: 'border-success-line text-success-fg',
      },
      {
        tone: 'success',
        variant: 'solid',
        class: 'bg-success-solid text-success-on-solid',
      },
      {
        tone: 'warning',
        variant: 'soft',
        class: 'bg-warning-soft text-warning-fg',
      },
      {
        tone: 'warning',
        variant: 'outline',
        class: 'border-warning-line text-warning-fg',
      },
      {
        tone: 'warning',
        variant: 'solid',
        class: 'bg-warning-solid text-warning-on-solid',
      },
      {
        tone: 'danger',
        variant: 'soft',
        class: 'bg-danger-soft text-danger-fg',
      },
      {
        tone: 'danger',
        variant: 'outline',
        class: 'border-danger-line text-danger-fg',
      },
      {
        tone: 'danger',
        variant: 'solid',
        class: 'bg-danger-solid text-danger-on-solid',
      },
    ],
    defaultVariants: {
      tone: 'neutral',
      variant: 'soft',
    },
  },
)

/** Identity tints, spelled out so Tailwind sees every class. */
const IDENTITY = {
  1: 'bg-avatar-1-bg text-avatar-1-fg',
  2: 'bg-avatar-2-bg text-avatar-2-fg',
  3: 'bg-avatar-3-bg text-avatar-3-fg',
  4: 'bg-avatar-4-bg text-avatar-4-fg',
  5: 'bg-avatar-5-bg text-avatar-5-fg',
  6: 'bg-avatar-6-bg text-avatar-6-fg',
  7: 'bg-avatar-7-bg text-avatar-7-fg',
  8: 'bg-avatar-8-bg text-avatar-8-fg',
} as const

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>
export type BadgeIdentity = keyof typeof IDENTITY

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** One of the eight identity colours; replaces the tone's colours. */
  identity?: BadgeIdentity
}

function Badge({ className, tone, variant, identity, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      data-tone={identity ? undefined : (tone ?? 'neutral')}
      className={cn(
        badgeVariants({ tone, variant }),
        identity && IDENTITY[identity],
        className,
      )}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

/**
 * The colour names Badge took before tone × variant, still used by status
 * maps across the app. `badgeLook` turns one into props:
 * `<Badge {...badgeLook(STATUS[x])}>`. New code passes tone, variant or
 * identity directly; maps move over as they are touched.
 */
export type BadgeLook =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'destructive'
  | 'success'
  | 'warning'
  | 'blue'
  | 'orange'
  | 'purple'
  | 'green'

const LOOKS: Record<
  BadgeLook,
  Pick<BadgeProps, 'tone' | 'variant' | 'identity'>
> = {
  default: {},
  secondary: {},
  outline: { variant: 'outline' },
  destructive: { tone: 'danger' },
  success: { tone: 'success' },
  warning: { tone: 'warning' },
  blue: { identity: 6 },
  orange: { identity: 2 },
  purple: { identity: 7 },
  green: { identity: 4 },
}

export const badgeLook = (look: BadgeLook | null | undefined) =>
  look ? LOOKS[look] : {}
