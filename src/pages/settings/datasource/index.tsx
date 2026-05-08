'use client'

import { Database, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useListDataSource, useAddDataSource } from '@/hooks/use-datasource-request'
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

function AvailableSourceCard({ id, name, description, icon, onAdd }: AvailableSourceCardProps) {
  const { t } = useTranslation()

  return (
    <div
      className="group relative p-4 bg-components-card-bg border border-components-card-border rounded-lg 
                 hover:bg-components-card-bg-hover hover:shadow-elevation-low
                 cursor-pointer transition-all duration-200"
      onClick={() => onAdd({ id, name, description, icon })}
    >
      {/* 添加按钮 - 悬浮显示 */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 
                      transform translate-y-1 group-hover:translate-y-0
                      transition-all duration-200">
        <Button
          size="sm"
          className="h-7 px-3 text-xs font-medium rounded-md gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          {t('common.add')}
        </Button>
      </div>

      {/* 内容区域 */}
      <div className="flex items-start gap-3">
        {/* 图标容器 */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-background-subtle 
                        flex items-center justify-center">
          <div className="w-6 h-6 flex items-center justify-center">
            {icon}
          </div>
        </div>

        {/* 文字内容 */}
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="text-sm font-medium text-text-primary truncate pr-16">
            {name}
          </h3>
          <p className="mt-1 text-xs text-text-tertiary line-clamp-2 leading-relaxed">
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
    <div className="flex flex-col h-full bg-background-body">
      {/* 页面头部 */}
      <header className="flex-shrink-0 px-8 py-6 border-b border-border-default">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          {t('datasource.title')}
        </h1>
        <p className="mt-1.5 text-sm text-text-secondary max-w-2xl">
          {t('datasource.description')}
        </p>
      </header>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-6 space-y-10 max-w-[1400px]">
          
          {/* 已添加的数据源 */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">
                {t('datasource.addedSources')}
              </h2>
            </div>

            {categorizedList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 
                              border-2 border-dashed border-border-default rounded-lg 
                              bg-background-subtle/30">
                <div className="w-16 h-16 rounded-xl bg-background-subtle 
                                flex items-center justify-center mb-4">
                  <Database className="w-8 h-8 text-text-tertiary" />
                </div>
                <p className="text-sm text-text-secondary font-medium">
                  {t('datasource.emptyTip')}
                </p>
                <p className="mt-1 text-xs text-text-tertiary">
                  {t('datasource.availableSourcesDescription')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
