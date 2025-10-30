import type { NodeTypes } from '@xyflow/react'
import { RagNode } from './node'
import { BeginNode } from './node/begin-node'
import { RetrievalNode } from './node/retrieval-node'
import { MessageNode } from './node/message-node'
import { SwitchNode } from './node/switch-node'
import { AgentNode } from './node/agent-node'
import { ToolNode } from './node/tool-node'
import { NoteNode } from './node/note-node'

import { FileNode } from './node/file-node'
import { ParserNode } from './node/parser-node'
import { TokenizerNode } from './node/tokenizer-node'
import { SplitterNode } from './node/splitter-node'
import { ExtractorNode } from './node/extractor-node'

// 定义节点类型映射 - 完整照抄RAGFlow
export const nodeTypes: NodeTypes = {
  ragNode: RagNode,
  beginNode: BeginNode,
  retrievalNode: RetrievalNode,
  messageNode: MessageNode,
  switchNode: SwitchNode,
  agentNode: AgentNode,
  toolNode: ToolNode,
  noteNode: NoteNode,
  // Pipeline专用节点
  fileNode: FileNode,
  parserNode: ParserNode,
  tokenizerNode: TokenizerNode,
  splitterNode: SplitterNode,
  contextNode: ExtractorNode,  // contextNode = ExtractorNode
  // 其他节点类型暂时用RagNode
  rewriteNode: RagNode,
  keywordNode: RagNode,
  categorizeNode: RagNode,
  relevantNode: RagNode,
}

export const edgeTypes = {
  buttonEdge: () => null, // 临时占位，实际使用时会被ButtonEdge替换
}

