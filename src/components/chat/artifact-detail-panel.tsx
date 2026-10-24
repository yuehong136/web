import { useEffect, useMemo, useRef, useState } from 'react'
import purify from 'dompurify'
import { Download, LoaderCircle } from 'lucide-react'
import { ContextPanel } from '@/components/patterns/context-panel'
import { Button } from '@/components/ui/button'
import type { ArtifactRef } from '@/lib/ai-workspace/contracts'
import { useTypedTranslation } from '@/locales/use-typed-translation'
import {
  downloadArtifactBlob,
  fetchArtifactBlob,
} from '@/components/chat/artifact-resource'
import {
  artifactFailure,
  useArtifactResource,
  type ArtifactFailure,
} from '@/components/chat/use-artifact-resource'
import { observeArtifactIdentity } from '@/components/chat/artifact-identity'

const HTML_OPTIONS = {
  WHOLE_DOCUMENT: true,
  FORBID_TAGS: [
    'script',
    'iframe',
    'object',
    'embed',
    'form',
    'base',
    'meta',
    'link',
  ],
  FORBID_ATTR: ['srcdoc', 'action', 'formaction'],
} as const
const HTML_POLICY =
  "default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"

export function ArtifactDetailPanel({
  artifact,
  scopeKey,
  onClose,
  onStateChange,
}: {
  artifact: ArtifactRef
  scopeKey: string
  onClose: () => void
  onStateChange?: (
    id: string,
    state: ArtifactRef['state'],
    mediaType?: string,
  ) => void
}) {
  const { t } = useTypedTranslation('chat.aiWorkspace')
  const resource = useArtifactResource(artifact, scopeKey)
  const observedState =
    resource.kind === 'loading'
      ? 'preparing'
      : resource.kind === 'ready' ||
          (resource.kind === 'unsupported' && resource.blob)
        ? 'ready'
        : resource.kind === 'error'
          ? resource.reason
          : 'unknown'
  const mediaType = 'blob' in resource ? resource.blob?.type : undefined
  useEffect(() => {
    onStateChange?.(artifact.id, observedState, mediaType)
  }, [artifact.id, onStateChange, observedState, mediaType])
  const owner = `${scopeKey}:${artifact.id}`
  const [downloadState, setDownloadState] = useState<{
    owner: string
    busy: boolean
    failure?: ArtifactFailure
  }>({ owner: '', busy: false })
  const pendingDownload = useRef<AbortController | null>(null)
  useEffect(
    () => () => {
      pendingDownload.current?.abort()
      pendingDownload.current = null
    },
    [owner],
  )
  const failureKey = (failure: ArtifactFailure) =>
    failure === 'forbidden'
      ? 'artifactForbidden'
      : failure === 'unavailable'
        ? 'artifactUnavailable'
        : 'artifactFailed'
  const html = useMemo(
    () =>
      resource.kind === 'ready' && resource.preview === 'html'
        ? `<meta http-equiv="Content-Security-Policy" content="${HTML_POLICY}">${purify.sanitize(resource.text ?? '', { ...HTML_OPTIONS, FORBID_TAGS: [...HTML_OPTIONS.FORBID_TAGS], FORBID_ATTR: [...HTML_OPTIONS.FORBID_ATTR] })}`
        : '',
    [resource],
  )
  const download = async () => {
    if (pendingDownload.current) return
    const controller = new AbortController()
    pendingDownload.current = controller
    const identity = observeArtifactIdentity(
      () => controller.abort(),
      controller.signal,
    )
    const isCurrent = () => !controller.signal.aborted && identity.isCurrent()
    setDownloadState({ owner, busy: true })
    try {
      const readyBlob =
        resource.kind === 'ready' || resource.kind === 'unsupported'
          ? resource.blob
          : undefined
      const blob =
        readyBlob ?? (await fetchArtifactBlob(artifact.url, controller.signal))
      if (isCurrent()) {
        downloadArtifactBlob(blob, artifact.name)
        onStateChange?.(artifact.id, 'ready', blob.type)
      }
    } catch (error) {
      if (isCurrent())
        setDownloadState({
          owner,
          busy: false,
          failure: artifactFailure(error),
        })
    } finally {
      if (isCurrent()) {
        pendingDownload.current = null
        setDownloadState((state) =>
          state.owner === owner ? { ...state, busy: false } : state,
        )
      }
      identity.release()
    }
  }
  const busy = downloadState.owner === owner && downloadState.busy
  return (
    <ContextPanel
      width="full"
      title={artifact.name}
      description={t('readOnly')}
      onClose={onClose}
      closeLabel={t('returnToAnswer')}
      data-artifact-panel={artifact.id}
      data-artifact-state={
        resource.kind === 'error' ? resource.reason : resource.kind
      }
      actions={
        artifact.capabilities.download && (
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => void download()}
          >
            {busy ? (
              <LoaderCircle
                className="size-icon-sm animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Download className="size-icon-sm" aria-hidden="true" />
            )}
            {t('download')}
          </Button>
        )
      }
    >
      {resource.kind === 'loading' && (
        <output className="block text-sm text-text-secondary">
          {t('artifactLoading')}
        </output>
      )}
      {resource.kind === 'unsupported' && (
        <p className="text-sm text-text-secondary">{t('previewUnavailable')}</p>
      )}
      {resource.kind === 'error' && (
        <p role="alert" className="text-sm text-status-error">
          {t(failureKey(resource.reason))}
        </p>
      )}
      {resource.kind === 'ready' &&
        (resource.preview === 'html' ? (
          <iframe
            title={artifact.name}
            srcDoc={html}
            sandbox=""
            referrerPolicy="no-referrer"
            className="h-full min-h-96 w-full rounded-radius-md border border-border-subtle bg-background-surface"
          />
        ) : resource.preview === 'image' ? (
          <img
            src={resource.objectUrl}
            alt={artifact.name}
            className="max-w-full rounded-radius-md"
          />
        ) : (
          <pre className="overflow-x-auto rounded-radius-md border border-border-subtle bg-background-subtle p-space-md text-xs leading-relaxed whitespace-pre-wrap text-text-primary">
            <code>{resource.text}</code>
          </pre>
        ))}
      {downloadState.owner === owner && downloadState.failure && (
        <output className="mt-space-sm block text-sm text-status-error">
          {t(failureKey(downloadState.failure))}
        </output>
      )}
    </ContextPanel>
  )
}
