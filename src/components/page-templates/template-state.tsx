import type { ReactNode } from 'react'
import {
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns/page-states'

/** Which body a page template shows; `content` renders its children. */
export type TemplateState = 'content' | 'loading' | 'empty' | 'error'

export interface TemplateStateNodes {
  loadingState?: ReactNode
  emptyState?: ReactNode
  errorState?: ReactNode
}

/**
 * The node replacing the body for a non-content state, or null for content.
 * `fallback` supplies the shared page states when the caller passes none;
 * without it a missing node falls through to the content (legacy behaviour).
 */
export function resolveTemplateState(
  state: TemplateState,
  nodes: TemplateStateNodes,
  fallback = false,
): ReactNode {
  if (state === 'loading')
    return nodes.loadingState ?? (fallback ? <PageLoadingState /> : null)
  if (state === 'error')
    return nodes.errorState ?? (fallback ? <PageErrorState /> : null)
  if (state === 'empty') return nodes.emptyState ?? null
  return null
}
