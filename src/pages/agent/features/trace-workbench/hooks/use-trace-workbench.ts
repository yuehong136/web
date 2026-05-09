import { useEffect, useMemo, useState } from 'react'
import {
  buildTraceDebugBundle,
  type TraceRunViewModel,
  type TraceSpanViewModel,
} from '@/pages/agent/adapters/trace'
import {
  TRACE_LOADING_EMPTY_STATE,
  TRACE_UNAVAILABLE_LABELS,
} from '../constants'
import type {
  TraceEmptyStateContent,
  TraceEmptyStateReason,
  TraceWorkbenchState,
} from '../types'

export function flattenTraceSpans(
  spans: TraceSpanViewModel[],
): TraceSpanViewModel[] {
  return spans.flatMap((span) => [span, ...flattenTraceSpans(span.children)])
}

export function resolveDefaultTraceSpanId(
  viewModel: TraceRunViewModel,
): string | undefined {
  const issueSpanId = viewModel.issues.find((issue) => issue.spanId)?.spanId
  if (issueSpanId) {
    return issueSpanId
  }

  if (viewModel.summary.slowestSpan?.id) {
    return viewModel.summary.slowestSpan.id
  }

  return flattenTraceSpans(viewModel.spans)[0]?.id
}

export function getTraceEmptyStateContent(
  reason: TraceEmptyStateReason | undefined,
): TraceEmptyStateContent {
  if (reason === 'loading') {
    return TRACE_LOADING_EMPTY_STATE
  }

  if (reason) {
    return TRACE_UNAVAILABLE_LABELS[reason]
  }

  return TRACE_UNAVAILABLE_LABELS['backend-empty']
}

export function createTraceWorkbenchDebugBundle(
  viewModel: TraceRunViewModel,
  selectedSpanId?: string,
): Record<string, unknown> {
  return buildTraceDebugBundle(viewModel, { selectedSpanId })
}

export function useTraceWorkbench(
  viewModel: TraceRunViewModel,
): TraceWorkbenchState {
  const flatSpans = useMemo(
    () => flattenTraceSpans(viewModel.spans),
    [viewModel.spans],
  )
  const defaultSpanId = useMemo(
    () => resolveDefaultTraceSpanId(viewModel),
    [viewModel],
  )
  const [selectedSpanId, setSelectedSpanId] = useState(defaultSpanId)

  useEffect(() => {
    const selectedExists = flatSpans.some((span) => span.id === selectedSpanId)

    if (!selectedExists) {
      setSelectedSpanId(defaultSpanId)
    }
  }, [defaultSpanId, flatSpans, selectedSpanId])

  const selectedSpan = flatSpans.find((span) => span.id === selectedSpanId)

  return {
    flatSpans,
    selectedSpan,
    selectedSpanId,
    defaultSpanId,
    selectSpan: setSelectedSpanId,
  }
}
