import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from '@/lib/toast'
import { copyToClipboard } from '@/lib/utils'
import { useEnvironmentVariableMutations } from '@/hooks/use-environment-request'
import type { EnvironmentVariable } from '@/types/api'
import { AddVariableDialog } from './add-variable-dialog'
import { VariablesEmpty } from './environment-detail-sections'
import {
  variableDraftProblem,
  type VariableDraft,
} from './environment-variables'
import { SortableRow, type EditableVariable } from './sortable-variable-row'

interface EnvironmentVariablesTableProps {
  environmentId: string
  variables: EnvironmentVariable[]
  onVariablesChange: () => void
  onAddVariable?: () => void
  hideAddButton?: boolean
  hideAddDialog?: boolean
}

const asEditable = (variables: EnvironmentVariable[]): EditableVariable[] =>
  variables.map((variable) => ({ ...variable, _showValue: false }))

/** Saved variables of an environment: inline edit, reorder, reveal, copy, delete. */
export function EnvironmentVariablesTable({
  environmentId,
  variables,
  onVariablesChange,
  onAddVariable,
  hideAddButton = false,
  hideAddDialog = false,
}: EnvironmentVariablesTableProps) {
  const { t } = useTranslation()
  const { addVariable, updateVariable, deleteVariable } =
    useEnvironmentVariableMutations()

  const [editableVariables, setEditableVariables] = useState(() =>
    asEditable(variables),
  )
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null)
  const [editingVariableId, setEditingVariableId] = useState<string | null>(
    null,
  )
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<EditableVariable | null>(
    null,
  )
  const [deleting, setDeleting] = useState(false)
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )
  useEffect(() => () => clearTimeout(copiedTimer.current), [])

  // Fresh server data replaces local edits and order.
  const [shownVariables, setShownVariables] = useState(variables)
  if (shownVariables !== variables) {
    setShownVariables(variables)
    setEditableVariables(asEditable(variables))
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    setEditableVariables((items) =>
      arrayMove(
        items,
        items.findIndex((item) => item.id === active.id),
        items.findIndex((item) => item.id === over.id),
      ),
    )
  }

  const handleSaveNewVariable = async (draft: VariableDraft) => {
    const problem = variableDraftProblem(
      draft,
      editableVariables.map((variable) => variable.key_name),
    )
    if (problem) {
      toast.error(t(`environment.variables.${problem}`))
      return
    }
    try {
      await addVariable(environmentId, draft)
      toast.success(t('environment.variables.added'))
      onVariablesChange()
      setIsAddDialogOpen(false)
    } catch {
      toast.error(t('environment.variables.saveFailed'))
    }
  }

  const handleSaveVariable = async (variableId: string) => {
    const variable = editableVariables.find((v) => v.id === variableId)
    if (!variable) return
    const problem = variableDraftProblem(
      variable,
      editableVariables
        .filter((other) => other.id !== variable.id)
        .map((other) => other.key_name),
    )
    if (problem) {
      toast.error(t(`environment.variables.${problem}`))
      return
    }
    try {
      await updateVariable(environmentId, variable.id, {
        key_name: variable.key_name,
        key_value: variable.key_value,
        description: variable.description,
        is_secret: variable.is_secret,
        variable_type: variable.variable_type,
      })
      toast.success(t('environment.variables.updated'))
      onVariablesChange()
      setEditingVariableId(null)
    } catch {
      toast.error(t('environment.variables.saveFailed'))
    }
  }

  const handleCancelEdit = () => {
    setEditableVariables(asEditable(variables))
    setEditingVariableId(null)
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteVariable(environmentId, pendingDelete.id)
      toast.success(t('environment.variables.deleted'))
      setPendingDelete(null)
      onVariablesChange()
    } catch {
      toast.error(t('environment.variables.deleteFailed'))
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleVisibility = (variableId: string) =>
    setEditableVariables((items) =>
      items.map((v) =>
        v.id === variableId ? { ...v, _showValue: !v._showValue } : v,
      ),
    )

  const handleCopyValue = async (variable: EditableVariable) => {
    try {
      await copyToClipboard(variable.key_value)
      setCopiedVariable(variable.id)
      toast.success(t('environment.variables.copied'))
      clearTimeout(copiedTimer.current)
      copiedTimer.current = setTimeout(() => setCopiedVariable(null), 2000)
    } catch {
      toast.error(t('environment.variables.copyFailed'))
    }
  }

  const handleFieldChange = <K extends keyof EnvironmentVariable>(
    variableId: string,
    field: K,
    value: EnvironmentVariable[K],
  ) =>
    setEditableVariables((items) =>
      items.map((v) => (v.id === variableId ? { ...v, [field]: value } : v)),
    )

  return (
    <div className="space-y-space-sm">
      {!hideAddButton && (
        <div className="flex items-center justify-between gap-space-sm">
          <p className="text-sm font-medium text-fg">
            {t('environment.variables.count', {
              count: editableVariables.length,
            })}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddVariable || (() => setIsAddDialogOpen(true))}
            leftIcon={<Plus aria-hidden="true" />}
          >
            {t('environment.detail.addVariable')}
          </Button>
        </div>
      )}

      {editableVariables.length === 0 ? (
        <VariablesEmpty />
      ) : (
        <div className="overflow-hidden rounded-radius-lg border border-line-subtle">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <span className="sr-only">
                      {t('environment.variables.columns.drag')}
                    </span>
                  </TableHead>
                  <TableHead>
                    {t('environment.variables.columns.name')}
                  </TableHead>
                  <TableHead>
                    {t('environment.variables.columns.type')}
                  </TableHead>
                  <TableHead>
                    {t('environment.variables.columns.localValue')}
                  </TableHead>
                  <TableHead className="text-center">
                    {t('environment.variables.columns.secret')}
                  </TableHead>
                  <TableHead>
                    {t('environment.variables.columns.description')}
                  </TableHead>
                  <TableHead>
                    {t('environment.variables.columns.actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext
                  items={editableVariables.map((v) => v.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {editableVariables.map((variable) => (
                    <SortableRow
                      key={variable.id}
                      variable={variable}
                      isEditing={editingVariableId === variable.id}
                      onEdit={() => setEditingVariableId(variable.id)}
                      onSave={() => handleSaveVariable(variable.id)}
                      onCancel={handleCancelEdit}
                      onDelete={() => setPendingDelete(variable)}
                      onToggleVisibility={() =>
                        handleToggleVisibility(variable.id)
                      }
                      onCopy={() => handleCopyValue(variable)}
                      onFieldChange={(field, value) =>
                        handleFieldChange(variable.id, field, value)
                      }
                      copiedVariable={copiedVariable}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
        </div>
      )}

      {!hideAddDialog && (
        <AddVariableDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSubmit={handleSaveNewVariable}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setPendingDelete(null)
        }}
        variant="destructive"
        icon={<Trash2 />}
        title={t('environment.variables.deleteTitle')}
        description={t('environment.variables.deleteDescription', {
          name: pendingDelete?.key_name ?? '',
        })}
        confirmLabel={t('environment.list.delete')}
        pending={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
