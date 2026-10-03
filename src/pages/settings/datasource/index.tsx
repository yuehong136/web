'use client'

import { Database, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  useListDataSource,
  useAddDataSource,
} from '@/hooks/use-datasource-request'
import { DataSourceKey, type IDataSourceInfo } from './types'
import { useDataSourceInfo } from './constants'
import { AddDataSourceModal } from './components/add-datasource-modal'
import { DataSourceCard } from './components/datasource-card'

/**
 * 可用数据源卡片 - 使用项目设计令牌
 */
interface AvailableSourceCardProps extends IDataSourceInfo {
  onAdd: (source: IDataSourceInfo) => void
}

function AvailableSourceCard({
  id,
  name,
  description,
  icon,
  onAdd,
}: AvailableSourceCardProps) {
  const { t } = useTranslation()

  return (
    <div
      className="group relative cursor-pointer rounded-lg border border-components-card-border bg-components-card-bg p-4 transition-all duration-200 hover:bg-components-card-bg-hover hover:shadow-elevation-low"
      onClick={() => onAdd({ id, name, description, icon })}
    >
      {/* 添加按钮 - 悬浮显示 */}
      <div className="absolute top-3 right-3 translate-y-1 transform opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
        <Button
          size="sm"
          className="h-7 gap-1.5 rounded-md px-3 text-xs font-medium"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('common.add')}
        </Button>
      </div>

      {/* 内容区域 */}
      <div className="flex items-start gap-3">
        {/* 图标容器 */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background-subtle">
          <div className="flex h-6 w-6 items-center justify-center">{icon}</div>
        </div>

        {/* 文字内容 */}
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="truncate pr-16 text-sm font-medium text-text-primary">
            {name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-tertiary">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * 数据源管理主页面
 */
export default function DataSourcePage() {
  const { t } = useTranslation()
  const { dataSourceInfo } = useDataSourceInfo()
  const { categorizedList } = useListDataSource()

  const {
    addSource,
    addLoading,
    addingModalVisible,
    handleAddOk,
    hideAddingModal,
    showAddingModal,
  } = useAddDataSource()

  // 构建可用数据源模板列表
  const dataSourceTemplates = Object.values(DataSourceKey).map((id) => ({
    id,
    name: dataSourceInfo[id]?.name || id,
    description: dataSourceInfo[id]?.description || '',
    icon: dataSourceInfo[id]?.icon,
  }))

  return (
    <div className="flex h-full flex-col bg-background-body">
      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] space-y-10 px-8 py-6">
          {/* 已添加的数据源 */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">
                {t('datasource.addedSources')}
              </h2>
            </div>

            {categorizedList.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-default bg-background-subtle/30 py-16">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-background-subtle">
                  <Database className="h-8 w-8 text-text-tertiary" />
                </div>
                <p className="text-sm font-medium text-text-secondary">
                  {t('datasource.emptyTip')}
                </p>
                <p className="mt-1 text-xs text-text-tertiary">
                  {t('datasource.availableSourcesDescription')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {categorizedList.map((item) => (
                  <DataSourceCard
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    icon={item.icon}
                    list={item.list}
                  />
                ))}
              </div>
            )}
          </section>

          {/* 可用数据源 */}
          <section>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-text-primary">
                {t('datasource.availableSources')}
              </h2>
              <p className="mt-1 text-sm text-text-tertiary">
                {t('datasource.availableSourcesDescription')}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {dataSourceTemplates.map((item) => (
                <AvailableSourceCard
                  key={item.id}
                  {...item}
                  onAdd={(source) => showAddingModal(source)}
                />
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* 添加数据源模态框 */}
      {addingModalVisible && addSource && (
        <AddDataSourceModal
          visible={addingModalVisible}
          loading={addLoading}
          hideModal={hideAddingModal}
          onOk={handleAddOk}
          sourceData={addSource}
        />
      )}
    </div>
  )
}
