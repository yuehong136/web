import type { StatusDotTone } from '@/components/studio/collection-identity'
import { SearchExecutionPhase } from '@/types/search'

/**
 * Status dot tone per search phase. Running phases are the AI moment (tide
 * dot, shimmering label); a stopped round stays neutral, never "done".
 */
export const SEARCH_PHASE_TONE: Record<SearchExecutionPhase, StatusDotTone> = {
  [SearchExecutionPhase.IDLE]: 'neutral',
  [SearchExecutionPhase.RETRIEVING]: 'running',
  [SearchExecutionPhase.SUMMARIZING]: 'running',
  [SearchExecutionPhase.RELATED]: 'running',
  [SearchExecutionPhase.COMPLETE]: 'success',
  [SearchExecutionPhase.ERROR]: 'error',
  [SearchExecutionPhase.STOPPED]: 'neutral',
}
