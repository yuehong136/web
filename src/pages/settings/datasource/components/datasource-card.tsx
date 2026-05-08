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
    <div className="bg-components-card-bg border border-components-card-border rounded-lg 
                    overflow-hidden shadow-sm hover:shadow-elevation-low transition-shadow duration-200">
      {/* 类型头部 */}
      <div className="flex items-center gap-3 px-4 py-3 
                      bg-background-subtle border-b border-border-default">
        <div className="w-8 h-8 rounded-md bg-background-body 
                        flex items-center justify-center shadow-sm">
          <div className="w-5 h-5 flex items-center justify-center">
            {icon}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">{name}</span>
          <span className="px-2 py-0.5 text-xs font-medium text-text-tertiary 
                           bg-background-default rounded-full">
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
              className="group flex items-center justify-between px-3 py-2.5 
                         rounded-md bg-background-subtle/50
                         hover:bg-background-subtle transition-colors duration-150"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-2 h-2 rounded-full bg-state-success flex-shrink-0" />
                <span className="text-sm text-text-primary font-medium truncate">
                  {item.name}
                </span>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 
                              transition-opacity duration-150">
                <Tooltip content={t('common.settings')}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 rounded-md 
                               text-text-secondary hover:text-text-primary
                               hover:bg-background-default"
                    onClick={() => handleSettings(item.id)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </Tooltip>
                <Tooltip content={t('common.delete')}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 rounded-md 
                               text-text-secondary hover:text-state-error
                               hover:bg-state-error-10"
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
