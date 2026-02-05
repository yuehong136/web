import { useState, useCallback } from 'react'

/**
 * Hook to manage dialog visibility state
 */
export const useShowDialog = () => {
  const [visible, setVisible] = useState(false)

  const showDialog = useCallback(() => {
    setVisible(true)
  }, [])

  const hideDialog = useCallback(() => {
    setVisible(false)
  }, [])

  const toggleDialog = useCallback(() => {
    setVisible((prev) => !prev)
  }, [])

  return {
    visible,
    showDialog,
    hideDialog,
    toggleDialog,
    setVisible,
  }
}
