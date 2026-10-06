import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ReferenceMetadataSettings } from '@/components/chat/reference-metadata-settings'
import type { CreateAppPageController } from '../hooks/use-create-app-page'

export function ChatReferenceSettings({
  controller,
}: {
  controller: CreateAppPageController
}) {
  const { config, handleConfigChange } = controller
  const { t } = useTranslation()
  const id = useId()
  return (
    <div className="space-y-space-base">
      <div className="flex items-center justify-between gap-space-base">
        <Label htmlFor={id}>{t('common.referenceMetadata.sources')}</Label>
        <Switch
          id={id}
          checked={config.do_refer === '1'}
          onCheckedChange={(checked) => {
            handleConfigChange('do_refer', checked ? '1' : '0')
            handleConfigChange('prompt_config', {
              ...config.prompt_config,
              quote: checked,
            })
          }}
        />
      </div>
      <ReferenceMetadataSettings
        datasetIds={config.kb_ids}
        value={config.prompt_config.reference_metadata}
        onChange={(reference_metadata) =>
          handleConfigChange('prompt_config', {
            ...config.prompt_config,
            reference_metadata,
          })
        }
      />
    </div>
  )
}
