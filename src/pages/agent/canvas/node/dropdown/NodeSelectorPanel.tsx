import { useContext } from 'react'
import {
  Code,
  Database,
  FileText,
  GalleryVerticalEnd,
  GitBranch,
  Globe,
  Mail,
  MessageSquare,
  Search,
} from 'lucide-react'
import { AgentInstanceContext, HandleContext } from '../../../context'
import { Operator } from '../../../constant'
import { cn } from '@/lib/utils'

interface NodeSelectorPanelProps {
  onClose: () => void
  position: { x: number; y: number }
  onNodeCreated?: (newNodeId: string) => void
}

// 节点分类配置
const nodeCategories = [
  {
    title: '核心',
    nodes: [
      { type: Operator.Retrieval, icon: Database, label: '检索', color: 'text-blue-600' },
      { type: Operator.Message, icon: MessageSquare, label: '回复', color: 'text-green-600' },
      { type: Operator.A2UI, icon: GalleryVerticalEnd, label: 'A2UI 卡片', color: 'text-text-secondary' },
    ],
  },
  {
    title: '控制流',
    nodes: [
      { type: Operator.Categorize, icon: GitBranch, label: '分类', color: 'text-orange-600' },
      { type: Operator.Switch, icon: GitBranch, label: '条件', color: 'text-yellow-600' },
      { type: Operator.Relevant, icon: GitBranch, label: '相关性', color: 'text-pink-600' },
    ],
  },
  {
    title: '工具',
    nodes: [
      { type: Operator.Code, icon: Code, label: '代码', color: 'text-text-secondary' },
      { type: Operator.DuckDuckGo, icon: Search, label: 'DuckDuckGo', color: 'text-red-600' },
      { type: Operator.Wikipedia, icon: Globe, label: 'Wikipedia', color: 'text-text-secondary' },
      { type: Operator.Invoke, icon: FileText, label: 'HTTP请求', color: 'text-indigo-600' },
      { type: Operator.Email, icon: Mail, label: '邮箱', color: 'text-blue-500' },
    ],
  },
]

export const NodeSelectorPanel = ({
  onClose,
  position,
  onNodeCreated,
}: NodeSelectorPanelProps) => {
  const { addCanvasNode } = useContext(AgentInstanceContext)
  const handleContext = useContext(HandleContext)

  const handleNodeClick = (operator: Operator) => {
    const mockEvent = {
      clientX: position.x,
      clientY: position.y,
    }

    const newNodeId = addCanvasNode(operator, handleContext)(mockEvent)

    if (onNodeCreated && newNodeId) {
      onNodeCreated(newNodeId)
    }

    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 1000,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-[320px] bg-background-surface border border-border-default rounded-lg shadow-xl overflow-hidden">
        {/* 标题 */}
        <div className="px-4 py-3 border-b border-border-default bg-background-subtle">
          <h3 className="text-sm font-semibold text-text-primary">下一步</h3>
        </div>

        {/* 节点列表 */}
        <div className="max-h-[500px] overflow-y-auto">
          {nodeCategories.map((category) => (
            <div key={category.title} className="py-2">
              <div className="px-4 py-2 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                {category.title}
              </div>
              <div className="space-y-1 px-2">
                {category.nodes.map((node) => {
                  const Icon = node.icon
                  return (
                    <button
                      key={node.type}
                      onClick={() => handleNodeClick(node.type as Operator)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-md',
                        'hover:bg-background-subtle transition-colors text-left',
                        'group',
                      )}
                    >
                      <Icon className={cn('w-4 h-4', node.color)} />
                      <span className="text-sm text-text-secondary group-hover:text-text-primary">
                        {node.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
