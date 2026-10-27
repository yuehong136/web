import { useEffect, useState } from 'react'
import {
  createPreviewObjectUrl,
  readBlobAsText,
  revokePreviewObjectUrl,
} from '@/lib/knowledge/preview-resource'
import type { ArtifactRef } from '@/lib/ai-workspace/contracts'
import { observeArtifactIdentity } from '@/components/chat/artifact-identity'
import {
  artifactPreviewKind,
  type ArtifactPreviewKind,
} from '@/components/chat/artifact-kind'
import { fetchArtifactBlob } from '@/components/chat/artifact-resource'

export type ArtifactFailure = 'forbidden' | 'unavailable' | 'failed'
export type ArtifactResource =
  | { owner: string; kind: 'loading' | 'unsupported'; blob?: Blob }
  | { owner: string; kind: 'error'; reason: ArtifactFailure }
  | {
      owner: string
      kind: 'ready'
      preview: ArtifactPreviewKind
      blob: Blob
      text?: string
      objectUrl?: string
    }

export function artifactFailure(error: unknown): ArtifactFailure {
  const status =
    typeof error === 'object' && error !== null && 'status' in error
      ? error.status
      : undefined
  return status === 401 || status === 403
    ? 'forbidden'
    : status === 404 || status === 410
      ? 'unavailable'
      : 'failed'
}

const SAFE_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/bmp',
])
const MAX_TEXT_PREVIEW_BYTES = 2 * 1024 * 1024

/** A preview URL belongs to this mounted identity/thread/resource observation. */
export function useArtifactResource(
  artifact: ArtifactRef,
  scopeKey: string,
): ArtifactResource {
  const owner = `${scopeKey}:${artifact.id}`
  const kind = artifact.capabilities.preview
    ? artifactPreviewKind(artifact.name)
    : 'unsupported'
  const [resource, setResource] = useState<ArtifactResource>({
    owner: '',
    kind: 'loading',
  })
  useEffect(() => {
    if (kind === 'unsupported') return
    const controller = new AbortController()
    let active = true
    let objectUrl: string | undefined
    const identity = observeArtifactIdentity(() => {
      controller.abort()
      revokePreviewObjectUrl(objectUrl)
      objectUrl = undefined
    }, controller.signal)
    const isCurrent = () =>
      active && !controller.signal.aborted && identity.isCurrent()
    void (async () => {
      try {
        const blob = await fetchArtifactBlob(artifact.url, controller.signal)
        if (!isCurrent()) return
        const safeImage =
          kind !== 'image' ||
          SAFE_IMAGE_TYPES.has(blob.type.split(';')[0].toLowerCase())
        if (
          !safeImage ||
          (kind !== 'image' && blob.size > MAX_TEXT_PREVIEW_BYTES)
        ) {
          setResource({ owner, kind: 'unsupported', blob })
          return
        }
        const text = kind === 'image' ? undefined : await readBlobAsText(blob)
        if (!isCurrent()) return
        if (kind === 'image') objectUrl = createPreviewObjectUrl(blob)
        setResource({
          owner,
          kind: 'ready',
          preview: kind,
          blob,
          text,
          objectUrl,
        })
      } catch (error) {
        if (isCurrent())
          setResource({ owner, kind: 'error', reason: artifactFailure(error) })
      }
    })()
    return () => {
      active = false
      identity.release()
      controller.abort()
      revokePreviewObjectUrl(objectUrl)
    }
  }, [artifact.url, kind, owner])
  if (kind === 'unsupported') return { owner, kind: 'unsupported' }
  return resource.owner === owner ? resource : { owner, kind: 'loading' }
}
