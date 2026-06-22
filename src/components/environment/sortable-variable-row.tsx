import {
  Eye,
  EyeOff,
  Copy,
  Check,
  GripVertical,
  Edit3,
  Trash2,
} from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
import { Badge } from '@/components/ui/badge'
import { TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { EnvironmentVariable, VariableType } from '@/types/api'

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
  onFieldChange: (field: keyof EnvironmentVariable, value: any) => void
  copiedVariable: string | null
}

// 可拖拽排序的变量行，从 EnvironmentVariablesTable 抽出以控制文件体积。
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: variable.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const displayValue =
    variable.is_secret && !variable._showValue
      ? '•'.repeat(Math.min(variable.key_value.length, 8))
      : variable.key_value

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && 'opacity-50', isEditing && 'bg-muted/50')}
    >
      {/* 拖拽手柄 */}
      <TableCell className="w-8">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab rounded p-1 hover:bg-muted active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>

      {/* 变量名 */}
      <TableCell className="font-mono">
        {isEditing ? (
          <Input
            value={variable.key_name}
            onChange={(e) => onFieldChange('key_name', e.target.value)}
            placeholder="变量名"
            className="h-8"
          />
        ) : (
          <span className="text-sm">{variable.key_name}</span>
        )}
      </TableCell>

      {/* 类型 */}
      <TableCell>
        {isEditing ? (
          <Select
            value={variable.variable_type}
            onValueChange={(value: string) =>
              onFieldChange('variable_type', value as VariableType)
            }
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="string">字符串</SelectItem>
              <SelectItem value="number">数字</SelectItem>
              <SelectItem value="boolean">布尔值</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Badge variant="secondary" className="text-xs">
            {variable.variable_type}
          </Badge>
        )}
      </TableCell>

      {/* 本地值 */}
      <TableCell className="max-w-xs">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <Input
              value={variable.key_value}
              onChange={(e) => onFieldChange('key_value', e.target.value)}
              type={
                variable.is_secret && !variable._showValue ? 'password' : 'text'
              }
              placeholder="变量值"
              className="h-8 font-mono text-sm"
            />
          ) : (
            <code className="flex-1 truncate font-mono text-sm">
              {displayValue}
            </code>
          )}

          {variable.is_secret && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleVisibility}
              className="h-8 w-8 p-0"
            >
              {variable._showValue ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onCopy}
            className="h-8 w-8 p-0"
          >
            {copiedVariable === variable.id ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </TableCell>

      {/* 密钥 */}
      <TableCell className="text-center">
        <Switch
          checked={variable.is_secret}
          onCheckedChange={(checked) => onFieldChange('is_secret', checked)}
          disabled={!isEditing}
        />
      </TableCell>

      {/* 说明 */}
      <TableCell className="max-w-xs">
        {isEditing ? (
          <Input
            value={variable.description}
            onChange={(e) => onFieldChange('description', e.target.value)}
            placeholder="说明（可选）"
            className="h-8"
          />
        ) : (
          <span className="truncate text-sm text-muted-foreground">
            {variable.description || ''}
          </span>
        )}
      </TableCell>

      {/* 操作 */}
      <TableCell>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={onCancel}>
                取消
              </Button>
              <Button size="sm" onClick={onSave}>
                保存
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-8 w-8 p-0"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
