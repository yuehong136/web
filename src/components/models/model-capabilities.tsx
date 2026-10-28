import {
  BrainCircuit,
  ScanEye,
  AudioLines,
  Mic,
  ListFilter,
  ScanText,
  Wrench,
  Network,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const icons: Partial<Record<string, LucideIcon>> = {
  chat: BrainCircuit,
  embedding: Network,
  rerank: ListFilter,
  image2text: ScanEye,
  speech2text: Mic,
  tts: AudioLines,
  ocr: ScanText,
  tools: Wrench,
}
const aliases: Record<string, string> = {
  LLM: 'chat',
  'TEXT EMBEDDING': 'embedding',
  'TEXT RE-RANK': 'rerank',
  IMAGE2TEXT: 'image2text',
  SPEECH2TEXT: 'speech2text',
  TTS: 'tts',
}
export function ModelCapability({ type }: { type: string }) {
  const { t } = useTranslation()
  const kind = aliases[type] ?? type
  const Icon = icons[kind]
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      {Icon && <Icon aria-hidden className="size-3 shrink-0" />}
      {Icon ? t(`common.modelPicker.capabilities.${kind}`) : type}
    </span>
  )
}
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
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary',
        className,
      )}
    >
      {[...new Set([...types, ...(tools ? ['tools'] : [])])].map((type) => (
        <ModelCapability key={type} type={type} />
      ))}
    </span>
  )
}
