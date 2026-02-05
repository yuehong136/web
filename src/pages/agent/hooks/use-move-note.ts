import { useCallback, useEffect, useRef, useState } from 'react'

export function useMoveNote() {
  const ref = useRef<SVGSVGElement>(null)
  const [mouse, setMouse] = useState({ clientX: 0, clientY: 0 })
  const [imgVisible, setImgVisible] = useState(false)

  const toggleVisible = useCallback((visible: boolean) => {
    setImgVisible(visible)
  }, [])

  const showImage = useCallback(() => {
    toggleVisible(true)
  }, [toggleVisible])

  const hideImage = useCallback(() => {
    toggleVisible(false)
  }, [toggleVisible])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouse({ clientX: e.clientX, clientY: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  useEffect(() => {
    if (ref.current) {
      ref.current.style.top = `${mouse.clientY - 70}px`
      ref.current.style.left = `${mouse.clientX + 10}px`
    }
  }, [mouse.clientX, mouse.clientY])

  return {
    ref,
    showImage,
    hideImage,
    mouse,
    imgVisible,
  }
}
