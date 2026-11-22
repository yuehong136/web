import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import { memoryRevisionKeys } from './memory-revision-keys'
import { useMemoryTargetRecommendations } from './use-memory-targets'
import {
  memoryTargetErrorKey,
  selectedMemoryTargets,
  targetSourceIds,
} from '@/lib/memory-targets'
import type { MemoryEntry, MemorySourceState } from '@/types/memory-revisions'
import type {
  MemoryTargetConfirmation,
  MemoryTargetRecommendationRequest,
  MemoryTargetRecommendations,
} from '@/types/memory-targets'

export interface MemoryTargetSelectionState {
  active: boolean
  blocked: boolean
  entryIds: string[]
  confirmation?: MemoryTargetConfirmation
  closureIds: string[]
}
export const emptyMemoryTargetSelection = (): MemoryTargetSelectionState => ({
  active: false,
  blocked: false,
  entryIds: [],
  closureIds: [],
})
const canonicalCounter = (value: unknown) =>
  typeof value === 'string'
    ? value
    : typeof value === 'number' && Number.isSafeInteger(value)
      ? String(value)
      : null

/** A reviewed recommendation is an immutable UI snapshot, never a permission token. */
export function useMemoryTargetSelection(
  memoryId: string,
  inputKey: string,
  onChanged: () => void,
  initialConfirmation?: MemoryTargetConfirmation,
) {
  const cache = useQueryClient()
  const actorToken = useAuthStore((state) => state.token)
  const changedRef = useRef(onChanged)
  const mutation = useMemoryTargetRecommendations(memoryId)
  const [snapshot, setSnapshot] = useState<MemoryTargetRecommendations>()
  const [selectedIds, setSelectedIds] = useState<string[]>(
    () => initialConfirmation?.targets.map((target) => target.entry_id) ?? [],
  )
  const [confirmation, setConfirmation] = useState<
    MemoryTargetConfirmation | undefined
  >(() =>
    initialConfirmation ? structuredClone(initialConfirmation) : undefined,
  )
  const [active, setActive] = useState(!!initialConfirmation)
  const [stale, setStale] = useState(false)
  const [errorKey, setErrorKey] = useState('')
  const generation = useRef(0),
    mounted = useRef(false)
  const snapshotRef = useRef(snapshot),
    staleRef = useRef(stale)
  const conditionsRef = useRef(snapshot?.confirmation ?? confirmation)
  const [previous, setPrevious] = useState({ memoryId, actorToken, inputKey })
  // Reset local render state before paint; identity changes must never show old bodies.
  if (
    previous.memoryId !== memoryId ||
    previous.actorToken !== actorToken ||
    previous.inputKey !== inputKey
  ) {
    setPrevious({ memoryId, actorToken, inputKey })
    setSelectedIds([])
    setConfirmation(undefined)
    if (previous.memoryId !== memoryId || previous.actorToken !== actorToken) {
      setSnapshot(undefined)
      setActive(false)
      setStale(false)
      setErrorKey('')
    } else if (active) setStale(true)
  }
  useLayoutEffect(() => {
    changedRef.current = onChanged
    snapshotRef.current = snapshot
    staleRef.current = stale
    conditionsRef.current = snapshot?.confirmation ?? confirmation
  }, [onChanged, snapshot, stale, confirmation])
  useLayoutEffect(() => {
    mounted.current = true
    generation.current++
    return () => {
      mounted.current = false
    }
  }, [])
  const committedOwner = useRef({ memoryId, actorToken, inputKey })
  useLayoutEffect(() => {
    const previousOwner = committedOwner.current
    if (
      previousOwner.memoryId === memoryId &&
      previousOwner.actorToken === actorToken &&
      previousOwner.inputKey === inputKey
    )
      return
    committedOwner.current = { memoryId, actorToken, inputKey }
    generation.current++
    changedRef.current()
  }, [memoryId, actorToken, inputKey])

  useLayoutEffect(() => {
    const conditions = snapshot?.confirmation ?? confirmation
    if (!conditions) return
    const inspect = () => {
      if (
        snapshot
          ? snapshotRef.current !== snapshot
          : conditionsRef.current !== conditions
      )
        return
      let changed = false,
        withdrawn = false
      const dependencies = [
        ...conditions.inputs,
        ...conditions.targets.flatMap((target) => target.source_versions),
      ]
      for (const reference of dependencies) {
        const source = cache.getQueryData<MemorySourceState>(
          memoryRevisionKeys.source(memoryId, reference.source_id),
        )
        if (!source || source.memory_id !== memoryId) continue
        if (['forgotten', 'deleted', 'withdrawn'].includes(source.state)) {
          changed = true
          withdrawn = true
        } else if (
          source.state !== 'active' ||
          canonicalCounter(source.source_revision) !==
            reference.source_revision ||
          canonicalCounter(source.generation) !== reference.source_generation ||
          source.content_sha256 !== reference.content_sha256
        )
          changed = true
      }
      for (const [, entry] of cache.getQueriesData<MemoryEntry>({
        queryKey: memoryRevisionKeys.entries(memoryId),
      })) {
        const reference = conditions.targets.find(
          (target) => target.entry_id === entry?.entry_id,
        )
        if (!entry || !reference) continue
        if (
          entry.state !== 'active' ||
          canonicalCounter(entry.current_revision) !== reference.revision ||
          entry.current_message_id !== reference.message_id ||
          entry.current.content_sha256 !== reference.content_sha256
        )
          changed = true
        if (entry.current.redacted || entry.current.content === null)
          withdrawn = true
      }
      if (
        changed &&
        (!staleRef.current || (withdrawn && snapshotRef.current))
      ) {
        generation.current++
        staleRef.current = true
        setStale(true)
        setSelectedIds([])
        setConfirmation(undefined)
        changedRef.current()
        if (withdrawn) {
          snapshotRef.current = undefined
          setSnapshot(undefined)
        }
      }
    }
    inspect()
    return cache.getQueryCache().subscribe(inspect)
  }, [cache, memoryId, snapshot, confirmation])

  const request = async (value: MemoryTargetRecommendationRequest) => {
    const expected = ++generation.current
    snapshotRef.current = undefined
    conditionsRef.current = undefined
    staleRef.current = false
    setActive(true)
    setSnapshot(undefined)
    setSelectedIds([])
    setConfirmation(undefined)
    setStale(false)
    setErrorKey('')
    changedRef.current()
    try {
      const result = await mutation.mutateAsync(value)
      if (mounted.current && expected === generation.current) {
        const saved = structuredClone(result)
        snapshotRef.current = saved
        conditionsRef.current = saved.confirmation
        setSnapshot(saved)
      }
    } catch (error) {
      if (mounted.current && expected === generation.current)
        setErrorKey(memoryTargetErrorKey(error))
    }
  }
  const toggle = (entryId: string, selected: boolean) => {
    if (
      stale ||
      mutation.isPending ||
      !snapshot?.targets.some((target) => target.entry_id === entryId)
    )
      return
    setSelectedIds((ids) =>
      selected
        ? [...new Set([...ids, entryId])]
        : ids.filter((id) => id !== entryId),
    )
    setConfirmation(undefined)
    changedRef.current()
  }
  const apply = () => {
    if (!snapshot || stale || !selectedIds.length) return
    const value = selectedMemoryTargets(snapshot, selectedIds)
    if (targetSourceIds(value).length > 32) {
      setErrorKey('memory.targets.invalid')
      return
    }
    setConfirmation(value)
    changedRef.current()
  }
  const clear = () => {
    generation.current++
    snapshotRef.current = undefined
    conditionsRef.current = undefined
    staleRef.current = false
    setActive(false)
    setSnapshot(undefined)
    setSelectedIds([])
    setConfirmation(undefined)
    setStale(false)
    setErrorKey('')
    mutation.reset()
    changedRef.current()
  }
  const invalidate = () => {
    generation.current++
    staleRef.current = true
    setStale(true)
    setConfirmation(undefined)
    setSelectedIds([])
  }
  const selection = useMemo(
    () =>
      ({
        active,
        blocked:
          active &&
          (stale ||
            mutation.isPending ||
            !!errorKey ||
            (selectedIds.length > 0 && !confirmation)),
        entryIds: confirmation?.targets.map((target) => target.entry_id) ?? [],
        confirmation,
        closureIds: confirmation ? targetSourceIds(confirmation) : [],
      }) satisfies MemoryTargetSelectionState,
    [active, stale, mutation.isPending, errorKey, selectedIds, confirmation],
  )
  return {
    snapshot,
    selectedIds,
    stale,
    errorKey,
    pending: mutation.isPending,
    request,
    toggle,
    apply,
    clear,
    invalidate,
    selection,
  }
}
