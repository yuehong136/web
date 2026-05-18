import React from 'react'

import { toRetrievalResultView } from '../adapters/retrieval-result'
import type { RetrievalResult, RetrievalResultView } from '../types'

export interface UseResultPreviewResult {
  selectedResult: RetrievalResultView | null
  isMarkdownPreview: boolean
  openPreview: (result: RetrievalResult | RetrievalResultView) => void
  closePreview: () => void
  togglePreview: () => void
}

const isRetrievalResultView = (
  value: RetrievalResult | RetrievalResultView,
): value is RetrievalResultView =>
  typeof (value as RetrievalResultView).scores === 'object'

export const useResultPreview = (): UseResultPreviewResult => {
  const [selectedResult, setSelectedResult] =
    React.useState<RetrievalResultView | null>(null)
  const [isMarkdownPreview, setIsMarkdownPreview] = React.useState(false)

  const openPreview = React.useCallback(
    (result: RetrievalResult | RetrievalResultView) => {
      const view = isRetrievalResultView(result)
        ? result
        : toRetrievalResultView(result)
      setSelectedResult(view)
      setIsMarkdownPreview(false)
    },
    [],
  )

  const closePreview = React.useCallback(() => {
    setSelectedResult(null)
    setIsMarkdownPreview(false)
  }, [])

  const togglePreview = React.useCallback(() => {
    setIsMarkdownPreview((value) => !value)
  }, [])

  return {
    selectedResult,
    isMarkdownPreview,
    openPreview,
    closePreview,
    togglePreview,
  }
}
