import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Settings, Trash2 } from 'lucide-react'
import { SettingsTemplate } from '@/components/page-templates/settings-template'
import { PageEmptyState } from '@/components/patterns/page-states'
import { SettingRow, SettingSection } from '@/components/patterns/setting-row'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  useAddDataSource,
  useDeleteDataSource,
  useListDataSource,
} from '@/hooks/use-datasource-request'
import { AddDataSourceModal } from './components/add-datasource-modal'
import { useDataSourceInfo } from './constants'
import { DataSourceKey, type IDataSourceBase } from './types'

/** Connected data sources and the source types that can be added. */
export default function DataSourcePage() {
  const { t } = useTranslation()
  const { dataSourceInfo } = useDataSourceInfo()
  const { categorizedList } = useListDataSource()
  const { handleDeleteAsync, deleteLoading } = useDeleteDataSource()
  const [deleting, setDeleting] = useState<{
    source: IDataSourceBase
    returnFocus: HTMLElement | null
  } | null>(null)
  const {
    addSource,
    addLoading,
    addingModalVisible,
    handleAddOk,
    hideAddingModal,
    showAddingModal,
  } = useAddDataSource()

  const connected = categorizedList.flatMap((category) =>
    category.list.map((source) => ({ source, category })),
  )
  const templates = Object.values(DataSourceKey).map((id) => ({
    id,
    name: dataSourceInfo[id]?.name || id,
    description: dataSourceInfo[id]?.description || '',
    icon: dataSourceInfo[id]?.icon,
  }))

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await handleDeleteAsync(deleting.source.id)
      setDeleting(null)
    } catch {
      // The data source hook reports the failure; keep the dialog to retry.
    }
  }

  const icon = (node: React.ReactNode) => (
    <span className="flex size-6 items-center justify-center [&_svg]:size-icon-md">
      {node}
    </span>
  )

  return (
    <>
      <SettingsTemplate description={t('datasource.description')}>
        <SettingSection title={t('datasource.addedSources')}>
          {connected.length === 0 ? (
            <PageEmptyState
              compact
              title={t('datasource.emptyTip')}
              description={null}
            />
          ) : (
            connected.map(({ source, category }) => (
              <SettingRow
                key={source.id}
                leading={icon(category.icon)}
                label={source.name}
                description={category.name}
              >
                <Button asChild variant="ghost" size="sm">
                  <Link
                    to={`/settings/datasource-detail?id=${encodeURIComponent(source.id)}`}
                  >
                    <Settings className="size-icon-sm" aria-hidden="true" />
                    {t('common.settings')}
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('datasource.deleteNamed', {
                    name: source.name,
                  })}
                  onClick={(event) =>
                    setDeleting({ source, returnFocus: event.currentTarget })
                  }
                >
                  <Trash2 className="size-icon-sm" aria-hidden="true" />
                </Button>
              </SettingRow>
            ))
          )}
        </SettingSection>

        <SettingSection
          title={t('datasource.availableSources')}
          description={t('datasource.availableSourcesDescription')}
        >
          {templates.map((template) => (
            <SettingRow
              key={template.id}
              leading={icon(template.icon)}
              label={template.name}
              description={template.description}
            >
              <Button
                variant="outline"
                size="sm"
                aria-label={t('datasource.addNamed', { name: template.name })}
                leftIcon={<Plus className="size-icon-sm" aria-hidden="true" />}
                onClick={() => showAddingModal(template)}
              >
                {t('common.add')}
              </Button>
            </SettingRow>
          ))}
        </SettingSection>
      </SettingsTemplate>

      <ConfirmDialog
        variant="destructive"
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !deleteLoading) setDeleting(null)
        }}
        title={t('datasource.deleteConfirmTitle')}
        description={t('datasource.deleteConfirmMessage', {
          name: deleting?.source.name ?? '',
        })}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.delete')}
        pending={deleteLoading}
        returnFocus={deleting?.returnFocus}
        onConfirm={() => void confirmDelete()}
      />

      {addingModalVisible && addSource && (
        <AddDataSourceModal
          visible={addingModalVisible}
          loading={addLoading}
          hideModal={hideAddingModal}
          onOk={handleAddOk}
          sourceData={addSource}
        />
      )}
    </>
  )
}
