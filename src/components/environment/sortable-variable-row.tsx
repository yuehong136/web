import { useTranslation } from 'react-i18next'
import {
  Check,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  GripVertical,
  Trash2,
} from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { EnvironmentVariable, VariableType } from '@/types/api'
import { VARIABLE_TYPES, maskSecret } from './environment-variables'

export interface EditableVariable extends EnvironmentVariable {
  _isNew?: boolean
  _isEditing?: boolean
  _showValue?: boolean
}

interface SortableRowProps {
  variable: EditableVariable
  isEditing: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onDelete: () => void
  onToggleVisibility: () => void
  onCopy: () => void
  onFieldChange: <K extends keyof EnvironmentVariable>(
    field: K,
    value: EnvironmentVariable[K],
  ) => void
  copiedVariable: string | null
}

/** A saved variable row: drag to reorder, edit inline, reveal or copy the value. */
export function SortableRow({
  variable,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onToggleVisibility,
  onCopy,
  onFieldChange,
  copiedVariable,
}: SortableRowProps) {
  const { t } = useTranslation()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: variable.id })
  const name = variable.key_name
  const hidden = variable.is_secret && !variable._showValue

  return (
    <TableRow
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        isDragging && 'relative z-10 bg-raised opacity-80',
        isEditing && 'bg-fill-hover',
      )}
    >
      <TableCell className="w-8">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={t('environment.variables.dragHandle', { name })}
          className="flex cursor-grab items-center rounded-radius-sm p-space-2xs text-fg-subtle outline-hidden hover:bg-fill-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-line-focus active:cursor-grabbing"
        >
          <GripVertical className="size-icon-sm" aria-hidden="true" />
        </button>
      </TableCell>

      <TableCell className="font-mono">
        {isEditing ? (
          <Input
            inputSize="sm"
            value={variable.key_name}
            onChange={(event) => onFieldChange('key_name', event.target.value)}
            aria-label={t('environment.variables.columns.name')}
            placeholder={t('environment.variables.namePlaceholder')}
            spellCheck={false}
          />
        ) : (
          <span className="text-sm text-fg">{name}</span>
        )}
      </TableCell>

      <TableCell>
        {isEditing ? (
          <Select
            value={variable.variable_type}
            onValueChange={(value) =>
              onFieldChange('variable_type', value as VariableType)
            }
          >
            <SelectTrigger
              className="min-h-[var(--control-height-sm)]"
              aria-label={t('environment.variables.columns.type')}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VARIABLE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`environment.variables.types.${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge variant="secondary" className="font-mono">
            {variable.variable_type}
          </Badge>
        )}
      </TableCell>

      <TableCell className="max-w-xs">
        <div className="flex items-center gap-space-xs">
          {isEditing ? (
            <Input
              inputSize="sm"
              value={variable.key_value}
              onChange={(event) =>
                onFieldChange('key_value', event.target.value)
              }
              type={hidden ? 'password' : 'text'}
              aria-label={t('environment.variables.columns.localValue')}
              placeholder={t('environment.variables.valuePlaceholder')}
              className="font-mono"
              spellCheck={false}
              autoComplete="off"
            />
          ) : (
            <code className="min-w-0 flex-1 truncate font-mono text-sm text-fg">
              {hidden ? maskSecret(variable.key_value) : variable.key_value}
            </code>
          )}
          {variable.is_secret && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleVisibility}
              aria-label={t(
                variable._showValue
                  ? 'environment.variables.hide'
                  : 'environment.variables.show',
                { name },
              )}
              aria-pressed={Boolean(variable._showValue)}
            >
              {variable._showValue ? (
                <EyeOff aria-hidden="true" />
              ) : (
                <Eye aria-hidden="true" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onCopy}
            aria-label={t('environment.variables.copy', { name })}
          >
            {copiedVariable === variable.id ? (
              <Check className="text-success-fg" aria-hidden="true" />
            ) : (
              <Copy aria-hidden="true" />
            )}
          </Button>
        </div>
      </TableCell>

      <TableCell className="text-center">
        <Switch
          checked={variable.is_secret}
          onCheckedChange={(checked) => onFieldChange('is_secret', checked)}
          disabled={!isEditing}
          aria-label={t('environment.variables.secretToggle', { name })}
        />
      </TableCell>

      <TableCell className="max-w-xs">
        {isEditing ? (
          <Input
            inputSize="sm"
            value={variable.description ?? ''}
            onChange={(event) =>
              onFieldChange('description', event.target.value)
            }
            aria-label={t('environment.variables.columns.description')}
            placeholder={t('environment.variables.descriptionPlaceholder')}
          />
        ) : (
          <span className="line-clamp-2 text-sm text-fg-muted">
            {variable.description || ''}
          </span>
        )}
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-space-2xs">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={onCancel}>
                {t('common.cancel')}
              </Button>
              <Button size="sm" onClick={onSave}>
                {t('common.save')}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onEdit}
                aria-label={t('environment.variables.edit', { name })}
              >
                <Edit3 aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onDelete}
                aria-label={t('environment.variables.delete', { name })}
                className="text-danger-fg hover:bg-danger-soft hover:text-danger-fg"
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
