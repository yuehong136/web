import { useCallback, useState } from 'react'
import type { ChunkPanelTab } from '../types'

/**
 * The chunk page's side panel (source, document info, parser config). Until
 * the reader opens or closes it, it is open where it can dock beside the
 * chunks and closed where it would cover them as a sheet.
 */
export const useChunkPanelLayout = () => {
  const [openChoice, setOpenChoice] = useState<boolean | null>(null)
  const [canSplit, setCanSplit] = useState(false)
  const [tab, setTab] = useState<ChunkPanelTab>('source')
  const isPanelOpen = openChoice ?? canSplit

  /** Opens the panel on `next`, or closes it when that tab is showing. */
  const togglePanel = useCallback(
    (next: ChunkPanelTab) => {
      if (isPanelOpen && tab === next) {
        setOpenChoice(false)
        return
      }
      setTab(next)
      setOpenChoice(true)
    },
    [isPanelOpen, tab],
  )
  const closePanel = useCallback(() => setOpenChoice(false), [])

  return {
    isPanelOpen,
    tab,
    setTab,
    togglePanel,
    closePanel,
    onSplitChange: setCanSplit,
  }
}

export type ChunkPanelLayout = ReturnType<typeof useChunkPanelLayout>
