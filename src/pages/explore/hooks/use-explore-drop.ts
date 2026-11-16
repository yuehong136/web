import { useEffect, useRef, useState } from 'react'

/**
 * Whole-page file drag state. Dropped files are handled by the composer's
 * Attachments drop target; this only shows the overlay and opens the panel.
 */
export function useExploreDrop(onFilesEnter: () => void) {
  const containerRef = useRef<HTMLDivElement>(null)
  const counter = useRef(0)
  const [isDragging, setIsDragging] = useState(false)
  const enter = useRef(onFilesEnter)
  useEffect(() => {
    enter.current = onFilesEnter
  }, [onFilesEnter])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined
    const stop = (event: DragEvent) => {
      event.preventDefault()
      event.stopPropagation()
    }
    const onEnter = (event: DragEvent) => {
      stop(event)
      counter.current++
      if (event.dataTransfer?.types.includes('Files')) {
        setIsDragging(true)
        enter.current()
      }
    }
    const onLeave = (event: DragEvent) => {
      stop(event)
      counter.current--
      if (counter.current === 0) setIsDragging(false)
    }
    const onDrop = (event: DragEvent) => {
      stop(event)
      counter.current = 0
      setIsDragging(false)
    }
    container.addEventListener('dragenter', onEnter)
    container.addEventListener('dragleave', onLeave)
    container.addEventListener('dragover', stop)
    container.addEventListener('drop', onDrop)
    return () => {
      container.removeEventListener('dragenter', onEnter)
      container.removeEventListener('dragleave', onLeave)
      container.removeEventListener('dragover', stop)
      container.removeEventListener('drop', onDrop)
    }
  }, [])

  return { containerRef, isDragging }
}
