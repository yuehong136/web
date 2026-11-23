import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react'
import { cn } from '@/lib/utils'
import { useReducedMotionPreference } from '@/themes/use-reduced-motion'
import './brand-glyph.css'

export type BrandGlyphState = 'idle' | 'thinking' | 'streaming' | 'done'

/** Five sides of a regular octagon (apothem 8.3) on the 24 grid, open to the top right. */
const HOLDER_PATH = 'M8.56 3.7L3.7 8.56V15.44L8.56 20.3H15.44L20.3 15.44'
/** A rounded diamond (half-width 2.7, radius 1.2) at (14.2, 9.8), 2.2 along the 45° axis from the centre. */
const CORE_PATH =
  'M13.35 5.13A1.2 1.2 0 0 1 15.05 5.13L18.87 8.95A1.2 1.2 0 0 1 18.87 10.65L15.05 14.47A1.2 1.2 0 0 1 13.35 14.47L9.53 10.65A1.2 1.2 0 0 1 9.53 8.95Z'
/** Chunks that arrive closer together than this merge into one nudge. */
export const BRAND_GLYPH_GIVE_INTERVAL_MS = 280

export interface BrandGlyphProps {
  state?: BrandGlyphState
  /** `ai` fills the core with the scheme's AI gradient; `mono` draws it in the text colour. */
  paint?: 'ai' | 'mono'
  /**
   * While streaming, change this whenever content arrives (the text length
   * works); each change nudges the core, at most once per 280ms. Without it a
   * streaming glyph loops on its own.
   */
  pulse?: number | string
  /** Accessible name. Without one the glyph is decorative. */
  label?: string
  className?: string
}

/**
 * The product glyph 承: an octagonal holder in the text colour that hands an
 * offset diamond core towards its opening. The holder never moves; the core
 * carries the AI states. Size it with `size-*` and colour it with `text-*`.
 */
export function BrandGlyph({
  state = 'idle',
  paint = 'ai',
  pulse,
  label,
  className,
}: BrandGlyphProps) {
  const gradientId = `brand-glyph-${useId().replace(/[^\w-]/g, '')}`
  const coreRef = useRef<SVGPathElement>(null)
  useGive(coreRef, state === 'streaming' ? pulse : undefined)
  const corePaint = paint === 'ai' ? `url(#${gradientId})` : 'currentColor'
  const coreStyle = { '--brand-glyph-core': corePaint } as CSSProperties
  const fading = state === 'done' && paint === 'ai'
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      data-brand-glyph
      data-state={state}
      className={cn('brand-glyph size-6 shrink-0', className)}
      {...(label
        ? { role: 'img', 'aria-label': label }
        : { 'aria-hidden': true, focusable: false })}
    >
      {paint === 'ai' && (
        <defs>
          <linearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1="10"
            y1="14"
            x2="18.6"
            y2="5.4"
          >
            <stop offset="0" style={{ stopColor: 'var(--color-ai-from)' }} />
            <stop offset="0.55" style={{ stopColor: 'var(--color-ai-via)' }} />
            <stop offset="1" style={{ stopColor: 'var(--color-ai-to)' }} />
          </linearGradient>
        </defs>
      )}
      <path
        d={HOLDER_PATH}
        stroke="currentColor"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {fading && (
        <path className="brand-glyph-core" d={CORE_PATH} fill="currentColor" />
      )}
      <path
        ref={coreRef}
        className={cn(
          'brand-glyph-core',
          fading && 'brand-glyph-fade',
          state === 'streaming' && pulse === undefined && 'brand-glyph-loop',
        )}
        d={CORE_PATH}
        fill={corePaint}
        style={coreStyle}
      />
    </svg>
  )
}

/** Nudge the core towards the opening when `pulse` changes, merging bursts. */
function useGive(
  coreRef: RefObject<SVGPathElement | null>,
  pulse: number | string | undefined,
) {
  const reducedMotion = useReducedMotionPreference()
  const lastGive = useRef(Number.NEGATIVE_INFINITY)
  const pending = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (pulse === undefined || reducedMotion || pending.current !== undefined)
      return
    const give = () => {
      pending.current = undefined
      lastGive.current = performance.now()
      const core = coreRef.current
      if (typeof core?.animate !== 'function') return
      core.animate(
        [
          { transform: 'none' },
          { transform: 'translate(0.9px, -0.9px)', offset: 0.4 },
          { transform: 'none' },
        ],
        {
          duration: BRAND_GLYPH_GIVE_INTERVAL_MS,
          // The Web Animations API takes no var(); resolve the token here.
          easing:
            getComputedStyle(core).getPropertyValue('--ease-out').trim() ||
            'ease-out',
        },
      )
    }
    const wait =
      lastGive.current + BRAND_GLYPH_GIVE_INTERVAL_MS - performance.now()
    if (wait <= 0) give()
    else pending.current = window.setTimeout(give, wait)
  }, [coreRef, pulse, reducedMotion])
  useEffect(() => () => window.clearTimeout(pending.current), [])
}

/**
 * The glyph state for one answer: thinking until output arrives, streaming
 * while it does, and done only after this answer was seen running, so answers
 * loaded from history rest without replaying the finish.
 */
export function useBrandGlyphRunState(
  running: boolean,
  hasOutput: boolean,
): BrandGlyphState {
  const [seenRunning, setSeenRunning] = useState(running)
  if (running && !seenRunning) setSeenRunning(true)
  if (running) return hasOutput ? 'streaming' : 'thinking'
  return seenRunning ? 'done' : 'idle'
}
