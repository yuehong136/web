import { v4 as uuid } from 'uuid'
import { useLayoutEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { memoryAPI } from '@/api/memory'
import { copyToClipboard } from '@/lib/utils'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'
import {
  compactionNeedsPolling,
  compactionConsumptionReference,
  validateCompactionResult,
} from '@/lib/memory-compaction'
import type {
  MemoryCompactionCommand,
  MemoryCompactionResult,
} from '@/types/memory-compaction'
import { memoryCompactionKeys } from './memory-compaction-keys'
import { protectMemoryCompaction } from './memory-compaction-fence'

export function useMemoryCompaction(memoryId: string, operationId: string) {
  const cache = useQueryClient(),
    [readScope] = useState(() => uuid())
  const mounted = useRef(false),
    selected = useRef(operationId),
    bodyEpoch = useRef(0),
    selectionEpoch = useRef(0),
    copying = useRef(false)
  const retentionFence = useRef(
    new Map<
      string,
      {
        artifactId: string
        manifest: string
        receipt?: MemoryCompactionResult
      }
    >(),
  )
  const [failure, setFailure] = useState<{ operationId: string; key: string }>()
  const [pendingRetirements, setPendingRetirements] = useState<Set<string>>(
    () => new Set(),
  )
  const [referencePending, setReferencePending] = useState(false)
  const [referenceFeedback, setReferenceFeedback] = useState<{
    operationId: string
    key: string
  }>()
  const key = memoryCompactionKeys.operation(memoryId, operationId, readScope)
  useLayoutEffect(() => {
    if (selected.current !== operationId) selectionEpoch.current++
    selected.current = operationId
  }, [operationId])
  useLayoutEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const accept = (
    value: MemoryCompactionResult,
    expected: string,
    epoch = bodyEpoch.current,
  ): MemoryCompactionResult => {
    validateCompactionResult(value, memoryId, expected)
    const retirement = retentionFence.current.get(expected)
    if (retirement) {
      if (
        retirement.artifactId !== value.artifact.artifact_id ||
        retirement.manifest !== value.artifact.input_manifest_sha256
      )
        throw new Error('compaction_retirement_binding_changed')
      if (value.artifact.retired_at) {
        retirement.receipt = value
        return value
      }
      return (
        retirement.receipt ?? {
          ...value,
          artifact: {
            ...value.artifact,
            state: 'stale',
            valid_for_current: false,
            package: null,
          },
        }
      )
    }
    if (value.artifact.retired_at) return value
    const known = cache.getQueryData<MemoryCompactionResult>(
      memoryCompactionKeys.operation(memoryId, expected, readScope),
    )
    if (known?.artifact.retired_at) return known
    if (
      known?.operation.status === 'canceled' &&
      value.operation.status !== 'canceled'
    )
      return {
        ...value,
        operation: known.operation,
        artifact: {
          ...value.artifact,
          state: 'canceled',
          valid_for_current: false,
          package: null,
        },
      }
    if (epoch !== bodyEpoch.current && value.artifact)
      return {
        ...value,
        operation: known?.operation ?? value.operation,
        artifact: {
          ...value.artifact,
          state: 'stale' as const,
          valid_for_current: false,
          package: null,
        },
      }
    return protectMemoryCompaction(cache, memoryId, value)
  }
  const query = useQuery<MemoryCompactionResult, Error>({
    queryKey: key,
    enabled: !!operationId,
    gcTime: 0,
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: (q) =>
      compactionNeedsPolling(q.state.data) ? 5000 : false,
    queryFn: async ({ signal }) => {
      const epoch = bodyEpoch.current
      try {
        return accept(
          await memoryAPI.compaction.operation(memoryId, operationId, signal),
          operationId,
          epoch,
        )
      } catch (error) {
        if (!signal.aborted) {
          bodyEpoch.current++
          const previous = cache.getQueryData<MemoryCompactionResult>(key)
          if (previous?.artifact?.package)
            cache.setQueryData(key, {
              ...previous,
              artifact: {
                ...previous.artifact,
                state: 'stale',
                valid_for_current: false,
                package: null,
              },
            })
        }
        throw error
      }
    },
  })
  useLayoutEffect(
    () =>
      cache.getQueryCache().subscribe(() => {
        for (const entry of cache
          .getQueryCache()
          .findAll({ queryKey: memoryCompactionKeys.bank(memoryId) })) {
          const value = entry.state.data as MemoryCompactionResult | undefined
          if (!value?.artifact?.package) continue
          const safe = protectMemoryCompaction(cache, memoryId, value)
          if (safe !== value) cache.setQueryData(entry.queryKey, safe)
        }
      }),
    [cache, memoryId],
  )
  const command = useMutation<
    void,
    Error,
    | { kind: 'create'; body: MemoryCompactionCommand }
    | { kind: 'cancel'; operationId: string }
  >({
    gcTime: 0,
    retry: false,
    meta: { errorFeedback: MutationErrorFeedback.Local },
    mutationFn: async (ticket) => {
      const id =
        ticket.kind === 'create' ? ticket.body.operation_id : ticket.operationId
      try {
        if (ticket.kind === 'cancel') bodyEpoch.current++
        const epoch = bodyEpoch.current
        const result =
          ticket.kind === 'create'
            ? await memoryAPI.compaction.create(memoryId, ticket.body)
            : await memoryAPI.compaction.cancel(memoryId, id)
        if (!mounted.current || selected.current !== id) return
        await cache.cancelQueries(
          {
            queryKey: memoryCompactionKeys.operation(memoryId, id, readScope),
            exact: true,
          },
          { revert: false },
        )
        if (!mounted.current || selected.current !== id) return
        cache.setQueryData(
          memoryCompactionKeys.operation(memoryId, id, readScope),
          accept(result, id, epoch),
        )
        if (epoch === bodyEpoch.current) setFailure(undefined)
      } catch {
        if (mounted.current && selected.current === id)
          setFailure({
            operationId: id,
            key:
              ticket.kind === 'create'
                ? 'memory.compaction.unknown'
                : 'memory.compaction.cancelUnknown',
          })
      }
    },
  })
  const clearBody = () => {
    bodyEpoch.current++
    const current = query.data
    if (current?.artifact?.package)
      cache.setQueryData(key, {
        ...current,
        artifact: {
          ...current.artifact,
          valid_for_current: false,
          state: 'stale',
          package: null,
        },
      })
  }
  const fenceRetirement = (value: MemoryCompactionResult) => {
    const id = value.operation.operation_id
    if (id !== selected.current || !mounted.current) return
    retentionFence.current.set(id, {
      artifactId: value.artifact.artifact_id,
      manifest: value.artifact.input_manifest_sha256,
      ...(value.artifact.retired_at ? { receipt: value } : {}),
    })
    setPendingRetirements((previous) => {
      const next = new Set(previous)
      if (value.artifact.retired_at) next.delete(id)
      else next.add(id)
      return next
    })
    clearBody()
    setReferenceFeedback(undefined)
    if (value.artifact.retired_at) {
      cache.setQueryData(key, value)
      void cache.invalidateQueries({
        queryKey: memoryCompactionKeys.bank(memoryId),
      })
    }
  }
  const copyReference = async () => {
    if (!operationId || copying.current) return
    const id = operationId
    copying.current = true
    setReferencePending(true)
    setReferenceFeedback(undefined)
    clearBody()
    const epoch = bodyEpoch.current
    const selection = selectionEpoch.current
    const owner = () =>
      mounted.current &&
      selected.current === id &&
      selectionEpoch.current === selection
    try {
      const result = await query.refetch()
      if (!owner()) return
      if (epoch !== bodyEpoch.current || result.isError || !result.data)
        throw new Error('compaction_reference_unavailable')
      const current = protectMemoryCompaction(cache, memoryId, result.data)
      const reference = compactionConsumptionReference(current, memoryId, id)
      if (!owner() || epoch !== bodyEpoch.current) return
      await copyToClipboard(JSON.stringify(reference, null, 2))
      if (owner() && epoch === bodyEpoch.current)
        setReferenceFeedback({
          operationId: id,
          key: 'memory.compaction.referenceCopied',
        })
    } catch {
      if (owner())
        setReferenceFeedback({
          operationId: id,
          key: 'memory.compaction.referenceUnavailable',
        })
    } finally {
      copying.current = false
      if (mounted.current) setReferencePending(false)
    }
  }
  return {
    query,
    command,
    failure: failure?.operationId === operationId ? failure.key : undefined,
    clearBody,
    fenceRetirement,
    retirementPending:
      pendingRetirements.has(operationId) && !query.data?.artifact.retired_at,
    copyReference,
    referencePending,
    referenceFeedback:
      referenceFeedback?.operationId === operationId
        ? referenceFeedback.key
        : undefined,
  }
}
