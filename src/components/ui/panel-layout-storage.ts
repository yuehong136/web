import type { Layout, LayoutStorage } from 'react-resizable-panels'

function isValidSizes(sizes: unknown[], count: number): sizes is number[] {
  return (
    sizes.length === count &&
    sizes.every(
      (size) =>
        typeof size === 'number' &&
        Number.isFinite(size) &&
        size >= 0 &&
        size <= 100,
    ) &&
    Math.abs((sizes as number[]).reduce((sum, size) => sum + size, 0) - 100) <
      0.1
  )
}

/** Read v2 layouts in DOM order; v2's storage key sorted IDs without sorting sizes. */
export function createPanelLayoutStorage(
  storage: LayoutStorage,
  layoutId: string,
  panelIds: string[],
): LayoutStorage {
  const legacyKey = `react-resizable-panels:${layoutId}`
  const currentKey = `${legacyKey}:${panelIds.join(':')}`
  return {
    getItem(key) {
      try {
        const current = storage.getItem(key)
        if (current) {
          const parsed: unknown = JSON.parse(current)
          if (parsed && typeof parsed === 'object') {
            const layout = parsed as Layout
            if (
              Object.keys(layout).length === panelIds.length &&
              isValidSizes(
                panelIds.map((id) => layout[id]),
                panelIds.length,
              )
            )
              return current
          }
        }
        if (key !== currentKey) return null
        const raw = storage.getItem(legacyKey)
        if (!raw) return null
        const parsed: unknown = JSON.parse(raw)
        if (!parsed || typeof parsed !== 'object') return null
        const entry: unknown = (parsed as Record<string, unknown>)[
          [...panelIds].sort().join(',')
        ]
        if (!entry || typeof entry !== 'object' || !('layout' in entry))
          return null
        const sizes: unknown = entry.layout
        if (!Array.isArray(sizes) || !isValidSizes(sizes, panelIds.length))
          return null
        return JSON.stringify(
          Object.fromEntries(panelIds.map((id, index) => [id, sizes[index]])),
        )
      } catch {
        return null
      }
    },
    setItem: (key, value) => storage.setItem(key, value),
  }
}
