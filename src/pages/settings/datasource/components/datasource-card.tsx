'use client'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { useDeleteDataSource } from '@/hooks/use-datasource-request'
import { type IDataSourceBase, DataSourceKey } from '../types'
import { DeleteConfirmModal } from './delete-confirm-modal'

interface DataSourceCardProps {
  id: DataSourceKey
  name: string
  icon: React.ReactNode
  list: IDataSourceBase[]
}

/**
 * 已添加的数据源卡片 - 使用项目设计令牌
 */
export function DataSourceCard({ name, icon, list }: DataSourceCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [deleteTarget, setDeleteTarget] = useState<IDataSourceBase | null>(null)
  const { handleDeleteAsync, deleteLoading } = useDeleteDataSource()

  const handleSettings = (sourceId: string) => {
    navigate(`/settings/datasource-detail?id=${sourceId}`)
  }

  const handleDelete = async () => {
    if (deleteTarget) {
      await handleDeleteAsync(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  if (list.length === 0) return null

  return (
    <div className="hover:shadow-elevation-low overflow-hidden rounded-lg border border-components-card-border bg-components-card-bg shadow-sm transition-shadow duration-200">
      {/* 类型头部 */}
      <div className="flex items-center gap-3 border-b border-border-default bg-background-subtle px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-background-body shadow-sm">
          <div className="flex h-5 w-5 items-center justify-center">{icon}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">{name}</span>
          <span className="rounded-full bg-background-default px-2 py-0.5 text-xs font-medium text-text-tertiary">
            {list.length}
          </span>
        </div>
      </div>

      {/* 数据源列表 */}
      <div className="p-3">
        <div className="space-y-2">
          {list.map((item) => (
            <div
              key={item.id}
              className="bg-background-subtle/50 group flex items-center justify-between rounded-md px-3 py-2.5 transition-colors duration-150 hover:bg-background-subtle"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-2 w-2 flex-shrink-0 rounded-full bg-status-success" />
                <span className="truncate text-sm font-medium text-text-primary">
                  {item.name}
                </span>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                <Tooltip content={t('common.settings')}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 rounded-md p-0 text-text-secondary hover:bg-background-default hover:text-text-primary"
                    onClick={() => handleSettings(item.id)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </Tooltip>
                <Tooltip content={t('common.delete')}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 rounded-md p-0 text-text-secondary hover:bg-status-error-10 hover:text-status-error"
                    onClick={() => setDeleteTarget(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 删除确认模态框 */}
      <DeleteConfirmModal
        visible={!!deleteTarget}
        loading={deleteLoading}
        sourceName={deleteTarget?.name || ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
