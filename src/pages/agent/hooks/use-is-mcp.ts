import { Operator } from '../constant'
import useGraphStore from '../store'
import { getAgentNodeTools } from '../utils'

export function useIsMcp(operatorName: Operator) {
  const { clickedToolId, nodes } = useGraphStore((state) => state)

  if (operatorName !== Operator.Tool || !clickedToolId) {
    return false
  }

  const tools = nodes
    .filter((node) => node.data?.label === Operator.Agent)
    .flatMap((node) => getAgentNodeTools(node))

  const currentTool = tools.find(
    (tool: any) => (tool?.id || tool?.component_name) === clickedToolId,
  )
  const toolName = currentTool?.component_name

  return Boolean(
    toolName && Object.values(Operator).every((x) => x !== toolName),
  )
}
