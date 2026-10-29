import { useTranslation } from 'react-i18next'
import { modelProvidersAPI } from '@/api/llm-providers'
import { useModelProviderMutation } from '@/hooks/use-model-provider-request'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { InstanceModelEditor } from './instance-model-editor'

export function InstanceModelForm({
  provider,
  instance,
  close,
}: {
  provider: string
  instance: string
  close: () => void
}) {
  const { t } = useTranslation()
  const mutation = useModelProviderMutation()
  return (
    <Dialog
      open
      onOpenChange={(open) => !open && !mutation.isPending && close()}
    >
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{t('settings.models.instances.addModel')}</DialogTitle>
        </DialogHeader>
        <InstanceModelEditor
          pending={mutation.isPending}
          submitLabel={t('common.save')}
          onSubmit={async (model) => {
            await mutation.mutateAsync(async () =>
              modelProvidersAPI.addModel(provider, instance, model),
            )
            close()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
