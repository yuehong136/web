import type { AgentCanvasType, AgentGraph } from '@/types/agent'
import { AgentCanvasType as CanvasType } from '@/types/agent'
import { Operator } from '../constant'

const pipelineOperators = new Set<string>([
  Operator.File,
  Operator.Parser,
  Operator.Tokenizer,
  Operator.TokenChunker,
  Operator.TitleChunker,
  'Splitter',
  'HierarchicalMerger',
  Operator.Extractor,
])

export function inferCanvasTypeFromGraph(
  graph: AgentGraph | undefined,
): AgentCanvasType {
  if (
    (graph?.nodes || []).some((node) => pipelineOperators.has(node.data.label))
  ) {
    return CanvasType.PIPELINE
  }

  return CanvasType.AGENT
}
