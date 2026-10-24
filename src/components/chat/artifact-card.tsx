import { FileCode2, FileText, Image, ChevronRight } from 'lucide-react'
import type { ArtifactRef } from '@/lib/ai-workspace/contracts'
import { useTypedTranslation } from '@/locales/use-typed-translation'
import { artifactPreviewKind } from '@/components/chat/artifact-kind'
import {
  getArtifactName,
  resolveArtifactUrl,
} from '@/components/chat/artifact-resource'
import { useChatWorkspace } from '@/components/chat/chat-workspace-context'

export function ArtifactCard({
  url,
  messageId,
}: {
  url: string
  messageId: string
}) {
  const workspace = useChatWorkspace()
  const { t } = useTypedTranslation('chat.aiWorkspace')
  const canonicalUrl = resolveArtifactUrl(url)
  const name = getArtifactName(canonicalUrl)
  const kind = artifactPreviewKind(name)
  const Icon = kind === 'image' ? Image : kind === 'html' ? FileCode2 : FileText
  const artifact: ArtifactRef = {
    id: `${messageId}:${canonicalUrl}`,
    messageId,
    name,
    url: canonicalUrl,
    state: 'unknown',
    capabilities: { preview: kind !== 'unsupported', download: true },
  }
  const state =
    workspace?.selectedArtifact?.id === artifact.id
      ? workspace.selectedArtifact.state
      : artifact.state
  const stateLabel =
    state === 'forbidden'
      ? t('artifactForbidden')
      : state === 'unavailable'
        ? t('artifactUnavailable')
        : t(state)
  return (
    <button
      type="button"
      className="my-space-sm inline-flex max-w-full items-center gap-space-md rounded-radius-lg border border-border-subtle bg-background-surface p-space-md text-left text-sm text-text-primary hover:bg-state-hover focus-visible:outline focus-visible:outline-state-focus"
      data-artifact-card={artifact.id}
      data-artifact-message-id={messageId}
      onClick={() => workspace?.viewArtifact(artifact)}
    >
      <Icon
        className="size-icon-lg shrink-0 text-text-secondary"
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{name}</span>
        <span className="block text-xs text-text-secondary">
          {t('readOnly')} · {stateLabel}
        </span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-space-xs text-xs text-text-secondary">
        {t(kind === 'unsupported' ? 'download' : 'preview')}
        <ChevronRight className="size-icon-sm" aria-hidden="true" />
      </span>
    </button>
  )
}
