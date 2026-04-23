import { useSearchParams } from 'react-router-dom'
import { AgentCategory, AgentQuery } from '../constant'

export const useIsPipeline = () => {
  const [searchParams] = useSearchParams()

  return searchParams.get(AgentQuery.Category) === AgentCategory.DataflowCanvas
}
