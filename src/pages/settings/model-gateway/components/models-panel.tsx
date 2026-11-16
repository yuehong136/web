import { useState } from 'react'
import { Boxes, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { GatewayModel } from '@/api/model-gateway'
import { PageEmptyState, PageToolbar } from '@/components/patterns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useDeleteGatewayModel,
  useUpdateGatewayModel,
} from '@/hooks/use-model-gateway-request'
import { getMutationErrorNotice } from '@/lib/mutation-error-feedback'
import { toast } from '@/lib/toast'
import { gatewayErrorKey, limitSummary } from '../utils'
import { ModelFormDialog } from './model-form-dialog'

interface ModelsPanelProps {
  models: GatewayModel[]
}

/** Published models: the public names callers use, and what each points at. */
export const ModelsPanel = ({ models }: ModelsPanelProps) => {
  const { t } = useTranslation()
  const updateMutation = useUpdateGatewayModel()
  const deleteMutation = useDeleteGatewayModel()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<GatewayModel | null>(null)
  const [pendingDelete, setPendingDelete] = useState<GatewayModel | null>(null)
  const busy = updateMutation.isPending || deleteMutation.isPending

  const openForm = (model: GatewayModel | null) => {
    setEditing(model)
    setFormOpen(true)
  }

  const toggle = async (model: GatewayModel) => {
    const activating = model.status !== 'active'
    try {
      await updateMutation.mutateAsync({
        id: model.id,
        input: { status: activating ? 'active' : 'inactive' },
      })
      toast.success(
        t(
          activating
            ? 'settings.modelGateway.messages.enabled'
            : 'settings.modelGateway.messages.disabled',
        ),
      )
    } catch (error) {
      if (getMutationErrorNotice(error))
        toast.error(t(gatewayErrorKey(error, 'model')))
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    try {
      await deleteMutation.mutateAsync(pendingDelete.id)
      toast.success(t('settings.modelGateway.messages.deleted'))
      setPendingDelete(null)
    } catch (error) {
      if (getMutationErrorNotice(error))
        toast.error(t(gatewayErrorKey(error, 'model')))
    }
  }

  const publishButton = (
    <Button
      size="sm"
      leftIcon={<Plus className="size-icon-sm" aria-hidden="true" />}
      onClick={() => openForm(null)}
    >
      {t('settings.modelGateway.models.publish')}
    </Button>
  )

  return (
    <div className="space-y-space-base">
      <PageToolbar
        left={
          <p className="text-sm text-text-secondary">
            {t('settings.modelGateway.models.intro')}
          </p>
        }
        right={publishButton}
        wrap
      />

      {models.length === 0 ? (
        <PageEmptyState
          title={t('settings.modelGateway.models.empty')}
          description={t('settings.modelGateway.models.emptyDescription')}
          icon={<Boxes className="size-icon-lg" aria-hidden="true" />}
          action={publishButton}
        />
      ) : (
        <Table wrapperClassName="rounded-radius-lg border border-border-subtle">
          <TableHeader className="bg-surface-secondary">
            <TableRow>
              <TableHead>
                {t('settings.modelGateway.models.publicName')}
              </TableHead>
              <TableHead>{t('settings.modelGateway.models.target')}</TableHead>
              <TableHead>{t('settings.modelGateway.models.type')}</TableHead>
              <TableHead>{t('settings.modelGateway.common.status')}</TableHead>
              <TableHead>{t('settings.modelGateway.limits.title')}</TableHead>
              <TableHead className="text-right">
                {t('settings.modelGateway.common.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((model) => (
              <TableRow key={model.id}>
                <TableCell>
                  <div className="font-mono text-sm text-text-primary">
                    {model.name}
                  </div>
                  {model.description ? (
                    <div className="text-sm text-text-tertiary">
                      {model.description}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell className="text-sm text-text-secondary">
                  {model.target ? (
                    `${model.target.provider} / ${model.target.model_name}`
                  ) : (
                    <Badge variant="warning">
                      {t('settings.modelGateway.models.targetMissing')}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-text-secondary">
                  {t(`settings.modelGateway.modelTypes.${model.model_type}`, {
                    defaultValue: model.model_type,
                  })}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      model.status === 'active' ? 'success' : 'secondary'
                    }
                  >
                    {t(`settings.modelGateway.modelStatus.${model.status}`)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-text-secondary">
                  {limitSummary(t, model) ??
                    t('settings.modelGateway.limits.none')}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-space-xs">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => openForm(model)}
                    >
                      {t('settings.modelGateway.common.edit')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => void toggle(model)}
                    >
                      {t(
                        model.status === 'active'
                          ? 'settings.modelGateway.common.disable'
                          : 'settings.modelGateway.common.enable',
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => setPendingDelete(model)}
                    >
                      {t('common.delete')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {formOpen ? (
        <ModelFormDialog model={editing} onOpenChange={setFormOpen} />
      ) : null}
      <ConfirmDialog
        variant="destructive"
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={t('settings.modelGateway.models.deleteTitle')}
        description={t('settings.modelGateway.models.deleteDescription', {
          name: pendingDelete?.name ?? '',
        })}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.delete')}
        pending={deleteMutation.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
