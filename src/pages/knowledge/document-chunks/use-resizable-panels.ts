import { useEffect, useRef } from 'react'

interface ResizeState {
  target: 'preview' | 'info'
  startX: number
  startWidth: number
}

interface UseResizablePanelsOptions {
  setPreviewPanelWidth: (updater: (width: number) => number) => void
  setInfoPanelWidth: (updater: (width: number) => number) => void
}

export const useResizablePanels = ({
  setPreviewPanelWidth,
  setInfoPanelWidth,
}: UseResizablePanelsOptions) => {
  const resizeRef = useRef<ResizeState | null>(null)

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (!resizeRef.current) return

      const { target, startX, startWidth } = resizeRef.current
      if (target === 'preview') {
        const next = startWidth + (event.clientX - startX)
        setPreviewPanelWidth(() => Math.min(720, Math.max(320, next)))
      } else {
        const next = startWidth + (startX - event.clientX)
        setInfoPanelWidth(() => Math.min(420, Math.max(240, next)))
      }
    }

    const onMouseUp = () => {
      if (!resizeRef.current) return
      resizeRef.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [setInfoPanelWidth, setPreviewPanelWidth])

  return (
    target: ResizeState['target'],
    startX: number,
    startWidth: number,
  ) => {
    resizeRef.current = { target, startX, startWidth }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }
}
