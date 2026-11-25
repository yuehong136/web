import { useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Catalogs at or below this size open with every connection expanded. */
export const EXPAND_ALL_MAX_MODELS = 12

type Chosen = Record<string, boolean>

interface CatalogExpansionState {
  /** Connections the user opened or closed; a missing id means "not chosen". */
  chosen: Chosen
  choose: (ids: string[], open: boolean) => void
}

/** Keeps only boolean entries from storage. */
export function normalizeChosen(value: unknown): Chosen {
  if (!value || typeof value !== 'object') return {}
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, boolean] => typeof entry[1] === 'boolean',
    ),
  )
}

/** Which connection cards of the gateway catalog the user left open. */
export const useCatalogExpansionStore = create<CatalogExpansionState>()(
  persist(
    (set) => ({
      chosen: {},
      choose: (ids, open) =>
        set((state) => ({
          chosen: {
            ...state.chosen,
            ...Object.fromEntries(ids.map((id) => [id, open])),
          },
        })),
    }),
    {
      name: 'model-gateway-catalog-expansion',
      version: 1,
      partialize: ({ chosen }) => ({ chosen }),
      merge: (persisted, current) => ({
        ...current,
        chosen: normalizeChosen(
          (persisted as { chosen?: unknown } | undefined)?.chosen,
        ),
      }),
    },
  ),
)

export interface GroupExpansion {
  isOpen: (id: string) => boolean
  setOpen: (id: string, open: boolean) => void
  setAll: (ids: string[], open: boolean) => void
}

interface GroupExpansionOptions {
  /** The user's picks outside a search. */
  chosen: Chosen
  onChoose: (ids: string[], open: boolean) => void
  /** Whether a group nobody has toggled starts open. */
  defaultOpen: (id: string) => boolean
  /**
   * The active search, or `''`. A search opens every group that still has
   * matches; toggles made during it are forgotten when it changes, so the
   * picks made outside a search come back untouched.
   */
  searchKey: string
}

/**
 * Open state of a list of collapsible groups: the user's pick wins, otherwise
 * the default; a search shows its matches without rewriting either.
 */
export function useGroupExpansion({
  chosen,
  onChoose,
  defaultOpen,
  searchKey,
}: GroupExpansionOptions): GroupExpansion {
  const [search, setSearch] = useState<{ key: string; closed: string[] }>({
    key: '',
    closed: [],
  })
  const closed = search.key === searchKey ? search.closed : []
  if (searchKey)
    return {
      isOpen: (id) => !closed.includes(id),
      setOpen: (id, open) =>
        setSearch({
          key: searchKey,
          closed: open
            ? closed.filter((item) => item !== id)
            : [...closed.filter((item) => item !== id), id],
        }),
      setAll: (ids, open) =>
        setSearch({ key: searchKey, closed: open ? [] : ids }),
    }
  return {
    isOpen: (id) => chosen[id] ?? defaultOpen(id),
    setOpen: (id, open) => onChoose([id], open),
    setAll: onChoose,
  }
}
