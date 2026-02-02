'use client'

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Link, Settings, Unlink, RefreshCw, Database, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
import {
  useListDataSource,
  useDataSourceByKb,
  useLinkDataSource,
  useDataSourceRebuild,
} from '@/hooks/use-datasource-request'
import { useDataSourceInfo } from '@/pages/settings/datasource/constants'
import { type IDataSourceBase, type IConnector, DataSourceKey } from '@/pages/settings/datasource/types'

// 单个数据源项卡片
interface DataSourceItemCardProps {
  item: IConnector
  onUnbind: () => void
  onAutoParse: (autoParse: boolean) => void
  onRebuild: () => void
  onSettings: () => void
  isUpdating?: boolean
}

function DataSourceItemCard({
  item,
  onUnbind,
  onAutoParse,
  onRebuild,
  onSettings,
  isUpdating,
}: DataSourceItemCardProps) {
  const { t } = useTranslation()
  const { dataSourceInfo } = useDataSourceInfo()
  const sourceInfo = dataSourceInfo[item.source as DataSourceKey] || {
    icon: <Database className="h-5 w-5 text-text-tertiary" />,
    name: item.source,
  }

  return (
    <div className="flex items-center justify-between gap-2 px-3 h-12 rounded-lg border border-border group hover:bg-surface-secondary transition-colors">
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
          <span className="text-xs text-text-tertiary">{t('datasource.autoParse')}</span>
          <Switch
            checked={item.auto_parse === '1'}
            onCheckedChange={onAutoParse}
            disabled={isUpdating}
            className="scale-75"
          />
        </div>
        {/* 重新解析按钮 */}
        <Tooltip content={t('datasource.rebuild')}>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="h-8 w-8 p-0 hidden group-hover:flex"
            onClick={onRebuild}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </Tooltip>
        {/* 设置按钮 */}
        <Tooltip content={t('common.settings')}>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="h-8 w-8 p-0 hidden group-hover:flex"
            onClick={onSettings}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </Tooltip>
        {/* 解除绑定按钮 */}
        <Tooltip content={t('datasource.unbind')}>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="h-8 w-8 p-0 hidden group-hover:flex text-status-error hover:text-status-error"
            onClick={onUnbind}
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
  linkedIds: string[]
  onLink: (connectorId: string) => void
  isLinking: boolean
}

function LinkDataSourceModal({
  open,
  onOpenChange,
  linkedIds,
  onLink,
  isLinking,
}: LinkDataSourceModalProps) {
  const { t } = useTranslation()
  const { list, isFetching } = useListDataSource()
  const { dataSourceInfo } = useDataSourceInfo()
  const [selected, setSelected] = useState<string | null>(null)

  // 过滤掉已链接的数据源
  const availableSources = list.filter((source) => !linkedIds.includes(source.id))

  const handleSubmit = () => {
    if (selected) {
      onLink(selected)
      setSelected(null)
    }
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
              <DialogTitle>{t('datasource.linkDataSource')}</DialogTitle>
              <DialogDescription>
                {t('datasource.linkDataSourceDescription')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 space-y-3 max-h-[320px] overflow-y-auto">
          {isFetching ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
            </div>
          ) : availableSources.length > 0 ? (
            availableSources.map((source) => {
              const sourceInfo = dataSourceInfo[source.source as DataSourceKey] || {
                icon: <Database className="h-5 w-5 text-text-tertiary" />,
                name: source.source,
              }
              const isSelected = selected === source.id
              return (
                <div
                  key={source.id}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-xl border-2 cursor-pointer transition-all',
                    isSelected
                      ? 'border-border-accent bg-surface-accent-subtle'
                      : 'border-border hover:border-border-hover hover:bg-surface-secondary'
                  )}
                  onClick={() => setSelected(source.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface-secondary flex items-center justify-center">
                      {sourceInfo.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-text-primary">
                        {sourceInfo.name}
                      </span>
                      <span className="text-xs text-text-tertiary">
                        {source.name}
                      </span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center',
                      isSelected
                        ? 'border-border-accent bg-surface-accent'
                        : 'border-border'
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
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-secondary flex items-center justify-center">
                <Database className="h-8 w-8 text-text-tertiary" />
              </div>
              <p className="text-sm font-medium text-text-secondary">
                {t('datasource.noAvailableSources')}
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                {t('datasource.configureSourcesFirst')}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selected || isLinking}
            className="gap-1.5"
          >
            {isLinking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Link className="h-4 w-4" />
            )}
            {t('datasource.confirmLink')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// 主组件
interface LinkDataSourceProps {
  kbId: string
  className?: string
}

export function LinkDataSource({ kbId, className }: LinkDataSourceProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [openLinkModal, setOpenLinkModal] = useState(false)

  // 获取已链接的数据源
  const { dataSources, isFetching, refetch } = useDataSourceByKb(kbId)
  const { link, unlink, updateAutoParse, isLinking, isUnlinking } = useLinkDataSource(kbId)
  const { handleRebuild } = useDataSourceRebuild()

  // 转换为 IConnector 类型
  const linkedSources: IConnector[] = dataSources.map((ds) => ({
    ...ds,
    auto_parse: '0' as const, // 默认值，后端应该返回实际值
  }))

  const handleLink = (connectorId: string) => {
    link({ connectorId, autoParse: false })
    setOpenLinkModal(false)
  }

  const handleUnbind = (connectorId: string) => {
    unlink(connectorId)
  }

  const handleAutoParse = (connectorId: string, autoParse: boolean) => {
    updateAutoParse({ connectorId, autoParse })
  }

  const handleSettings = (connectorId: string) => {
    navigate(`/settings/datasource-detail?id=${connectorId}`)
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* 标题和链接按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-text-primary">
            {t('datasource.dataSources')}
          </h3>
          <p className="text-xs text-text-tertiary mt-0.5">
            {t('datasource.manageLinkedSources')}
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
          {t('datasource.linkDataSource')}
        </Button>
      </div>

      {/* 已链接的数据源列表 */}
      {isFetching ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
        </div>
      ) : linkedSources.length > 0 ? (
        <div className="space-y-2">
          {linkedSources.map((item) => (
            <DataSourceItemCard
              key={item.id}
              item={item}
              onUnbind={() => handleUnbind(item.id)}
              onAutoParse={(autoParse) => handleAutoParse(item.id, autoParse)}
              onRebuild={() => handleRebuild(item.id)}
              onSettings={() => handleSettings(item.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 border border-dashed border-border rounded-lg">
          <Database className="h-10 w-10 text-text-tertiary mb-2" />
          <p className="text-sm text-text-tertiary">{t('datasource.noLinkedSources')}</p>
          <p className="text-xs text-text-tertiary mt-1">
            {t('datasource.linkSourcesTip')}
          </p>
        </div>
      )}

      {/* 链接数据源对话框 */}
      <LinkDataSourceModal
        open={openLinkModal}
        onOpenChange={setOpenLinkModal}
        linkedIds={linkedSources.map((s) => s.id)}
        onLink={handleLink}
        isLinking={isLinking}
      />
    </div>
  )
}

export default LinkDataSource
