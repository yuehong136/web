'use client'

import { useState } from 'react'
import { Link, Settings, Unlink, RefreshCw, Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tooltip } from '@/components/ui/tooltip'

// 数据源类型
export interface DataSourceItem {
  id: string
  name: string
  source: string // 'mysql' | 's3' | 'google_drive' | 'notion' | ...
  auto_parse: '0' | '1'
  status?: string
}

// 数据源图标映射
const DataSourceIcons: Record<string, { icon: React.ReactNode; name: string }> = {
  mysql: { icon: <Database className="h-5 w-5 text-blue-500" />, name: 'MySQL' },
  postgresql: { icon: <Database className="h-5 w-5 text-blue-600" />, name: 'PostgreSQL' },
  s3: { icon: <Database className="h-5 w-5 text-orange-500" />, name: 'Amazon S3' },
  google_drive: { icon: <Database className="h-5 w-5 text-green-500" />, name: 'Google Drive' },
  notion: { icon: <Database className="h-5 w-5 text-gray-700" />, name: 'Notion' },
  confluence: { icon: <Database className="h-5 w-5 text-blue-400" />, name: 'Confluence' },
  github: { icon: <Database className="h-5 w-5 text-gray-800" />, name: 'GitHub' },
  default: { icon: <Database className="h-5 w-5 text-text-tertiary" />, name: '未知数据源' },
}

// 单个数据源项
interface DataSourceItemCardProps {
  item: DataSourceItem
  onUnbind?: (item: DataSourceItem) => void
  onAutoParse?: (id: string, autoParse: boolean) => void
  onRebuild?: (id: string) => void
  onSettings?: (id: string) => void
}

function DataSourceItemCard({
  item,
  onUnbind,
  onAutoParse,
  onRebuild,
  onSettings,
}: DataSourceItemCardProps) {
  const sourceInfo = DataSourceIcons[item.source] || DataSourceIcons.default

  return (
    <div className="flex items-center justify-between gap-2 px-3 h-12 rounded-lg border border-border group hover:bg-background-subtle transition-colors">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
          {sourceInfo.icon}
        </div>
        <div className="text-sm font-medium text-text-primary">{sourceInfo.name}</div>
        <div className="text-sm text-text-secondary">{item.name}</div>
      </div>
      <div className="flex items-center gap-1">
        {/* 自动解析开关 */}
        <div className="items-center gap-2 hidden mr-3 group-hover:flex">
          <span className="text-xs text-text-tertiary">自动解析</span>
          <Switch
            checked={item.auto_parse === '1'}
            onCheckedChange={(checked) => onAutoParse?.(item.id, checked)}
            className="scale-75"
          />
        </div>
        {/* 重新解析按钮 */}
        <Tooltip content="重新解析">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="h-8 w-8 p-0 hidden group-hover:flex"
            onClick={() => onRebuild?.(item.id)}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </Tooltip>
        {/* 设置按钮 */}
        <Tooltip content="设置">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="h-8 w-8 p-0 hidden group-hover:flex"
            onClick={() => onSettings?.(item.id)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </Tooltip>
        {/* 解除绑定按钮 */}
        <Tooltip content="解除绑定">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="h-8 w-8 p-0 hidden group-hover:flex text-destructive hover:text-destructive"
            onClick={() => onUnbind?.(item)}
          >
            <Unlink className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>
    </div>
  )
}

// 数据源选择对话框
interface LinkDataSourceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedList: DataSourceItem[]
  onSubmit: (items: DataSourceItem[]) => void
}

