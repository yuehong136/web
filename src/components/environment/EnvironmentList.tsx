import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, Globe, Layers, MoreHorizontal, Plus, Trash2 } from 'lucide-react'
import { badgeVariants } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  useDeleteEnvironment,
  useDuplicateEnvironment,
} from '@/hooks/use-environment-request'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import type { EnvironmentSummary, GlobalEnvironment } from '@/types/api'
import { environmentDotClass } from './environment-color'

interface EnvironmentListProps {
  environments: EnvironmentSummary[]
  globalEnvironments: GlobalEnvironment[]
  selectedEnvironmentId: string | null
  onEnvironmentSelect: (environmentId: string | 'global' | 'create-new') => void
}

const rowClass = (selected: boolean) =>
  cn(
    'flex w-full min-w-0 items-center gap-space-sm rounded-radius-lg px-space-sm py-space-xs text-left outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-state-focus',
    selected
      ? 'bg-state-selected-bg text-state-selected-text'
      : 'text-text-primary hover:bg-state-hover',
  )

function SectionTitle({
  children,
  action,
}: {
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex min-h-8 items-center justify-between px-space-sm">
      <h3 className="text-xs font-medium text-text-tertiary">{children}</h3>
      {action}
    </div>
  )
}

/** The manager's left pane: global variables, then the environments. */
export function EnvironmentList({
  environments,
  globalEnvironments,
  selectedEnvironmentId,
  onEnvironmentSelect,
}: EnvironmentListProps) {
  const { t } = useTranslation()
  const { duplicateEnvironment, isLoading: duplicating } =
    useDuplicateEnvironment()
  const { deleteEnvironment, isLoading: deleting } = useDeleteEnvironment()

  const [duplicateSource, setDuplicateSource] =
    useState<EnvironmentSummary | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EnvironmentSummary | null>(
    null,
  )
  const [newEnvName, setNewEnvName] = useState('')
  const listId = useId()
  const nameInput = useRef<HTMLInputElement>(null)
  // The duplicate dialog opens on the new name, ready to edit.
  useEffect(() => {
    if (duplicateSource) nameInput.current?.select()
  }, [duplicateSource])

  const openDuplicate = (env: EnvironmentSummary) => {
    setDuplicateSource(env)
    setNewEnvName(t('environment.duplicate.copyName', { name: env.name }))
  }

  const confirmDuplicate = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!duplicateSource || !newEnvName.trim()) return
    try {
      await duplicateEnvironment({
        id: duplicateSource.id,
        newName: newEnvName.trim(),
      })
      toast.success(t('environment.duplicate.success'))
      setDuplicateSource(null)
      setNewEnvName('')
    } catch {
      toast.error(t('environment.duplicate.failed'))
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteEnvironment(deleteTarget.id)
      toast.success(t('environment.delete.success'))
      // Deleting the open environment falls back to the global view.
      if (selectedEnvironmentId === deleteTarget.id)
        onEnvironmentSelect('global')
      setDeleteTarget(null)
    } catch {
      toast.error(t('environment.delete.failed'))
    }
  }

  return (
    <nav
      aria-label={t('environment.list.label')}
      className="flex flex-col gap-space-base p-space-sm"
    >
      <div className="space-y-space-2xs">
        <SectionTitle>{t('environment.list.globalSection')}</SectionTitle>
        <button
          type="button"
          aria-current={selectedEnvironmentId === 'global' ? 'true' : undefined}
          onClick={() => onEnvironmentSelect('global')}
          className={rowClass(selectedEnvironmentId === 'global')}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-radius-md bg-status-info-subtle text-status-info">
            <Globe className="size-icon-sm" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">
              {t('environment.list.globalVariables')}
            </span>
            <span className="block text-xs text-text-tertiary">
              {t('environment.list.globalCount', {
                count: globalEnvironments.length,
              })}
            </span>
          </span>
        </button>
      </div>

      <div className="space-y-space-2xs">
        <SectionTitle
          action={
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEnvironmentSelect('create-new')}
              aria-label={t('environment.list.create')}
              title={t('environment.list.create')}
            >
              <Plus aria-hidden="true" />
            </Button>
          }
        >
          {t('environment.list.environments')}
        </SectionTitle>

        {environments.length === 0 ? (
          <div className="flex flex-col items-center gap-space-xs rounded-radius-lg border border-dashed border-border-default px-space-sm py-space-lg text-center">
            <Layers
              className="size-icon-lg text-text-tertiary"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-text-primary">
              {t('environment.list.empty')}
            </p>
            <p className="text-xs text-text-tertiary">
              {t('environment.list.emptyHint')}
            </p>
          </div>
        ) : (
          <ul className="space-y-space-2xs">
            {environments.map((env, index) => {
              const selected = selectedEnvironmentId === env.id
              const rowId = `${listId}-${index}`
              return (
                <li key={env.id} className="group relative">
                  <button
                    type="button"
                    aria-labelledby={`${rowId}-name${env.is_default ? ` ${rowId}-default` : ''}`}
                    aria-describedby={`${rowId}-meta`}
                    aria-current={selected ? 'true' : undefined}
                    onClick={() => onEnvironmentSelect(env.id)}
                    className={cn(rowClass(selected), 'pr-10')}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'size-2 shrink-0 rounded-radius-full',
                        environmentDotClass(env.name, index),
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-space-xs">
                        <span
                          id={`${rowId}-name`}
                          className="truncate text-sm font-medium"
                        >
                          {env.name}
                        </span>
                        {env.is_default && (
                          <span
                            id={`${rowId}-default`}
                            className={cn(
                              badgeVariants({ variant: 'secondary' }),
                              'px-space-xs',
                            )}
                          >
                            {t('environment.list.default')}
                          </span>
                        )}
                        {env.is_global && (
                          <Globe
                            className="size-icon-xs shrink-0 text-text-tertiary"
                            aria-label={t('environment.list.global')}
                          />
                        )}
                      </span>
                      <span
                        id={`${rowId}-meta`}
                        className="block truncate text-xs text-text-tertiary"
                      >
                        {env.base_url ||
                          t('environment.list.variableCount', {
                            count: env.variables_count ?? 0,
                          })}
                      </span>
                    </span>
                  </button>
                  <div className="absolute top-1/2 right-space-xs -translate-y-1/2 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none [@media(hover:none)]:opacity-100">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t('environment.list.actions', {
                            name: env.name,
                          })}
                        >
                          <MoreHorizontal aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="right">
                        <DropdownMenuItem onClick={() => openDuplicate(env)}>
                          <Copy aria-hidden="true" />
                          {t('environment.list.duplicate')}
                        </DropdownMenuItem>
                        {!env.is_default && (
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(env)}
                            className="text-status-error [&_svg]:text-status-error"
                          >
                            <Trash2 aria-hidden="true" />
                            {t('environment.list.delete')}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <Dialog
        open={duplicateSource !== null}
        onOpenChange={(open) => {
          if (!open) setDuplicateSource(null)
        }}
      >
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{t('environment.duplicate.title')}</DialogTitle>
          </DialogHeader>
          <form
            noValidate
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={confirmDuplicate}
          >
            <DialogBody className="space-y-space-base">
              <Input
                label={t('environment.duplicate.source')}
                value={duplicateSource?.name ?? ''}
                readOnly
                disabled
              />
              <Input
                label={t('environment.duplicate.name')}
                required
                value={newEnvName}
                onChange={(event) => setNewEnvName(event.target.value)}
                placeholder={t('environment.duplicate.namePlaceholder')}
                ref={nameInput}
              />
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDuplicateSource(null)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                loading={duplicating}
                disabled={!newEnvName.trim()}
                leftIcon={<Copy aria-hidden="true" />}
              >
                {t('environment.duplicate.confirm')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null)
        }}
        variant="destructive"
        icon={<Trash2 />}
        title={t('environment.delete.title')}
        description={t('environment.delete.description', {
          name: deleteTarget?.name ?? '',
        })}
        confirmLabel={t('environment.delete.confirm')}
        pending={deleting}
        onConfirm={confirmDelete}
      >
        <p className="rounded-radius-lg border border-status-error-border bg-status-error-subtle p-space-sm text-sm text-status-error">
          {t('environment.delete.warning')}
        </p>
      </ConfirmDialog>
    </nav>
  )
}
