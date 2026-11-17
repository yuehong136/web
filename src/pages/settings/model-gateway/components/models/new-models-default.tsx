import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUpdateGatewaySettings } from '@/hooks/use-model-gateway-request'
import { getMutationErrorNotice } from '@/lib/mutation-error-feedback'
import { toast } from '@/lib/toast'
import { PREFIX, gatewayErrorKey } from '../../utils'

/**
 * Whether models registered from now on start open. Models without an
 * explicit switch keep their current state.
 */
export function NewModelsDefault({ enabled }: { enabled: boolean }) {
  const { t } = useTranslation()
  const mutation = useUpdateGatewaySettings()
  const change = async (value: string) => {
    const next = value === 'on'
    if (next === enabled) return
    try {
      await mutation.mutateAsync(next)
      toast.success(t(`${PREFIX}.messages.defaultChanged`))
    } catch (error) {
      if (getMutationErrorNotice(error))
        toast.error(t(gatewayErrorKey(error, 'catalog')))
    }
  }
  return (
    <div className="flex shrink-0 items-center gap-space-sm">
      <Label
        htmlFor="gateway-new-models-default"
        className="text-sm font-normal text-text-secondary"
      >
        {t(`${PREFIX}.models.newDefault`)}
      </Label>
      <Select
        value={enabled ? 'on' : 'off'}
        disabled={mutation.isPending}
        onValueChange={(value) => void change(value)}
      >
        <SelectTrigger
          id="gateway-new-models-default"
          className="min-h-[var(--control-height-sm)] w-36"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="on">
            {t(`${PREFIX}.models.newDefaultOn`)}
          </SelectItem>
          <SelectItem value="off">
            {t(`${PREFIX}.models.newDefaultOff`)}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
