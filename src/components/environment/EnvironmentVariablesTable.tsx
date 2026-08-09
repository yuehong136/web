// src/components/environment/EnvironmentVariablesTable.tsx
import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/lib/toast'
import { copyToClipboard } from '@/lib/utils'
import { useEnvironmentVariableMutations } from '@/hooks/use-environment-request'
import type {
  EnvironmentVariable,
  EnvironmentVariableCreate,
  VariableType,
} from '@/types/api'
import { SortableRow, type EditableVariable } from './sortable-variable-row'

interface EnvironmentVariablesTableProps {
  environmentId: string
  variables: EnvironmentVariable[]
  onVariablesChange: () => void
  onAddVariable?: () => void
  hideAddButton?: boolean
  hideAddDialog?: boolean
}

export function EnvironmentVariablesTable({
  environmentId,
  variables,
  onVariablesChange,
  onAddVariable,
  hideAddButton = false,
  hideAddDialog = false,
}: EnvironmentVariablesTableProps) {
  const { addVariable, updateVariable, deleteVariable } =
    useEnvironmentVariableMutations()

  const [editableVariables, setEditableVariables] = useState<
    EditableVariable[]
  >([])
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null)
  const [editingVariableId, setEditingVariableId] = useState<string | null>(
    null,
  )
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newVariable, setNewVariable] = useState<EnvironmentVariableCreate>({
    key_name: '',
    key_value: '',
    description: '',
    is_secret: false,
    variable_type: 'string' as VariableType,
  })

  // 初始化可编辑变量列表
  React.useEffect(() => {
    setEditableVariables(variables.map((v) => ({ ...v, _showValue: false })))
  }, [variables])

  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  )

  // 处理拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setEditableVariables((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        const newItems = [...items]
        const [movedItem] = newItems.splice(oldIndex, 1)
        newItems.splice(newIndex, 0, movedItem)

        return newItems
      })
    }
  }

  // 新增变量对话框
  const handleAddVariable = () => {
    setNewVariable({
      key_name: '',
      key_value: '',
      description: '',
      is_secret: false,
      variable_type: 'string' as VariableType,
    })
    setIsAddDialogOpen(true)
  }

  // 保存新变量
  const handleSaveNewVariable = async () => {
    if (!newVariable.key_name.trim()) {
      toast.error('变量名不能为空')
      return
    }

    // 验证变量名格式
    const nameRegex = /^[A-Za-z_][A-Za-z0-9_]*$/
    if (!nameRegex.test(newVariable.key_name)) {
      toast.error('变量名只能包含字母、数字和下划线，且不能以数字开头')
      return
    }

    // 检查变量名唯一性
    const existingVar = editableVariables.find(
      (v) => v.key_name === newVariable.key_name,
    )
    if (existingVar) {
      toast.error('变量名已存在')
      return
    }

    // 验证变量类型和值的一致性
    if (
      !validateVariableValue(newVariable.key_value, newVariable.variable_type)
    ) {
      toast.error('变量值与类型不匹配')
      return
    }

    try {
      await addVariable(environmentId, newVariable)
      toast.success('变量已添加')
      onVariablesChange()
      setIsAddDialogOpen(false)
    } catch (error) {
      toast.error('保存变量失败')
    }
  }

  // 开始编辑变量
  const handleEditVariable = (variableId: string) => {
    setEditingVariableId(variableId)
  }

  // 保存变量
  const handleSaveVariable = async (variableId: string) => {
    const variable = editableVariables.find((v) => v.id === variableId)
    if (!variable) return

    if (!variable.key_name.trim()) {
      toast.error('变量名不能为空')
      return
    }

    // 验证变量名格式
    const nameRegex = /^[A-Za-z_][A-Za-z0-9_]*$/
    if (!nameRegex.test(variable.key_name)) {
      toast.error('变量名只能包含字母、数字和下划线，且不能以数字开头')
      return
    }

    // 检查变量名唯一性
    const existingVar = editableVariables.find(
      (v) => v.key_name === variable.key_name && v.id !== variable.id,
    )
    if (existingVar) {
      toast.error('变量名已存在')
      return
    }

    // 验证变量类型和值的一致性
    if (!validateVariableValue(variable.key_value, variable.variable_type)) {
      toast.error('变量值与类型不匹配')
      return
    }

    try {
      const variableData: EnvironmentVariableCreate = {
        key_name: variable.key_name,
        key_value: variable.key_value,
        description: variable.description,
        is_secret: variable.is_secret,
        variable_type: variable.variable_type,
      }

      await updateVariable(environmentId, variable.id, variableData)
      toast.success('变量已更新')
      onVariablesChange()
      setEditingVariableId(null)
    } catch (error) {
      toast.error('保存变量失败')
    }
  }

  // 取消编辑
  const handleCancelEdit = () => {
    // 恢复原始数据
    setEditableVariables(variables.map((v) => ({ ...v, _showValue: false })))
    setEditingVariableId(null)
  }

  // 删除变量
  const handleDeleteVariable = async (variableId: string) => {
    try {
      await deleteVariable(environmentId, variableId)
      toast.success('变量已删除')
      onVariablesChange()
    } catch (error) {
      console.error('删除变量失败:', error)
      toast.error(
        `删除变量失败: ${error instanceof Error ? error.message : '未知错误'}`,
      )
    }
  }

  // 切换密码显示/隐藏
  const handleToggleVisibility = (variableId: string) => {
    setEditableVariables(
      editableVariables.map((v) =>
        v.id === variableId ? { ...v, _showValue: !v._showValue } : v,
      ),
    )
  }

  // 复制变量值
  const handleCopyValue = async (variable: EditableVariable) => {
    try {
      await copyToClipboard(variable.key_value)
      setCopiedVariable(variable.id)
      toast.success('变量值已复制到剪贴板')
      setTimeout(() => setCopiedVariable(null), 2000)
    } catch (error) {
      toast.error('复制失败')
    }
  }

  // 更新变量字段
  const handleFieldChange = (
    variableId: string,
    field: keyof EnvironmentVariable,
    value: any,
  ) => {
    setEditableVariables(
      editableVariables.map((v) =>
        v.id === variableId ? { ...v, [field]: value } : v,
      ),
    )
  }

  // 验证变量值类型
  const validateVariableValue = (
    value: string,
    type: VariableType,
  ): boolean => {
    switch (type) {
      case 'number':
        return !isNaN(Number(value)) && value.trim() !== ''
      case 'boolean':
        return ['true', 'false'].includes(value.toLowerCase())
      case 'string':
      default:
        return true
    }
  }

  return (
    <div className="space-y-4">
      {/* 表格头部 */}
      {!hideAddButton && (
        <div className="flex items-center justify-between px-6 pt-6">
          <div className="text-sm font-medium">
            环境变量 ({editableVariables.length})
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddVariable || handleAddVariable}
          >
            <Plus className="mr-1 h-4 w-4" />
            添加变量
          </Button>
        </div>
      )}

      {/* 变量表格 */}
      <div className="px-6 pb-6">
        {editableVariables.length === 0 ? (
          <div className="rounded-lg border py-12 text-center text-muted-foreground">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Plus className="h-6 w-6" />
            </div>
            <p className="mb-2 text-sm">暂无变量</p>
            <p className="text-xs">点击上方【添加变量】开始添加</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>变量名</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>本地值</TableHead>
                    <TableHead className="text-center">密钥</TableHead>
                    <TableHead>说明</TableHead>
                    <TableHead>操作</TableHead>
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
                        onEdit={() => handleEditVariable(variable.id)}
                        onSave={() => handleSaveVariable(variable.id)}
                        onCancel={handleCancelEdit}
                        onDelete={() => handleDeleteVariable(variable.id)}
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
      </div>

      {/* 新增变量对话框 */}
      {!hideAddDialog && (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>添加环境变量</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 px-6 pb-2">
              <div className="space-y-2">
                <Label
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  变量名 *
                </Label>
                <Input
                  value={newVariable.key_name}
                  onChange={(e) =>
                    setNewVariable({ ...newVariable, key_name: e.target.value })
                  }
                  placeholder="变量名"
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  类型
                </Label>
                <Select
                  value={newVariable.variable_type}
                  onValueChange={(value: string) =>
                    setNewVariable({
                      ...newVariable,
                      variable_type: value as VariableType,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">字符串</SelectItem>
                    <SelectItem value="number">数字</SelectItem>
                    <SelectItem value="boolean">布尔值</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  变量值
                </Label>
                <Input
                  value={newVariable.key_value}
                  onChange={(e) =>
                    setNewVariable({
                      ...newVariable,
                      key_value: e.target.value,
                    })
                  }
                  type={newVariable.is_secret ? 'password' : 'text'}
                  placeholder="变量值"
                  className="font-mono"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is-secret"
                  checked={newVariable.is_secret}
                  onCheckedChange={(checked) =>
                    setNewVariable({ ...newVariable, is_secret: checked })
                  }
                />
                <Label htmlFor="is-secret">密钥变量</Label>
              </div>

              <div className="space-y-2">
                <Label
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  说明（可选）
                </Label>
                <Textarea
                  value={newVariable.description}
                  onChange={(e) =>
                    setNewVariable({
                      ...newVariable,
                      description: e.target.value,
                    })
                  }
                  placeholder="变量说明"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  取消
                </Button>
                <Button onClick={handleSaveNewVariable}>添加</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
