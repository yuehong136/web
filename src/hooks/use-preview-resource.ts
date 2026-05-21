import { useEffect, useMemo, useRef, useState } from 'react'
import {
  assertNonEmptyBlob,
  assertPreviewResponse,
  createPreviewObjectUrl,
  fetchPreviewResource,
  getDocumentUrl,
  getFileType,
  isAbortError,
  isZipLikeBlob,
  readBlobAsArrayBuffer,
  readBlobAsText,
  revokePreviewObjectUrl,
  type FileType,
  type PreviewResource,
  type PreviewResourceReady,
} from '@/lib/knowledge/preview-resource'

interface UsePreviewResourceParams {
  docId?: string | null
  docName?: string
  docType?: string
}

const INITIAL_RESOURCE: PreviewResource = {
  kind: 'idle',
  fileType: 'unknown',
}

const OBJECT_URL_FILE_TYPES: FileType[] = ['pdf', 'image', 'video']
const TEXT_FILE_TYPES: FileType[] = ['txt', 'md', 'csv']
const ARRAY_BUFFER_FILE_TYPES: FileType[] = ['docx', 'xlsx', 'pptx']

export const usePreviewResource = ({
  docId,
  docName,
  docType,
}: UsePreviewResourceParams): PreviewResource => {
  const objectUrlRef = useRef<string | null>(null)
  const [resource, setResource] = useState<PreviewResource>(INITIAL_RESOURCE)

  const fileType = useMemo(
    () => getFileType(docName, docType),
    [docName, docType],
  )
  const sourceUrl = useMemo(
    () => (docId ? getDocumentUrl(docId) : undefined),
    [docId],
  )

  useEffect(() => {
    if (!docId || !sourceUrl) {
      revokePreviewObjectUrl(objectUrlRef.current)
      objectUrlRef.current = null
      setResource(INITIAL_RESOURCE)
      return undefined
    }

    if (fileType === 'unknown') {
      revokePreviewObjectUrl(objectUrlRef.current)
      objectUrlRef.current = null
      setResource({
        kind: 'unsupported',
        fileType,
        sourceUrl,
      })
      return undefined
    }

    const controller = new AbortController()
    let mounted = true

    const loadResource = async () => {
      revokePreviewObjectUrl(objectUrlRef.current)
      objectUrlRef.current = null
      setResource({ kind: 'loading', fileType, sourceUrl })

      let nextObjectUrl: string | null = null

      try {
        const response = await fetchPreviewResource(
          sourceUrl,
          controller.signal,
        )
        await assertPreviewResponse(response)

        const blob = await response.blob()
        assertNonEmptyBlob(blob)

        if (fileType === 'docx' && !(await isZipLikeBlob(blob))) {
          if (mounted) {
            setResource({
              kind: 'unsupported',
              fileType,
              sourceUrl,
            })
          }
          return
        }

        const nextResource: PreviewResourceReady = {
          kind: 'ready',
          fileType,
          sourceUrl,
          blob,
        }

        if (OBJECT_URL_FILE_TYPES.includes(fileType)) {
          nextObjectUrl = createPreviewObjectUrl(blob)
          nextResource.objectUrl = nextObjectUrl
        }

        if (TEXT_FILE_TYPES.includes(fileType)) {
          nextResource.text = await readBlobAsText(blob)
        }

        if (ARRAY_BUFFER_FILE_TYPES.includes(fileType)) {
          nextResource.arrayBuffer = await readBlobAsArrayBuffer(blob)
        }

        if (!mounted) {
          revokePreviewObjectUrl(nextObjectUrl)
          return
        }

        objectUrlRef.current = nextObjectUrl
        setResource(nextResource)
      } catch (error) {
        revokePreviewObjectUrl(nextObjectUrl)
        if (isAbortError(error)) return

        if (mounted) {
          setResource({
            kind: 'error',
            fileType,
            sourceUrl,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to load preview resource',
          })
        }
      }
    }

    void loadResource()

    return () => {
      mounted = false
      controller.abort()
      revokePreviewObjectUrl(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }, [docId, fileType, sourceUrl])

  return resource
}
