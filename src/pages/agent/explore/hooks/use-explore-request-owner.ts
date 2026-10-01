import { useCallback, useLayoutEffect, useRef } from 'react'
import type { ExploreRequestOwner, ExploreSelection } from '../types'

/** Each page selection has a distinct identity, including A -> B -> A. */
export function useExploreRequestOwner(
  selection: ExploreSelection,
  onSelectionChange: (selection: ExploreSelection, promoted: boolean) => void,
) {
  const selected = useRef(selection)
  const mounted = useRef(true)
  const active = useRef<ExploreRequestOwner | null>(null)
  const latest = useRef<ExploreRequestOwner | null>(null)
  const created = useRef<{
    selection: ExploreSelection
    sessionId: string
  } | null>(null)

  const isPromotion = useCallback((next: ExploreSelection) => {
    const pending = created.current
    return Boolean(
      pending &&
      pending.selection === selected.current &&
      next.canvasId === pending.selection.canvasId &&
      next.revision === pending.selection.revision &&
      !next.isNew &&
      next.sessionId === pending.sessionId,
    )
  }, [])

  useLayoutEffect(() => {
    if (selected.current === selection) return
    const promoted = isPromotion(selection)
    if (promoted) {
      if (latest.current) latest.current.selection = selection
    } else {
      active.current?.controller.abort()
      active.current = null
      latest.current = null
    }
    selected.current = selection
    created.current = null
    onSelectionChange(selection, promoted)
  }, [isPromotion, onSelectionChange, selection])

  useLayoutEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      active.current?.controller.abort()
      active.current = null
      latest.current = null
      created.current = null
    }
  }, [])

  const owns = useCallback((request: ExploreRequestOwner) => {
    return (
      mounted.current &&
      latest.current === request &&
      selected.current === request.selection
    )
  }, [])

  const begin = useCallback(() => {
    if (!mounted.current || selected.current !== selection || active.current) {
      return null
    }
    // A just-created ID is reusable only until this selection's URL catches up.
    const pending = created.current
    const request: ExploreRequestOwner = {
      selection,
      sessionId: selection.isNew
        ? pending?.selection === selection
          ? pending.sessionId
          : ''
        : selection.sessionId,
      controller: new AbortController(),
    }
    active.current = request
    latest.current = request
    return request
  }, [selection])

  const rememberCreated = useCallback(
    (request: ExploreRequestOwner, sessionId: string) => {
      if (!owns(request) || request.controller.signal.aborted) return false
      request.sessionId = sessionId
      created.current = { selection: request.selection, sessionId }
      return true
    },
    [owns],
  )

  const finish = useCallback((request: ExploreRequestOwner) => {
    if (active.current === request) active.current = null
  }, [])

  return { active, begin, owns, rememberCreated, finish, isPromotion }
}
