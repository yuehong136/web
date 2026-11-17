import { useEffect, useRef, useState } from 'react'

/**
 * Whole-page file drag state: files dragged in show the overlay and open the
 * attachment panel; files dropped anywhere on the page go to `onFilesDrop`.
 */
export function useExploreDrop(
  onFilesEnter: () => void,
  onFilesDrop: (files: FileList) => void,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const counter = useRef(0)
  const [isDragging, setIsDragging] = useState(false)
  const enter = useRef(onFilesEnter)
  const drop = useRef(onFilesDrop)
  useEffect(() => {
    enter.current = onFilesEnter
    drop.current = onFilesDrop
  }, [onFilesEnter, onFilesDrop])

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
      const files = event.dataTransfer?.files
      if (files?.length) drop.current(files)
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
