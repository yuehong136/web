import type { IHighlight } from 'react-pdf-highlighter'
import { v4 as uuid } from 'uuid'
import type { RawHighlight } from './types'

export const buildPdfHighlights = (
  rawHighlights: RawHighlight[] | undefined,
  pageSize: { width: number; height: number },
): IHighlight[] => {
  if (
    !rawHighlights ||
    !Array.isArray(rawHighlights) ||
    rawHighlights.length === 0
  ) {
    return []
  }

  return rawHighlights.map((highlight) => {
    const boundingRect = {
      width: pageSize.width,
      height: pageSize.height,
      x1: highlight.x1,
      x2: highlight.x2,
      y1: highlight.y1,
      y2: highlight.y2,
    }
    return {
      id: uuid(),
      comment: {
        text: '',
        emoji: '',
      },
      content: {
        text: '',
      },
      position: {
        boundingRect,
        rects: [boundingRect],
        pageNumber: highlight.page,
      },
    }
  })
}

export const formatMediaTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
