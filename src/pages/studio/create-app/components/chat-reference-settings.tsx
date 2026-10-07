import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ReferenceMetadataSettings } from '@/components/chat/reference-metadata-settings'
import type { ConfigBindings } from './config-fields'

export function ChatReferenceSettings({ config, onChange }: ConfigBindings) {
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
            onChange('do_refer', checked ? '1' : '0')
            onChange('prompt_config', {
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
          onChange('prompt_config', {
            ...config.prompt_config,
            reference_metadata,
          })
        }
      />
    </div>
  )
}
