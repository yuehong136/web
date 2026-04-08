import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/patterns'
import { formatTimestampDetailed } from '@/lib/utils'
import { isPipelineFlow, resolveLocalizedText } from '@/lib/agent'
import type { AgentFlow } from '@/types/agent'
import {
  Compass,
  Copy,
  GitBranch,
  History,
  Link2,
  Settings2,
  Sparkles,
} from 'lucide-react'

interface EditorRuntimeRailProps {
  flow?: AgentFlow
  autosaveLabel?: string
  onOpenExplore: () => void
  onOpenVersions: () => void
  onOpenWebhook: () => void
  onOpenSettings: () => void
  onOpenShare: () => void
  onOpenRoadmap: () => void
}

export function EditorRuntimeRail({
  flow,
  autosaveLabel,
  onOpenExplore,
  onOpenVersions,
  onOpenWebhook,
  onOpenSettings,
  onOpenShare,
  onOpenRoadmap,
}: EditorRuntimeRailProps) {
  const title = resolveLocalizedText(flow?.title, '未命名资产')
  const description = resolveLocalizedText(flow?.description, '阶段一先完成编辑器骨架与运行入口。')
  const nodeCount = flow?.dsl.graph?.nodes.length || 0
  const edgeCount = flow?.dsl.graph?.edges.length || 0

  return (
    <div className="flex h-full flex-col gap-space-lg overflow-auto p-space-lg">
      <SectionCard title="当前资产" padding="default">
        <div className="space-y-space-md">
          <div>
            <p className="text-base font-semibold text-text-primary">{title}</p>
            <p className="mt-space-xs text-sm text-text-secondary">{description}</p>
          </div>
          <div className="grid grid-cols-2 gap-space-sm text-sm">
            <div className="rounded-radius-lg bg-surface-secondary p-space-sm">
              <p className="text-text-tertiary">类型</p>
              <p className="mt-space-xs font-medium text-text-primary">
                {isPipelineFlow(flow) ? 'Pipeline' : 'Agent'}
              </p>
            </div>
            <div className="rounded-radius-lg bg-surface-secondary p-space-sm">
              <p className="text-text-tertiary">自动保存</p>
              <p className="mt-space-xs font-medium text-text-primary">
                {autosaveLabel || '待首次保存'}
              </p>
            </div>
            <div className="rounded-radius-lg bg-surface-secondary p-space-sm">
              <p className="text-text-tertiary">节点</p>
              <p className="mt-space-xs font-medium text-text-primary">{nodeCount}</p>
            </div>
            <div className="rounded-radius-lg bg-surface-secondary p-space-sm">
              <p className="text-text-tertiary">连线</p>
              <p className="mt-space-xs font-medium text-text-primary">{edgeCount}</p>
            </div>
          </div>
          {flow?.update_time ? (
            <p className="text-xs text-text-tertiary">
              最近更新时间：{formatTimestampDetailed(flow.update_time)}
            </p>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="运行入口" padding="default">
        <div className="grid gap-space-sm">
          <Button variant="outline" onClick={onOpenExplore}>
            <Compass className="mr-space-xs h-4 w-4" />
            Explore 会话
          </Button>
          <Button variant="outline" onClick={onOpenVersions}>
            <History className="mr-space-xs h-4 w-4" />
            版本骨架
          </Button>
          <Button variant="outline" onClick={onOpenWebhook}>
            <Link2 className="mr-space-xs h-4 w-4" />
            Webhook 骨架
          </Button>
          <Button variant="outline" onClick={onOpenShare}>
            <Copy className="mr-space-xs h-4 w-4" />
            Share 入口
          </Button>
          <Button variant="outline" onClick={onOpenSettings}>
            <Settings2 className="mr-space-xs h-4 w-4" />
            编辑基础设置
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="阶段路线" padding="default">
        <div className="space-y-space-sm text-sm text-text-secondary">
          <p className="flex items-start gap-space-xs">
            <Sparkles className="mt-[2px] h-4 w-4 shrink-0 text-text-accent" />
            这一阶段已经把路由、页面壳层、共享类型和请求层切到新的信息架构。
          </p>
          <p className="flex items-start gap-space-xs">
            <GitBranch className="mt-[2px] h-4 w-4 shrink-0 text-text-accent" />
            下一阶段将逐个拆分节点表单、结构化输出、日志时间线和分享/发布体验。
          </p>
          <Button variant="secondary" onClick={onOpenRoadmap}>
            查看占位与后续增量清单
          </Button>
        </div>
      </SectionCard>
    </div>
  )
}
