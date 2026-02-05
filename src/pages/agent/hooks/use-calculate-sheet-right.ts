import { useEffect, useState } from 'react'

export function useCalculateSheetRight() {
  const [bodyWidth, setBodyWidth] = useState(0)

  useEffect(() => {
    const updateWidth = () => {
      setBodyWidth(document.body.clientWidth)
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)

    return () => {
      window.removeEventListener('resize', updateWidth)
    }
  }, [])

  return bodyWidth > 1800 ? 'right-[620px]' : `right-1/3`
}
