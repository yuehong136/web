import { useTranslation } from 'react-i18next'
import { MCPServerForm } from '@/components/mcp/MCPServerForm'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  ModalContent,
  ModalRoot,
  ModalTitle,
} from '@/components/ui/modal-primitives'
import { useDeleteMCPServer } from '@/hooks/use-mcp-request'
import type { MCPServer } from '@/types/mcp'

export type ServerDialogState =
  | { mode: 'create' }
  | { mode: 'edit'; server: MCPServer }
  | { mode: 'delete'; server: MCPServer }
  | null

/** The server form (create or edit) and the delete confirmation. */
export function MCPServerDialogs({
  state,
  returnFocus,
  onClose,
  onSaved,
  onDeleted,
}: {
  state: ServerDialogState
  /** The control that opened the dialog; kept after closing to restore focus. */
  returnFocus: HTMLElement | null
  onClose: () => void
  onSaved: () => void
  onDeleted: (serverId: string) => void
}) {
  const { t } = useTranslation()
  const deleteMutation = useDeleteMCPServer()
  const formOpen = state?.mode === 'create' || state?.mode === 'edit'
  const deleting = state?.mode === 'delete' ? state.server : null

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await deleteMutation.mutateAsync([deleting.id])
      onDeleted(deleting.id)
      onClose()
    } catch {
      // The domain mutation owns error feedback; keep the dialog for retry.
    }
  }

  return (
    <>
      <ModalRoot
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
      >
        <ModalContent returnFocus={returnFocus} aria-describedby={undefined}>
          <ModalTitle className="sr-only">
            {t(
              state?.mode === 'edit'
                ? 'mcp.servers.actions.edit'
                : 'mcp.servers.create',
            )}
          </ModalTitle>
          {formOpen ? (
            <MCPServerForm
              server={state.mode === 'edit' ? state.server : undefined}
              onSuccess={() => {
                onClose()
                onSaved()
              }}
              onCancel={onClose}
            />
          ) : null}
        </ModalContent>
      </ModalRoot>
      <ConfirmDialog
        variant="destructive"
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) onClose()
        }}
        title={t('mcp.servers.card.deleteTitle')}
        description={t('mcp.servers.deleteConfirm', { name: deleting?.name })}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('mcp.servers.card.confirmDelete')}
        pending={deleteMutation.isPending}
        returnFocus={returnFocus}
        onConfirm={() => void confirmDelete()}
      />
    </>
  )
}
