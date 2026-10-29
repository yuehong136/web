import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function ProviderRegionField({
  provider,
  value,
  onChange,
  urls,
}: {
  provider: string
  value: string
  onChange: (value: string) => void
  urls?: Record<string, string>
}) {
  const { t } = useTranslation()
  const id = 'model-instance-region'
  return (
    <>
      <Label htmlFor={id}>{t('settings.models.instances.region')}</Label>
      {provider === 'Tongyi-Qianwen' ? (
        <>
          <Select value={value || 'cn'} onValueChange={onChange}>
            <SelectTrigger id={id} aria-describedby={`${id}-hint`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cn">
                {t('settings.models.regions.cn')}
              </SelectItem>
              <SelectItem value="intl">
                {t('settings.models.regions.intl')}
              </SelectItem>
            </SelectContent>
          </Select>
          <p
            id={`${id}-hint`}
            className="text-xs break-words text-text-secondary"
          >
            {t('settings.models.regions.endpointHint')}
            {urls?.[value || 'cn'] && (
              <span className="block">{urls[value || 'cn']}</span>
            )}
          </p>
        </>
      ) : (
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </>
  )
}
