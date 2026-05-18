import React from 'react'

export interface UseConfigPanelUiResult {
  open: boolean
  advancedOpen: boolean
  openPanel: () => void
  closePanel: () => void
  toggleAdvanced: () => void
}

export const useConfigPanelUi = (): UseConfigPanelUiResult => {
  const [open, setOpen] = React.useState(false)
  const [advancedOpen, setAdvancedOpen] = React.useState(false)

  const openPanel = React.useCallback(() => setOpen(true), [])
  const closePanel = React.useCallback(() => setOpen(false), [])
  const toggleAdvanced = React.useCallback(
    () => setAdvancedOpen((value) => !value),
    [],
  )

  return {
    open,
    advancedOpen,
    openPanel,
    closePanel,
    toggleAdvanced,
  }
}
