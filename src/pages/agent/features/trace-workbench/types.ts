import type {
  TraceRunViewModel,
  TraceSpanViewModel,
  TraceUnavailableReason,
} from '@/pages/agent/adapters/trace'

export interface TraceWorkbenchProps {
  viewModel: TraceRunViewModel
  isLoading?: boolean
  className?: string
  onRefresh?: () => void
}

export interface TraceWorkbenchState {
  flatSpans: TraceSpanViewModel[]
  selectedSpan?: TraceSpanViewModel
  selectedSpanId?: string
  defaultSpanId?: string
  selectSpan: (spanId: string) => void
}

export interface TraceEmptyStateContent {
  title: string
  description: string
}

export type TraceEmptyStateReason = TraceUnavailableReason | 'loading'
