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
import lowerFirst from 'lodash/lowerFirst.js'
import { useTranslation } from 'react-i18next'

interface NodeSelectorPanelProps {
  onClose: () => void
  position: { x: number; y: number }
  onNodeCreated?: (newNodeId: string) => void
}

// 节点分类配置
const nodeCategories = [
  {
    titleKey: 'flow.foundation',
    titleFallback: 'Foundation',
    nodes: [
      { type: Operator.Retrieval, icon: Database, color: 'text-blue-600' },
      { type: Operator.Message, icon: MessageSquare, color: 'text-green-600' },
      {
        type: Operator.A2UI,
        icon: GalleryVerticalEnd,
        color: 'text-text-secondary',
      },
    ],
  },
  {
    titleKey: 'flow.flow',
    titleFallback: 'Flow',
    nodes: [
      { type: Operator.Categorize, icon: GitBranch, color: 'text-orange-600' },
      { type: Operator.Switch, icon: GitBranch, color: 'text-yellow-600' },
      { type: Operator.Relevant, icon: GitBranch, color: 'text-pink-600' },
    ],
  },
  {
    titleKey: 'flow.tools',
    titleFallback: 'Tools',
    nodes: [
      { type: Operator.Code, icon: Code, color: 'text-text-secondary' },
      { type: Operator.DuckDuckGo, icon: Search, color: 'text-red-600' },
      { type: Operator.Wikipedia, icon: Globe, color: 'text-text-secondary' },
      { type: Operator.Invoke, icon: FileText, color: 'text-indigo-600' },
      { type: Operator.Email, icon: Mail, color: 'text-blue-500' },
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
  const { t } = useTranslation()

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
      role="menu"
      aria-label={t('flow.nextStep', 'Next step')}
      tabIndex={-1}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="w-[320px] overflow-hidden rounded-lg border border-border-default bg-background-surface shadow-xl">
        {/* 标题 */}
        <div className="border-b border-border-default bg-background-subtle px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">
            {t('flow.nextStep', 'Next step')}
          </h3>
        </div>

        {/* 节点列表 */}
        <div className="max-h-[500px] overflow-y-auto">
          {nodeCategories.map((category) => (
            <div key={category.titleKey} className="py-2">
              <div className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
                {t(category.titleKey, category.titleFallback)}
              </div>
              <div className="space-y-1 px-2">
                {category.nodes.map((node) => {
                  const Icon = node.icon
                  return (
                    <button
                      key={node.type}
                      onClick={() => handleNodeClick(node.type as Operator)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md px-3 py-2.5',
                        'text-left transition-colors hover:bg-background-subtle',
                        'group',
                      )}
                    >
                      <Icon className={cn('h-4 w-4', node.color)} />
                      <span className="text-sm text-text-secondary group-hover:text-text-primary">
                        {t(`flow.${lowerFirst(node.type)}`, node.type)}
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