function LinkDataSourceModal({
  open,
  onOpenChange,
  selectedList,
  onSubmit,
}: LinkDataSourceModalProps) {
  // 模拟可用的数据源列表
  const availableSources = [
    { id: '1', name: 'production-db', source: 'mysql', auto_parse: '0' as const },
    { id: '2', name: 'analytics-bucket', source: 's3', auto_parse: '0' as const },
    { id: '3', name: 'Team Wiki', source: 'notion', auto_parse: '1' as const },
  ]

  const [selected, setSelected] = useState<string[]>(selectedList.map((s) => s.id))

  const handleToggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleSubmit = () => {
    const selectedItems = availableSources.filter((s) => selected.includes(s.id))
    onSubmit(selectedItems)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Link className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle>链接数据源</DialogTitle>
              <DialogDescription>
                选择要链接到此知识库的数据源，链接后文件将自动同步
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 space-y-3 max-h-[320px] overflow-y-auto">
          {availableSources.length > 0 ? (
            availableSources.map((source) => {
              const sourceInfo = DataSourceIcons[source.source] || DataSourceIcons.default
              const isSelected = selected.includes(source.id)
              return (
                <div
                  key={source.id}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-xl border-2 cursor-pointer transition-all',
                    isSelected
                      ? 'border-[var(--color-border-accent)] bg-[var(--color-surface-accent-subtle)]'
                      : 'border-[var(--color-border-default)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-secondary)]'
                  )}
                  onClick={() => handleToggle(source.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[var(--color-surface-secondary)] flex items-center justify-center">
                      {sourceInfo.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">
                        {sourceInfo.name}
                      </span>
                      <span className="text-xs text-[var(--color-text-tertiary)]">
                        {source.name}
                      </span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center',
                      isSelected
                        ? 'border-[var(--color-border-accent)] bg-[var(--color-surface-accent)]'
                        : 'border-[var(--color-border-default)]'
                    )}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-10">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-surface-secondary)] flex items-center justify-center">
                <Database className="h-8 w-8 text-[var(--color-text-tertiary)]" />
              </div>
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                暂无可用的数据源
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                请先在设置中配置数据源
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} className="gap-1.5">
            <Link className="h-4 w-4" />
            确认链接
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// 主组件
interface LinkDataSourceProps {
  data?: DataSourceItem[]
  onLinkOrEditSubmit?: (items: DataSourceItem[]) => void
  onUnbind?: (item: DataSourceItem) => void
  onAutoParse?: (id: string, autoParse: boolean) => void
  className?: string
}

export function LinkDataSource({
  data = [],
  onLinkOrEditSubmit,
  onUnbind,
  onAutoParse,
  className,
}: LinkDataSourceProps) {
  const [openLinkModal, setOpenLinkModal] = useState(false)

  const handleRebuild = (id: string) => {
    console.log('Rebuild data source:', id)
    // TODO: 实现重新解析功能
  }

  const handleSettings = (id: string) => {
    console.log('Open settings for:', id)
    // TODO: 导航到数据源设置页面
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* 标题和链接按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-text-primary">数据源</h3>
          <p className="text-xs text-text-tertiary mt-0.5">
            管理与此知识库关联的数据源
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpenLinkModal(true)}
          className="gap-1.5"
        >
          <Link className="h-4 w-4" />
          链接数据源
        </Button>
      </div>

      {/* 已链接的数据源列表 */}
      {data.length > 0 ? (
        <div className="space-y-2">
          {data.map((item) => (
            <DataSourceItemCard
              key={item.id}
              item={item}
              onUnbind={onUnbind}
              onAutoParse={onAutoParse}
              onRebuild={handleRebuild}
              onSettings={handleSettings}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 border border-dashed border-border rounded-lg">
          <Database className="h-10 w-10 text-text-tertiary mb-2" />
          <p className="text-sm text-text-tertiary">暂未链接数据源</p>
          <p className="text-xs text-text-tertiary mt-1">
            链接数据源后，文件将自动同步到知识库
          </p>
        </div>
      )}

      {/* 链接数据源对话框 */}
      <LinkDataSourceModal
        open={openLinkModal}
        onOpenChange={setOpenLinkModal}
        selectedList={data}
        onSubmit={(items) => onLinkOrEditSubmit?.(items)}
      />
    </div>
  )
}

export default LinkDataSource




