import type { NodeTypes } from '@xyflow/react'
import { RagNode } from './node'
import { BeginNode } from './node/begin-node'
import { RetrievalNode } from './node/retrieval-node'
import { MessageNode } from './node/message-node'
import { SwitchNode } from './node/switch-node'
import { AgentNode } from './node/agent-node'
import { ToolNode } from './node/tool-node'
import { NoteNode } from './node/note-node'
import { CategorizeNode } from './node/categorize-node'
import { RewriteNode } from './node/rewrite-node'
import { DataOperationsNode } from './node/data-operations-node'
import { ListOperationsNode } from './node/list-operations-node'
import { VariableAssignerNode } from './node/variable-assigner-node'
import { VariableAggregatorNode } from './node/variable-aggregator-node'
import { IterationNode, IterationStartNode } from './node/iteration-node'
import { LoopNode, LoopStartNode } from './node/loop-node'
import { ExitLoopNode } from './node/exit-loop-node'
import { PlaceholderNode } from './node/placeholder-node'
import { LabeledGroupNode } from './node/labeled-group-node'

// Pipeline nodes
import { FileNode } from './node/file-node'
import { ParserNode } from './node/parser-node'
import { TokenizerNode } from './node/tokenizer-node'
import { SplitterNode } from './node/splitter-node'
import { ExtractorNode } from './node/extractor-node'

export const nodeTypes: NodeTypes = {
  // Base fallback
  ragNode: RagNode,

  // Core nodes
  beginNode: BeginNode,
  retrievalNode: RetrievalNode,
  messageNode: MessageNode,
  categorizeNode: CategorizeNode,
  switchNode: SwitchNode,
  relevantNode: RagNode,
  rewriteNode: RewriteNode,

  // Agent nodes
  agentNode: AgentNode,
  toolNode: ToolNode,
  noteNode: NoteNode,
  placeholderNode: PlaceholderNode,

  // Data operation nodes
  dataOperationsNode: DataOperationsNode,
  listOperationsNode: ListOperationsNode,
  variableAssignerNode: VariableAssignerNode,
  variableAggregatorNode: VariableAggregatorNode,

  // Iteration / Loop nodes
  iterationNode: IterationNode,
  // Legacy alias: xyflow's built-in `group` type applies a default 150px
  // width that fights NodeResizeControl; kept only to render pre-existing
  // DSLs while the deserializer migrates them to `iterationNode`.
  group: IterationNode,
  labeledGroupNode: LabeledGroupNode,
  iterationStartNode: IterationStartNode,
  loopNode: LoopNode,
  loopStartNode: LoopStartNode,
  exitLoopNode: ExitLoopNode,

  // Pipeline nodes
  fileNode: FileNode,
  parserNode: ParserNode,
  tokenizerNode: TokenizerNode,
  splitterNode: SplitterNode,
  contextNode: ExtractorNode,
}

export const edgeTypes = {
  buttonEdge: () => null,
}
