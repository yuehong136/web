import { useCallback } from 'react'
import { useSaveGraph } from './use-save-graph'
import { useParams } from 'react-router-dom'
import { useFetchAgent } from './use-fetch-data'

// Hook to save the graph when a form field loses focus.
// This ensures changes are persisted immediately without waiting for the debounce timer.
export const useSaveOnBlur = () => {
  const { id } = useParams<{ id: string }>()
  const { data: agent } = useFetchAgent()
  const { saveGraph } = useSaveGraph(id, false)

  const handleSaveOnBlur = useCallback(() => {
    if (agent?.title) {
      const title = typeof agent.title === 'string' ? agent.title : (agent.title.zh || agent.title.en || 'Untitled')
      saveGraph(title)
    }
  }, [saveGraph, agent])

  return { handleSaveOnBlur }
}
