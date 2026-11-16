import { useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CollectionView } from '@/components/patterns/view-switch'

/**
 * Collection layout preference shared by the Studio, Agents, Search, Memory
 * and Team lists. Until the user picks a view, small collections open as a
 * card grid and larger ones as rows; an explicit pick is remembered per
 * collection and always wins.
 */

/** Collections at or below this size default to the card grid. */
export const GRID_DEFAULT_MAX_ITEMS = 12

export const COLLECTION_VIEW_KEYS = [
  'studio',
  'agents',
  'search',
  'memory',
  'team-members',
  'team-joined',
] as const
export type CollectionViewKey = (typeof COLLECTION_VIEW_KEYS)[number]

type ChosenViews = Partial<Record<CollectionViewKey, CollectionView>>

interface CollectionViewState {
  /** Views the user picked; a missing key means "not chosen yet". */
  chosen: ChosenViews
  choose: (key: CollectionViewKey, view: CollectionView) => void
  reset: () => void
}

const isView = (value: unknown): value is CollectionView =>
  value === 'grid' || value === 'list'

/** Keeps only known keys with valid views from storage. */
export function normalizeChosenViews(value: unknown): ChosenViews {
  if (!value || typeof value !== 'object') return {}
  const record = value as Record<string, unknown>
  const chosen: ChosenViews = {}
  for (const key of COLLECTION_VIEW_KEYS) {
    if (isView(record[key])) chosen[key] = record[key]
  }
  return chosen
}

export const useCollectionViewStore = create<CollectionViewState>()(
  persist(
    (set) => ({
      chosen: {},
      choose: (key, view) =>
        set((state) => ({ chosen: { ...state.chosen, [key]: view } })),
      reset: () => set({ chosen: {} }),
    }),
    {
      name: 'collection-view',
      version: 1,
      partialize: ({ chosen }) => ({ chosen }),
      merge: (persisted, current) => ({
        ...current,
        chosen: normalizeChosenViews(
          (persisted as { chosen?: unknown } | undefined)?.chosen,
        ),
      }),
    },
  ),
)

/** The view to show: the user's pick, else grid for small collections. */
export function resolveCollectionView(
  chosen: CollectionView | undefined,
  size: number | undefined,
): CollectionView {
  if (chosen) return chosen
  return size !== undefined && size <= GRID_DEFAULT_MAX_ITEMS ? 'grid' : 'list'
}

/**
 * The collection's view and a setter that records an explicit choice.
 * `size` is the collection's total; while `filtered` is true the size seen
 * before filtering is kept, so typing a search never flips the layout.
 */
export function useCollectionView(
  key: CollectionViewKey,
  size: number | undefined,
  filtered = false,
): [CollectionView, (view: CollectionView) => void] {
  const chosen = useCollectionViewStore((state) => state.chosen[key])
  const choose = useCollectionViewStore((state) => state.choose)
  const [baseline, setBaseline] = useState(size)
  if (!filtered && size !== undefined && size !== baseline) setBaseline(size)
  return [
    resolveCollectionView(chosen, baseline ?? size),
    (view) => choose(key, view),
  ]
}
