import { useCallback, useState } from 'react'

/**
 * Hook for managing modal state
 */
export const useSetModalState = (initialState = false) => {
  const [visible, setVisible] = useState(initialState)

  const showModal = useCallback(() => {
    setVisible(true)
  }, [])

  const hideModal = useCallback(() => {
    setVisible(false)
  }, [])

  const toggleModal = useCallback(() => {
    setVisible((prev) => !prev)
  }, [])

  return {
    visible,
    showModal,
    hideModal,
    toggleModal,
    setVisible,
  }
}

/**
 * Hook for managing loading state
 */
export const useSetLoadingState = (initialState = false) => {
  const [loading, setLoading] = useState(initialState)

  const startLoading = useCallback(() => {
    setLoading(true)
  }, [])

  const stopLoading = useCallback(() => {
    setLoading(false)
  }, [])

  return {
    loading,
    startLoading,
    stopLoading,
    setLoading,
  }
}

/**
 * Hook for managing selected state
 */
export const useSetSelectedState = <T>(initialState: T | null = null) => {
  const [selected, setSelected] = useState<T | null>(initialState)

  const selectItem = useCallback((item: T) => {
    setSelected(item)
  }, [])

  const clearSelection = useCallback(() => {
    setSelected(null)
  }, [])

  return {
    selected,
    selectItem,
    clearSelection,
    setSelected,
  }
}
