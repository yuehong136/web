import {
  ArrowDownUp,
  AudioLines,
  Boxes,
  Eye,
  MessageSquare,
  Mic,
  ScanText,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { GatewayCatalogModel } from '@/api/model-gateway'
import { resolveProviderLogo } from '@/components/ui/provider-icon'
import { capabilityLabel } from '../../utils'

/**
 * Whose logo a model row shows. The app's own logo resolver already knows the
 * brands that appear in model names ("deepseek-v3.2", "Moonshot-Kimi-K2"), as
 * it does for chat answers; a name it does not recognise keeps the logo of the
 * provider the model is registered under. No rules of this page's own.
 */
export const modelLogoProvider = (
  model: Pick<GatewayCatalogModel, 'model_name' | 'provider'>,
): string =>
  resolveProviderLogo(model.model_name) ? model.model_name : model.provider

const CAPABILITY_ICONS: Record<string, LucideIcon> = {
  chat: MessageSquare,
  embedding: Boxes,
  rerank: ArrowDownUp,
  image2text: Eye,
  speech2text: Mic,
  tts: AudioLines,
  ocr: ScanText,
}

/** A capability as an icon and its name; unknown ones show their raw name. */
export function CapabilityChip({ type }: { type: string }) {
  const { t } = useTranslation()
  const Icon = CAPABILITY_ICONS[type]
  return (
    <span className="inline-flex items-center gap-space-2xs rounded-radius-sm bg-fill-muted px-space-xs py-space-2xs text-xs whitespace-nowrap text-fg-muted">
      {Icon ? <Icon className="size-3 shrink-0" aria-hidden="true" /> : null}
      {capabilityLabel(t, type)}
    </span>
  )
}
