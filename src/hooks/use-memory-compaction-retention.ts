import { v4 as uuid } from 'uuid'
import { useLayoutEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { APIError } from '@/api/client'
import { memoryAPI } from '@/api/memory'
import type { MemoryCompactionResult } from '@/types/memory-compaction'
import type { MemoryCompactionRetentionPreview } from '@/types/memory-compaction-retention'
import { validateCompactionResult } from '@/lib/memory-compaction'
import {
  retentionCanConfirm,
  validateCompactionInventory,
  validateRetentionPreview,
  validateRetirementResult,
} from '@/lib/memory-compaction-retention'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'
import { memoryCompactionKeys } from './memory-compaction-keys'

export function useMemoryCompactionRetention(
  memoryId: string,
  enabled: boolean,
  current: MemoryCompactionResult | undefined,
  onFence: (value: MemoryCompactionResult) => void,
) {
  const [readScope] = useState(() => uuid())
  const mounted = useRef(false),
    selected = useRef(current?.artifact.artifact_id)
  const confirmation = useRef<string | undefined>(undefined),
    submitting = useRef(false)
  const [requested, setRequested] = useState(false),
    [previewHash, setPreviewHash] = useState<string>()
  const [feedback, setFeedback] = useState<
    'changed' | 'unknown' | 'retired' | 'readFailed'
  >()
  const artifactId = current?.artifact.artifact_id ?? '',
    operationId = current?.operation.operation_id ?? ''
  useLayoutEffect(() => {
    selected.current = artifactId
  }, [artifactId])
  useLayoutEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const inventory = useQuery({
    queryKey: memoryCompactionKeys.inventory(memoryId, readScope),
    enabled,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async ({ signal }) => {
      const value = await memoryAPI.compaction.inventory(memoryId, signal)
      validateCompactionInventory(value, memoryId)
      return value
    },
  })
  const preview = useQuery({
    queryKey: memoryCompactionKeys.retentionPreview(
      memoryId,
      artifactId,
      readScope,
    ),
    enabled: false,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async ({ signal }) => {
      if (!current || !enabled) throw new Error('retention_unavailable')
      const value = await memoryAPI.compaction.retentionPreview(
        memoryId,
        artifactId,
        signal,
      )
      validateRetentionPreview(value, current)
      return value
    },
  })
  const recovered = useQuery({
    queryKey: memoryCompactionKeys.operation(
      memoryId,
      operationId,
      'retention-' + readScope,
    ),
    enabled: false,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async ({ signal }) => {
      if (!current || !enabled) throw new Error('retention_unavailable')
      const value = await memoryAPI.compaction.operation(
        memoryId,
        operationId,
        signal,
      )
      validateCompactionResult(value, memoryId, operationId)
      if (
        value.artifact.artifact_id !== artifactId ||
        value.artifact.input_manifest_sha256 !==
          current.artifact.input_manifest_sha256
      )
        throw new Error('compaction_retirement_binding_changed')
      return { ...value, artifact: { ...value.artifact, package: null } }
    },
  })
  const loadPreview = async () => {
    if (!enabled || !current || submitting.current || preview.isFetching) return
    const id = artifactId
    confirmation.current = undefined
    setRequested(true)
    setPreviewHash(undefined)
    setFeedback(undefined)
    const result = await preview.refetch()
    if (!mounted.current || selected.current !== id) return
    if (!result.isError && result.data) {
      confirmation.current = result.data.preview_sha256
      setPreviewHash(result.data.preview_sha256)
    }
  }
  const retire = useMutation<void, Error, MemoryCompactionRetentionPreview>({
    gcTime: 0,
    retry: false,
    meta: { errorFeedback: MutationErrorFeedback.Local },
    mutationFn: async (ticket) => {
      if (
        !enabled ||
        !current ||
        !mounted.current ||
        selected.current !== ticket.artifact_id ||
        submitting.current ||
        !retentionCanConfirm(ticket, current) ||
        ticket.preview_sha256 !== confirmation.current
      )
        return
      validateRetentionPreview(ticket, current)
      submitting.current = true
      confirmation.current = undefined
      setPreviewHash(undefined)
      setFeedback(undefined)
      onFence(current)
      try {
        const value = await memoryAPI.compaction.retire(
          memoryId,
          ticket.artifact_id,
          ticket.preview_sha256,
        )
        validateRetirementResult(value, ticket)
        if (!mounted.current || selected.current !== ticket.artifact_id) return
        onFence(value)
        setFeedback('retired')
      } catch (error) {
        if (!mounted.current || selected.current !== ticket.artifact_id) return
        setFeedback(
          error instanceof APIError && error.status === 409
            ? 'changed'
            : 'unknown',
        )
      } finally {
        submitting.current = false
      }
    },
  })
  const recover = async () => {
    const id = artifactId
    if (!enabled || !current || submitting.current) return
    const result = await recovered.refetch()
    if (!mounted.current || selected.current !== id) return
    if (result.isError || !result.data) setFeedback('readFailed')
    else if (result.data.artifact.retired_at) {
      onFence(result.data)
      setFeedback('retired')
      setPreviewHash(undefined)
    } else setFeedback('unknown')
  }
  return {
    inventory,
    preview,
    requested,
    feedback,
    loadPreview,
    retire,
    recover,
    recovering: recovered.isFetching,
    canConfirm:
      enabled &&
      !preview.isError &&
      !preview.isFetching &&
      !retire.isPending &&
      previewHash === preview.data?.preview_sha256 &&
      retentionCanConfirm(preview.data, current),
  }
}
