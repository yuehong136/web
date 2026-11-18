import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SettingsTemplate } from '@/components/page-templates/settings-template'
import { EmptyStart } from '@/components/patterns/empty-start'
import { PageLoadingState } from '@/components/patterns/page-states'
import { SettingSection } from '@/components/patterns/setting-row'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  useAddDataSource,
  useDeleteDataSource,
  useListDataSource,
} from '@/hooks/use-datasource-request'
import { AddDataSourceModal } from './components/add-datasource-modal'
import { ConnectedSources } from './components/connected-sources'
import { ConnectorCatalog } from './components/connector-catalog'
import { ConnectorStackIllustration } from './components/connector-logo'
import { useDataSourceInfo } from './constants'
import { DataSourceKey, type IDataSource } from './types'

/** First-use start paths: one common connector from each large group. */
const START_PATHS = [
  DataSourceKey.S3,
  DataSourceKey.CONFLUENCE,
  DataSourceKey.GITHUB,
] as const

/** Connected data sources and the source types that can be added. */
export default function DataSourcePage() {
  const { t } = useTranslation()
  const { dataSourceInfo } = useDataSourceInfo()
  const { list, isFetching } = useListDataSource()
  const { handleDeleteAsync, deleteLoading } = useDeleteDataSource()
  const [deleting, setDeleting] = useState<{
    source: IDataSource
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

  // Connections of types this build no longer knows are left out, as before.
  const connected = list.filter((source) => dataSourceInfo[source.source])
  const addType = (id: DataSourceKey) =>
    showAddingModal({ id, ...dataSourceInfo[id] })

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await handleDeleteAsync(deleting.source.id)
      setDeleting(null)
    } catch {
      // The data source hook reports the failure; keep the dialog to retry.
    }
  }

  return (
    <>
      <SettingsTemplate description={t('datasource.description')} width="wide">
        {connected.length > 0 ? (
          <SettingSection
            title={t('datasource.addedSources')}
            description={t('datasource.connectedCount', {
              count: connected.length,
            })}
          >
            <ConnectedSources
              sources={connected}
              info={dataSourceInfo}
              onDelete={(source, returnFocus) =>
                setDeleting({ source, returnFocus })
              }
            />
          </SettingSection>
        ) : isFetching ? (
          <PageLoadingState compact className="min-h-40" />
        ) : (
          <EmptyStart
            ghost={false}
            className="min-h-0 px-0 pt-space-md pb-space-xl"
            illustration={
              <ConnectorStackIllustration
                icons={[
                  dataSourceInfo[START_PATHS[0]].icon,
                  dataSourceInfo[START_PATHS[1]].icon,
                  dataSourceInfo[START_PATHS[2]].icon,
                ]}
              />
            }
            title={t('datasource.emptyStart.title')}
            description={t('datasource.emptyTip')}
            paths={START_PATHS.map((id, index) => ({
              key: id,
              icon: dataSourceInfo[id].icon,
              iconClassName:
                'bg-sunken text-fg ring-1 ring-line-subtle ring-inset [&_img]:size-icon-md',
              title: dataSourceInfo[id].name,
              description: dataSourceInfo[id].description,
              cta: t('datasource.emptyStart.connect'),
              onSelect: () => addType(id),
              primary: index === 0,
            }))}
          />
        )}

        <SettingSection
          title={t('datasource.availableSources')}
          description={t('datasource.availableSourcesDescription')}
        >
          <div className="pt-space-xs">
            <ConnectorCatalog
              info={dataSourceInfo}
              onAdd={(source) => addType(source.id)}
            />
          </div>
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
