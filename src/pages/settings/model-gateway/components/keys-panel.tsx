import { useState } from 'react'
import { KeyRound, Plus } from 'lucide-react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import type {
  GatewayKey,
  GatewayKeyCreated,
  GatewayModel,
} from '@/api/model-gateway'
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
  useRevokeGatewayKey,
  useUpdateGatewayKey,
} from '@/hooks/use-model-gateway-request'
import { getMutationErrorNotice } from '@/lib/mutation-error-feedback'
import { toast } from '@/lib/toast'
import {
  formatCount,
  formatInstant,
  gatewayErrorKey,
  limitSummary,
} from '../utils'
import { KeyFormDialog } from './key-form-dialog'
import { KeyRevealDialog } from '@/pages/settings/components/key-reveal-dialog'

interface KeysPanelProps {
  keys: GatewayKey[]
  models: GatewayModel[]
}

const STATUS_VARIANT = {
  active: 'success',
  disabled: 'secondary',
  revoked: 'destructive',
} as const

function scopeLabel(t: TFunction, key: GatewayKey, known: Set<string>): string {
  if (key.allow_all_models) return t('settings.modelGateway.keys.scopeAll')
  const count = key.allowed_model_ids.filter((id) => known.has(id)).length
  return count === 0
    ? t('settings.modelGateway.keys.scopeNone')
    : t('settings.modelGateway.keys.scopeCount', { value: count })
}

function quotaLabel(t: TFunction, key: GatewayKey): string | null {
  if (key.token_quota === null || key.quota_period === null) return null
  return t(`settings.modelGateway.quota.usage.${key.quota_period}`, {
    used: formatCount(key.quota_used ?? 0),
    quota: formatCount(key.token_quota),
  })
}

/** Gateway keys: who may call which models, within which limits. */
export const KeysPanel = ({ keys, models }: KeysPanelProps) => {
  const { t } = useTranslation()
  const updateMutation = useUpdateGatewayKey()
  const revokeMutation = useRevokeGatewayKey()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<GatewayKey | null>(null)
  const [pendingRevoke, setPendingRevoke] = useState<GatewayKey | null>(null)
  // The one-time plaintext stays in this component until the dialog closes.
  const [created, setCreated] = useState<GatewayKeyCreated | null>(null)
  const busy = updateMutation.isPending || revokeMutation.isPending
  const knownModels = new Set(models.map((model) => model.id))

  const openForm = (key: GatewayKey | null) => {
    setEditing(key)
    setFormOpen(true)
  }

  const toggle = async (key: GatewayKey) => {
    const activating = key.status !== 'active'
    try {
      await updateMutation.mutateAsync({
        id: key.id,
        input: { status: activating ? 'active' : 'disabled' },
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
        toast.error(t(gatewayErrorKey(error, 'key')))
    }
  }

  const confirmRevoke = async () => {
    if (!pendingRevoke) return
    try {
      await revokeMutation.mutateAsync(pendingRevoke.id)
      toast.success(t('settings.modelGateway.messages.revoked'))
      setPendingRevoke(null)
    } catch (error) {
      if (getMutationErrorNotice(error))
        toast.error(t(gatewayErrorKey(error, 'key')))
    }
  }

  const createButton = (
    <Button
      size="sm"
      leftIcon={<Plus className="size-icon-sm" aria-hidden="true" />}
      onClick={() => openForm(null)}
    >
      {t('settings.modelGateway.keys.create')}
    </Button>
  )

  return (
    <div className="space-y-space-base">
      <PageToolbar
        left={
          <p className="text-sm text-text-secondary">
            {t('settings.modelGateway.keys.intro')}
          </p>
        }
        right={createButton}
        wrap
      />

      {keys.length === 0 ? (
        <PageEmptyState
          title={t('settings.modelGateway.keys.empty')}
          description={t('settings.modelGateway.keys.emptyDescription')}
          icon={<KeyRound className="size-icon-lg" aria-hidden="true" />}
          action={createButton}
        />
      ) : (
        <Table wrapperClassName="rounded-radius-lg border border-border-subtle">
          <TableHeader className="bg-surface-secondary">
            <TableRow>
              <TableHead>{t('settings.modelGateway.common.name')}</TableHead>
              <TableHead>{t('settings.modelGateway.keys.key')}</TableHead>
              <TableHead>{t('settings.modelGateway.common.status')}</TableHead>
              <TableHead>{t('settings.modelGateway.keys.scope')}</TableHead>
              <TableHead>{t('settings.modelGateway.limits.title')}</TableHead>
              <TableHead>{t('settings.modelGateway.keys.expiresAt')}</TableHead>
              <TableHead>{t('settings.modelGateway.keys.lastUsed')}</TableHead>
              <TableHead className="text-right">
                {t('settings.modelGateway.common.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((key) => {
              const limits = limitSummary(t, key)
              const quota = quotaLabel(t, key)
              const revoked = key.status === 'revoked'
              return (
                <TableRow key={key.id}>
                  <TableCell>
                    <div className="text-sm font-medium text-text-primary">
                      {key.name}
                    </div>
                    {key.description ? (
                      <div className="text-sm text-text-tertiary">
                        {key.description}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-text-secondary">
                    {key.redacted_key}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[key.status]}>
                      {t(`settings.modelGateway.keyStatus.${key.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    {scopeLabel(t, key, knownModels)}
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    {limits || quota ? (
                      <>
                        {limits ? <div>{limits}</div> : null}
                        {quota ? <div>{quota}</div> : null}
                      </>
                    ) : (
                      t('settings.modelGateway.limits.none')
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    {formatInstant(key.expires_at) ??
                      t('settings.modelGateway.keys.neverExpires')}
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    {formatInstant(key.last_used_at) ??
                      t('settings.modelGateway.keys.neverUsed')}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-space-xs">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy || revoked}
                        onClick={() => openForm(key)}
                      >
                        {t('settings.modelGateway.common.edit')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy || revoked}
                        onClick={() => void toggle(key)}
                      >
                        {t(
                          key.status === 'active'
                            ? 'settings.modelGateway.common.disable'
                            : 'settings.modelGateway.common.enable',
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy || revoked}
                        onClick={() => setPendingRevoke(key)}
                      >
                        {t('settings.modelGateway.keys.revoke')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      {formOpen ? (
        <KeyFormDialog
          gatewayKey={editing}
          models={models}
          onOpenChange={setFormOpen}
          onCreated={setCreated}
        />
      ) : null}
      <KeyRevealDialog
        plaintext={created?.key ?? null}
        labels={{
          title: t('settings.modelGateway.keys.revealTitle', {
            name: created?.name ?? '',
          }),
          description: t('settings.modelGateway.keys.revealDescription'),
          usage: t('settings.modelGateway.keys.revealUsage'),
          done: t('settings.modelGateway.keys.revealDone'),
        }}
        onClose={() => setCreated(null)}
      />
      <ConfirmDialog
        variant="destructive"
        open={pendingRevoke !== null}
        onOpenChange={(open) => !open && setPendingRevoke(null)}
        title={t('settings.modelGateway.keys.revokeTitle')}
        description={t('settings.modelGateway.keys.revokeDescription', {
          name: pendingRevoke?.name ?? '',
        })}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('settings.modelGateway.keys.revoke')}
        pending={revokeMutation.isPending}
        onConfirm={() => void confirmRevoke()}
      />
    </div>
  )
}
