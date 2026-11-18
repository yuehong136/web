import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Layers, Save } from 'lucide-react'
import { PageEmptyState } from '@/components/patterns/page-states'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useFetchEnvironment,
  useFetchEnvironments,
  useFetchGlobalEnvironments,
} from '@/hooks/use-environment-request'
import { toast } from '@/lib/toast'
import { EnvironmentDetail } from './EnvironmentDetail'
import { EnvironmentList } from './EnvironmentList'

interface NewEnvironmentManagerProps {
  isOpen: boolean
  onClose: () => void
}

type Selection = string | 'global' | 'create-new'
/** What to do once the user agrees to drop unsaved changes. */
type PendingLeave = { kind: 'select'; id: Selection } | { kind: 'close' }

/** Manage the request environments of the API reference. */
export function NewEnvironmentManager({
  isOpen,
  onClose,
}: NewEnvironmentManagerProps) {
  const { t } = useTranslation()
  const [selectedEnvironmentId, setSelectedEnvironmentId] =
    useState<Selection | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingLeave, setPendingLeave] = useState<PendingLeave | null>(null)
  const saveRef = useRef<(() => Promise<void>) | null>(null)

  // Server state comes from React Query, fetched only while open.
  const { environments } = useFetchEnvironments({ enabled: isOpen })
  const { globalEnvironments } = useFetchGlobalEnvironments({ enabled: isOpen })
  if (isOpen && environments.length > 0 && !selectedEnvironmentId) {
    setSelectedEnvironmentId(
      (environments.find((env) => env.is_default) || environments[0]).id,
    )
  }
  const detailEnvironmentId =
    selectedEnvironmentId &&
    selectedEnvironmentId !== 'global' &&
    selectedEnvironmentId !== 'create-new'
      ? selectedEnvironmentId
      : null
  const { environment: currentEnvironment } = useFetchEnvironment(
    detailEnvironmentId,
    { enabled: isOpen },
  )
  const selectedIndex = environments.findIndex(
    (env) => env.id === selectedEnvironmentId,
  )
  const isCreating = selectedEnvironmentId === 'create-new'

  const select = (environmentId: Selection) => {
    setSelectedEnvironmentId(environmentId)
    setIsDirty(false)
  }
  const close = () => {
    onClose()
    setIsDirty(false)
    setSelectedEnvironmentId(null)
  }

  const handleEnvironmentSelect = (environmentId: Selection) => {
    if (isDirty) setPendingLeave({ kind: 'select', id: environmentId })
    else select(environmentId)
  }
  const handleClose = () => {
    if (isDirty) setPendingLeave({ kind: 'close' })
    else close()
  }
  const discardAndLeave = () => {
    const leave = pendingLeave
    setPendingLeave(null)
    if (leave?.kind === 'select') select(leave.id)
    else if (leave) close()
  }

  const handleSave = async () => {
    if (!selectedEnvironmentId || selectedEnvironmentId === 'global') return
    if (!saveRef.current) {
      toast.error(t('environment.manager.saveUnavailable'))
      return
    }
    setIsSaving(true)
    try {
      await saveRef.current()
      setIsDirty(false)
    } catch {
      // The detail pane already reported the failure.
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent size="3xl" className="h-[90vh]">
        <DialogHeader className="border-b border-line-subtle">
          <DialogTitle>{t('environment.manager.title')}</DialogTitle>
          <DialogDescription>
            {t('environment.manager.description', {
              syntax: `{{${t('environment.resolve.variableName')}}}`,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <div className="max-h-56 shrink-0 overflow-y-auto border-b border-line-subtle bg-sunken md:max-h-none md:w-72 md:border-r md:border-b-0">
            <EnvironmentList
              environments={environments}
              globalEnvironments={globalEnvironments}
              selectedEnvironmentId={selectedEnvironmentId}
              onEnvironmentSelect={handleEnvironmentSelect}
            />
          </div>
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
            {selectedEnvironmentId ? (
              <EnvironmentDetail
                environmentId={selectedEnvironmentId}
                currentEnvironment={currentEnvironment}
                dotIndex={
                  selectedIndex >= 0 ? selectedIndex : environments.length
                }
                onDataChange={setIsDirty}
                saveRef={saveRef}
                onEnvironmentCreated={select}
              />
            ) : (
              <PageEmptyState
                compact
                icon={<Layers className="size-icon-lg" aria-hidden="true" />}
                title={t('environment.manager.selectTitle')}
                description={t('environment.manager.selectHint')}
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('common.close')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isDirty}
            loading={isSaving}
            leftIcon={<Save aria-hidden="true" />}
          >
            {t(
              isCreating
                ? 'environment.manager.create'
                : 'environment.manager.save',
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      <ConfirmDialog
        open={pendingLeave !== null}
        onOpenChange={(open) => {
          if (!open) setPendingLeave(null)
        }}
        variant="destructive"
        title={t('environment.manager.discardTitle')}
        description={t(
          pendingLeave?.kind === 'close'
            ? 'environment.manager.discardClose'
            : 'environment.manager.discardSwitch',
        )}
        confirmLabel={t('environment.manager.discardConfirm')}
        onConfirm={discardAndLeave}
      />
    </Dialog>
  )
}
