import {
  MessageSquare,
  Image,
  AudioLines,
  Mic,
  ArrowDownWideNarrow,
  ScanText,
  Braces,
  Layers,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

/** Model capability kinds as the model APIs name them. */
export type ModelCapabilityKind =
  | 'chat'
  | 'embedding'
  | 'rerank'
  | 'image2text'
  | 'speech2text'
  | 'tts'
  | 'ocr'
  | 'tools'

export const MODEL_CAPABILITY_ICONS: Record<ModelCapabilityKind, LucideIcon> = {
  chat: MessageSquare,
  embedding: Layers,
  rerank: ArrowDownWideNarrow,
  image2text: Image,
  speech2text: Mic,
  tts: AudioLines,
  ocr: ScanText,
  tools: Braces,
}

/**
 * One avatar tint per capability (static strings so Tailwind sees them), so a
 * capability keeps its colour on default-model rows and provider cards.
 */
export const MODEL_CAPABILITY_TONES: Record<ModelCapabilityKind, string> = {
  chat: 'bg-components-avatar-6-bg text-components-avatar-6-text',
  embedding: 'bg-components-avatar-5-bg text-components-avatar-5-text',
  rerank: 'bg-components-avatar-7-bg text-components-avatar-7-text',
  image2text: 'bg-components-avatar-8-bg text-components-avatar-8-text',
  speech2text: 'bg-components-avatar-2-bg text-components-avatar-2-text',
  tts: 'bg-components-avatar-4-bg text-components-avatar-4-text',
  ocr: 'bg-components-avatar-3-bg text-components-avatar-3-text',
  tools: 'bg-components-avatar-1-bg text-components-avatar-1-text',
}

const aliases: Record<string, ModelCapabilityKind> = {
  LLM: 'chat',
  'TEXT EMBEDDING': 'embedding',
  'TEXT RE-RANK': 'rerank',
  IMAGE2TEXT: 'image2text',
  SPEECH2TEXT: 'speech2text',
  TTS: 'tts',
}

/** The capability kind for an API or catalog tag, or null for unknown tags. */
export function modelCapabilityKind(type: string): ModelCapabilityKind | null {
  const kind = aliases[type] ?? type
  return Object.hasOwn(MODEL_CAPABILITY_ICONS, kind)
    ? (kind as ModelCapabilityKind)
    : null
}

/** Icon and name of one capability, inline (filter chips, rows). */
export function ModelCapability({ type }: { type: string }) {
  const { t } = useTranslation()
  const kind = modelCapabilityKind(type)
  const Icon = kind ? MODEL_CAPABILITY_ICONS[kind] : null
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      {Icon && (
        <Icon aria-hidden strokeWidth={1.65} className="size-3.5! shrink-0" />
      )}
      {kind ? t(`common.modelPicker.capabilities.${kind}`) : type}
    </span>
  )
}

/** A model's or provider's capabilities as a row of small pills. */
export function ModelCapabilities({
  types,
  tools = false,
  className,
}: {
  types: readonly string[]
  tools?: boolean
  className?: string
}) {
  return (
    <span
      data-slot="model-capabilities"
      className={cn(
        'flex flex-wrap items-center gap-space-2xs text-xs text-text-secondary',
        className,
      )}
    >
      {[...new Set([...types, ...(tools ? ['tools'] : [])])].map((type) => (
        <span
          key={type}
          className="inline-flex h-5 items-center rounded-radius-full border border-border-subtle bg-background-subtle px-space-xs leading-none"
        >
          <ModelCapability type={type} />
        </span>
      ))}
    </span>
  )
}
