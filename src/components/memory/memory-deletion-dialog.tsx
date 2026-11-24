import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { v4 as uuid } from 'uuid'
import { toast } from 'sonner'
import { memoryAPI } from '@/api/memory'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useDeleteMemory } from '@/hooks/use-memory'
import {
  clearDeletedMemory,
  confirmedMemoryDeletion,
} from '@/hooks/memory-deletion-cache'
import {
  memoryRevisionKeys,
  memoryCommandErrorKey,
  useMemoryCapabilities,
  useMemoryCommand,
} from '@/hooks/use-memory-revisions'
import { MemoryOperationPanel } from './memory-operation-panel'
import type { Memory } from '@/types/memory'
import type { MemoryOperation } from '@/types/memory-revisions'

export function MemoryDeletionDialog({
  memory,
  onClose,
  onOperationStarted,
}: {
  memory: Memory
  onClose: () => void
  onOperationStarted?: (operationId: string) => void
}) {
  const { t } = useTranslation()
  const cache = useQueryClient()
  const capabilities = useMemoryCapabilities(memory.id)
  const legacy = useDeleteMemory()
  const deletion = useMemoryCommand(memory.id, (operationId: string) =>
    memoryAPI.revision.deleteBank(memory.id, operationId),
  )
  const [operationId, setOperationId] = useState('')
  const completing = useRef(false)
  const managed = capabilities.data?.revisions?.managed === true
  const coordinated = capabilities.data?.deletions?.supported === true
  const blocked =
    managed &&
    (capabilities.data?.revisions?.managed_delete_supported !== true ||
      capabilities.data.deletions?.supported !== true)
  const pending = legacy.isPending || deletion.isPending
  const completed = useCallback(
    async (operation: MemoryOperation) => {
      if (!confirmedMemoryDeletion(operation) || completing.current) return
      completing.current = true
      await clearDeletedMemory(cache, memory.id)
      toast.success(t('memory.deletion.completed'))
      onClose()
    },
    [cache, memory.id, onClose, t],
  )
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !pending && !operationId) onClose()
      }}
    >
      <AlertDialogContent className="max-h-screen overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('memory.deleteDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              coordinated
                ? 'memory.deletion.description'
                : 'memory.deleteDialog.description',
            )}
          </AlertDialogDescription>
          <p className="text-sm font-medium break-words text-fg">
            {memory.name}
          </p>
        </AlertDialogHeader>
        {blocked && (
          <Alert variant="warning">{t('memory.deletion.unavailable')}</Alert>
        )}
        {capabilities.isError && (
          <Alert variant="warning">
            {t('memory.revisions.capabilitiesFailed')}
          </Alert>
        )}
        {deletion.isError && (
          <Alert variant="warning">
            {t(memoryCommandErrorKey(deletion.error))}
          </Alert>
        )}
        {operationId && (
          <>
            <p className="text-xs text-fg-muted">
              {t('memory.deletion.keepOperation')}
            </p>
            <MemoryOperationPanel
              memoryId={memory.id}
              operationId={operationId}
              onRefresh={() => undefined}
              onStatus={completed}
            />
          </>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending || !!operationId}>
            {t('common.cancel')}
          </AlertDialogCancel>
          {!operationId && (
            <Button
              variant="destructive"
              disabled={
                pending ||
                capabilities.isPending ||
                capabilities.isError ||
                blocked
              }
              onClick={async (event) => {
                event.preventDefault()
                try {
                  if (!coordinated) {
                    await legacy.mutateAsync(memory.id)
                    onClose()
                    return
                  }
                  const id = `memory-delete-${uuid()}`
                  setOperationId(id)
                  onOperationStarted?.(id)
                  const operation = await deletion.mutateAsync(id)
                  cache.setQueryData(
                    memoryRevisionKeys.operation(memory.id, id),
                    operation,
                  )
                  await completed(operation)
                } catch {
                  /* Preserve the operation identity; never replay an uncertain command. */
                }
              }}
            >
              {t('common.delete')}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
