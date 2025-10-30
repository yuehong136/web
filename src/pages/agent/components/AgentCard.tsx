import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Workflow, Calendar, MoreVertical, Edit, Trash2, Play, Copy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { IFlow } from '../types'

interface AgentCardProps {
  agent: IFlow
  onDelete: (id: string) => void
  onRename?: (id: string, currentName: string) => void
  onDuplicate?: (id: string) => void
}

export const AgentCard = ({ agent, onDelete, onRename, onDuplicate }: AgentCardProps) => {
  const navigate = useNavigate()

  // 处理多语言标题
  const title = typeof agent.title === 'object'
    ? (agent.title.zh || agent.title.en || '未命名')
    : (agent.title || '未命名')

  // 处理多语言描述
  const description = typeof agent.description === 'object'
    ? (agent.description.zh || agent.description.en)
    : agent.description

  // 判断类型
  const isPlugin = agent.canvas_type === 'pipeline' || agent.canvas_category === 'Ingestion'

  return (
    <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30">
      {/* 顶部彩色条 */}
      <div className={cn(
        'h-1.5 w-full',
        isPlugin
          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
          : 'bg-gradient-to-r from-blue-500 to-purple-500'
      )} />

      <div className="p-6">
        {/* 头部：图标+标题+菜单 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* 图标 */}
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg',
              isPlugin
                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                : 'bg-gradient-to-br from-blue-500 to-purple-600'
            )}>
              <Workflow className="w-6 h-6 text-white" />
            </div>
            
            {/* 标题和类型 */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate text-lg group-hover:text-primary transition-colors">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isPlugin ? 'Pipeline' : '智能体流程'}
              </p>
            </div>
          </div>

          {/* 更多菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => navigate(`/agent/${agent.id}`)}>
                <Edit className="w-4 h-4 mr-2" />
                编辑
              </DropdownMenuItem>
              {onRename && (
                <DropdownMenuItem onClick={() => onRename(agent.id, title)}>
                  <Edit className="w-4 h-4 mr-2" />
                  重命名
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(agent.id)}>
                  <Copy className="w-4 h-4 mr-2" />
                  复制
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(agent.id)
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 描述 */}
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
            {description}
          </p>
        )}

        {/* 底部信息 */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="w-3 h-3 mr-1.5" />
            {new Date(agent.update_time * 1000).toLocaleDateString('zh-CN', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>

          {/* 快速操作按钮 */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              className="h-8"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/agent/${agent.id}`)
              }}
            >
              <Edit className="w-3 h-3 mr-1" />
              编辑
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8"
              onClick={(e) => {
                e.stopPropagation()
                // TODO: 运行功能
                console.log('运行:', agent.id)
              }}
            >
              <Play className="w-3 h-3 mr-1" />
              运行
            </Button>
          </div>
        </div>
      </div>

      {/* 点击整个卡片也可以进入 */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={() => navigate(`/agent/${agent.id}`)}
      />
    </Card>
  )
}

