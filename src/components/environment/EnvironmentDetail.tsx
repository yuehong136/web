// src/components/environment/EnvironmentDetail.tsx
import React, { useState, useEffect } from 'react'
import { TestTube, Copy, Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EnvironmentVariablesTable } from '@/components/environment'
import { useEnvironmentStore } from '@/stores/environmentStore'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import type { Environment } from '@/types/api'

// 创建模式变量表格组件
interface CreateModeVariable {
  id: string
  key_name: string
  key_value: string
  description: string
  is_secret: boolean
  variable_type: 'string' | 'number' | 'boolean'
}

interface CreateModeVariablesTableProps {
  variables: CreateModeVariable[]
  onVariablesChange: (variables: CreateModeVariable[]) => void
}

function CreateModeVariablesTable({ variables, onVariablesChange }: CreateModeVariablesTableProps) {
  const [visibilityMap, setVisibilityMap] = useState<Record<string, boolean>>({})

  const toggleVisibility = (id: string) => {
    setVisibilityMap(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success('变量值已复制')
    } catch {
      toast.error('复制失败')
    }
  }

  const deleteVariable = (id: string) => {
    onVariablesChange(variables.filter(v => v.id !== id))
    toast.success('变量已移除')
  }

  return (
    <div className="px-6 pb-6">
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 text-sm font-medium">变量名</th>
              <th className="text-left p-3 text-sm font-medium">类型</th>
              <th className="text-left p-3 text-sm font-medium">值</th>
              <th className="text-center p-3 text-sm font-medium">密钥</th>
              <th className="text-left p-3 text-sm font-medium">说明</th>
              <th className="text-center p-3 text-sm font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {variables.map((variable) => (
              <tr key={variable.id} className="border-b hover:bg-muted/20">
                <td className="p-3">
                  <code className="text-sm font-mono">{variable.key_name}</code>
                </td>
                <td className="p-3">
                  <Badge variant="secondary" className="text-xs">
                    {variable.variable_type}
                  </Badge>
                </td>
                <td className="p-3 max-w-xs">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono truncate flex-1">
                      {variable.is_secret && !visibilityMap[variable.id] 
                        ? '•'.repeat(Math.min(variable.key_value.length, 8))
                        : variable.key_value
                      }
                    </code>
                    {variable.is_secret && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleVisibility(variable.id)}
                        className="w-8 h-8 p-0"
                      >
                        {visibilityMap[variable.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyValue(variable.key_value)}
                      className="w-8 h-8 p-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
                <td className="p-3 text-center">
                  {variable.is_secret && (
                    <Badge variant="outline" className="text-xs">密钥</Badge>
                  )}
                </td>
                <td className="p-3">
                  <span className="text-sm text-muted-foreground truncate">
                    {variable.description || ''}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteVariable(variable.id)}
                    className="w-8 h-8 p-0 text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface EnvironmentDetailProps {
  environmentId: string | 'global' | 'create-new'
  currentEnvironment: Environment | null
  onDataChange: (isDirty: boolean) => void
  onSaveRequest?: () => Promise<void>
  onEnvironmentCreated?: (environmentId: string) => void
}

interface EnvironmentFormData {
  name: string
  description: string
  base_url: string
  is_default: boolean
}

export function EnvironmentDetail({
  environmentId,
  currentEnvironment,
  onDataChange,
  onSaveRequest
}: EnvironmentDetailProps) {
  const { updateEnvironment, createEnvironment, resolveVariablesOnServer, addVariable, loadEnvironments } = useEnvironmentStore()
  
  // 判断是否为创建模式
  const isCreateMode = environmentId === 'create-new'
  const [formData, setFormData] = useState<EnvironmentFormData>({
    name: '',
    description: '',
    base_url: '',
    is_default: false
  })

  const [originalData, setOriginalData] = useState<EnvironmentFormData>({
    name: '',
    description: '',
    base_url: '',
    is_default: false
  })

  // 变量解析状态
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [previewText, setPreviewText] = useState('')
  const [resolveResult, setResolveResult] = useState<{
    resolved_text: string
    variables_used: string[]
    missing_variables: string[]
  } | null>(null)
  const [isResolving, setIsResolving] = useState(false)

  // 添加变量状态
  const [isAddVariableDialogOpen, setIsAddVariableDialogOpen] = useState(false)
  const [newVariable, setNewVariable] = useState<{
    key_name: string
    key_value: string
    description: string
    is_secret: boolean
    variable_type: 'string' | 'number' | 'boolean'
  }>({
    key_name: '',
    key_value: '',
    description: '',
    is_secret: false,
    variable_type: 'string'
  })

  // 创建模式下的变量列表
  const [createModeVariables, setCreateModeVariables] = useState<Array<{
    key_name: string
    key_value: string
    description: string
    is_secret: boolean
    variable_type: 'string' | 'number' | 'boolean'
    id: string // 临时ID
  }>>([])

  // 重置创建模式变量列表和对话框状态
  useEffect(() => {
    console.log('🔄 环境切换或模式变化，重置对话框状态', { environmentId, isCreateMode })
    
    if (isCreateMode) {
      setCreateModeVariables([])
    }
    
    // 环境切换时强制重置所有对话框状态
    setIsAddVariableDialogOpen(false)
    setIsPreviewDialogOpen(false)
    setResolveResult(null)
    
    console.log('✅ 所有对话框状态已重置')
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 只依赖 environmentId，避免切换时循环触发
  }, [environmentId])

  // 当环境数据变化时更新表单
  useEffect(() => {
    if (isCreateMode) {
      // 创建模式：初始化空表单
      const emptyData = {
        name: '',
        description: '',
        base_url: '',
        is_default: false
      }
      setFormData(emptyData)
      setOriginalData(emptyData)
    } else if (currentEnvironment && environmentId !== 'global') {
      // 编辑模式：加载环境数据
      const newData = {
        name: currentEnvironment.name || '',
        description: currentEnvironment.description || '',
        base_url: currentEnvironment.base_url || '',
        is_default: currentEnvironment.is_default || false
      }
      setFormData(newData)
      setOriginalData(newData)
    }
  }, [currentEnvironment, environmentId, isCreateMode])

  // 检查数据是否有变化
  const checkDirty = (newFormData: EnvironmentFormData) => {
    const isDirty = JSON.stringify(newFormData) !== JSON.stringify(originalData)
    onDataChange(isDirty)
    return isDirty
  }

  const handleFormChange = (field: keyof EnvironmentFormData, value: string | boolean) => {
    const newFormData = { ...formData, [field]: value }
    setFormData(newFormData)
    checkDirty(newFormData)
  }

  // 保存环境信息
  // eslint-disable-next-line react-hooks/exhaustive-deps -- 调用方 useEffect 在 line 463 显式依赖 environmentId，无需包 useCallback
  const saveEnvironmentData = async () => {
    if (environmentId === 'global') return

    try {
      if (isCreateMode) {
        // 创建模式：创建新环境
        if (!formData.name.trim()) {
          toast.error('环境名称不能为空')
          return
        }

        const createData = {
          name: formData.name,
          description: formData.description,
          base_url: formData.base_url,
          is_default: formData.is_default,
          is_global: false,
          variables: createModeVariables.map(v => ({
            key_name: v.key_name,
            key_value: v.key_value,
            description: v.description,
            is_secret: v.is_secret,
            variable_type: v.variable_type
          }))
        }

        await createEnvironment(createData)
        toast.success('环境创建成功')
        await loadEnvironments() // 刷新环境列表
        setOriginalData(formData)
        
        // 创建成功后，不需要特殊处理，环境列表会自动刷新
      } else {
        // 编辑模式：更新环境
        if (!currentEnvironment) return

        // 只提交有变更的字段
        const changedFields: any = {}
        if (formData.name !== originalData.name) changedFields.name = formData.name
        if (formData.description !== originalData.description) changedFields.description = formData.description
        if (formData.base_url !== originalData.base_url) changedFields.base_url = formData.base_url
        if (formData.is_default !== originalData.is_default) changedFields.is_default = formData.is_default

        if (Object.keys(changedFields).length > 0) {
          await updateEnvironment(currentEnvironment.id, changedFields)
          setOriginalData(formData)
          toast.success('环境信息已保存')
        } else {
          toast.success('没有变更需要保存')
        }
      }
    } catch (error) {
      console.error('保存环境信息失败:', error)
      toast.error(`保存环境信息失败: ${error instanceof Error ? error.message : '未知错误'}`)
      throw error
    }
  }


  // 打开通用变量解析测试
  const handleOpenVariableTest = () => {
    setPreviewText('')
    setResolveResult(null)
    setIsPreviewDialogOpen(true)
  }

  // 执行变量解析
  const performResolve = async (text: string) => {
    if (!text.trim()) return
    
    setIsResolving(true)
    try {
      if (isCreateMode) {
        // 创建模式：使用本地变量进行解析
        const variableMap: Record<string, string> = {}
        createModeVariables.forEach(v => {
          variableMap[v.key_name] = v.key_value
        })

        const resolvedText = text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
          return variableMap[key] !== undefined ? variableMap[key] : match
        })

        const usedVariables = Object.keys(variableMap).filter(key => text.includes(`{{${key}}}`))
        const allVariableRefs = [...text.matchAll(/\{\{(\w+)\}\}/g)].map(match => match[1])
        const missingVariables = allVariableRefs.filter(key => variableMap[key] === undefined)

        setResolveResult({
          resolved_text: resolvedText,
          variables_used: usedVariables,
          missing_variables: Array.from(new Set(missingVariables))
        })
        toast.success('变量解析完成')
      } else {
        // 编辑模式：使用服务器端解析
        const result = await resolveVariablesOnServer(currentEnvironment?.id || environmentId, text)
        setResolveResult(result)
        toast.success('变量解析完成')
      }
    } catch (error) {
      console.error('变量解析失败:', error)
      toast.error('变量解析失败')
      setResolveResult(null)
    } finally {
      setIsResolving(false)
    }
  }

  // 复制解析结果
  const copyResolvedText = async () => {
    if (!resolveResult?.resolved_text) return
    
    try {
      await navigator.clipboard.writeText(resolveResult.resolved_text)
      toast.success('已复制解析结果')
    } catch (error) {
      toast.error('复制失败')
    }
  }

  // 处理添加变量
  const handleAddVariable = () => {
    setNewVariable({
      key_name: '',
      key_value: '',
      description: '',
      is_secret: false,
      variable_type: 'string'
    })
    setIsAddVariableDialogOpen(true)
  }

  // 保存新变量
  const handleSaveNewVariable = async () => {
    if (!newVariable.key_name.trim()) {
      toast.error("变量名不能为空")
      return
    }

    // 验证变量名格式
    const nameRegex = /^[A-Za-z_][A-Za-z0-9_]*$/
    if (!nameRegex.test(newVariable.key_name)) {
      toast.error("变量名只能包含字母、数字和下划线，且不能以数字开头")
      return
    }

    if (isCreateMode) {
      // 创建模式：添加到本地变量列表
      // 检查变量名唯一性
      const existingVar = createModeVariables.find(v => v.key_name === newVariable.key_name)
      if (existingVar) {
        toast.error("变量名已存在")
        return
      }

      const newVar = {
        ...newVariable,
        id: `temp-${Date.now()}` // 临时ID
      }
      setCreateModeVariables([...createModeVariables, newVar])
      toast.success("变量已添加到列表")
      onDataChange(true) // 标记有变更
      setIsAddVariableDialogOpen(false)
    } else {
      // 编辑模式：直接调用API
      // 检查变量名唯一性
      const existingVar = currentEnvironment?.variables?.find(v => v.key_name === newVariable.key_name)
      if (existingVar) {
        toast.error("变量名已存在")
        return
      }

      try {
        await addVariable(currentEnvironment?.id || environmentId, newVariable)
        toast.success("变量已添加")
        onDataChange(true)
        setIsAddVariableDialogOpen(false)
      } catch (error) {
        console.error('添加变量失败:', error)
        toast.error("添加变量失败")
      }
    }
  }


  // 暴露保存方法给父组件
  React.useEffect(() => {
    if (onSaveRequest) {
      // 通过全局变量暴露保存方法
      (window as any).__saveEnvironmentData = saveEnvironmentData
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__saveEnvironmentData
      }
    }
  }, [onSaveRequest, saveEnvironmentData])

  // 验证base_url格式
  const isValidUrl = (url: string) => {
    if (!url) return true // 空值是允许的
    try {
      const parsed = new URL(url)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }

  // 如果是全局变量视图
  if (environmentId === 'global') {
    return (
      <div className="flex flex-col h-full">
        <div className="p-6 border-b bg-background">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
              <span className="text-blue-600 font-semibold">G</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold">全局变量</h1>
              <p className="text-sm text-muted-foreground">
                全局变量可在所有环境中使用
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          <Card>
            <CardHeader>
              <CardTitle>全局变量</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>全局变量管理功能开发中...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // 如果是创建新环境模式
  if (isCreateMode) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b bg-background">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <Input
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  className="text-xl font-semibold border-none px-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="新环境名称"
                />
              </div>
              <Textarea
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="环境描述（可选）"
                className="text-sm text-muted-foreground resize-none border-none px-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                rows={2}
              />
            </div>
            
            <div className="flex items-center gap-4">
              {/* 是否默认开关 */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => handleFormChange('is_default', checked)}
                />
                <Label htmlFor="is-default" className="text-sm">
                  默认环境
                </Label>
              </div>
              
              <Badge variant="secondary">新建</Badge>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* 前置 URL 卡片 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">前置 URL</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Input
                  id="base-url"
                  value={formData.base_url}
                  onChange={(e) => handleFormChange('base_url', e.target.value)}
                  placeholder="http://192.168.188.192:8123"
                  className={cn(
                    "font-mono text-sm",
                    !isValidUrl(formData.base_url) && formData.base_url && "border-red-500"
                  )}
                />
                {!isValidUrl(formData.base_url) && formData.base_url && (
                  <p className="text-xs text-red-500">
                    请输入有效的URL，如: http://192.168.188.192:8123
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  示例: http://192.168.188.192:8123 (不要以 / 结尾)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 环境变量表 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">环境变量</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenVariableTest}
                    disabled={createModeVariables.length === 0}
                  >
                    <TestTube className="w-4 h-4 mr-1" />
                    测试解析
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddVariable}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    添加变量
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {createModeVariables.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Plus className="w-6 h-6" />
                  </div>
                  <p className="text-sm mb-2">暂无变量</p>
                  <p className="text-xs">点击上方【添加变量】开始添加</p>
                </div>
              ) : (
                <CreateModeVariablesTable 
                  variables={createModeVariables}
                  onVariablesChange={(vars) => {
                    setCreateModeVariables(vars)
                    onDataChange(true) // 标记有变更
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>
        {/* 正式添加变量对话框（创建模式可见） */}
        <Dialog open={isAddVariableDialogOpen} onOpenChange={setIsAddVariableDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>添加环境变量</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>变量名 *</Label>
                <Input
                  value={newVariable.key_name}
                  onChange={(e) => setNewVariable({ ...newVariable, key_name: e.target.value })}
                  placeholder="变量名，如: bearer_token"
                  className="font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>类型</Label>
                  <Select
                    value={newVariable.variable_type}
                    onValueChange={(v) => setNewVariable({ ...newVariable, variable_type: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">string</SelectItem>
                      <SelectItem value="number">number</SelectItem>
                      <SelectItem value="boolean">boolean</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    id="is-secret"
                    checked={newVariable.is_secret}
                    onCheckedChange={(checked) => setNewVariable({ ...newVariable, is_secret: checked })}
                  />
                  <Label htmlFor="is-secret">密钥</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>变量值 *</Label>
                <Input
                  value={newVariable.key_value}
                  onChange={(e) => setNewVariable({ ...newVariable, key_value: e.target.value })}
                  placeholder="变量值"
                  className="font-mono"
                  type={newVariable.is_secret ? 'password' : 'text'}
                />
              </div>
              <div className="space-y-2">
                <Label>说明</Label>
                <Textarea
                  value={newVariable.description}
                  onChange={(e) => setNewVariable({ ...newVariable, description: e.target.value })}
                  placeholder="该变量的用途说明（可选）"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsAddVariableDialogOpen(false)}>取消</Button>
                <Button onClick={handleSaveNewVariable}>保存</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // 如果没有环境数据
  if (!currentEnvironment) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">
            {environmentId !== 'global' ? '加载环境数据中...' : '请选择一个环境'}
          </p>
          <p className="text-sm">
            {environmentId !== 'global' 
              ? '正在获取环境详细信息' 
              : '从左侧列表中选择一个环境来查看和编辑其详细信息'
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b bg-background">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <Input
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                className="text-xl font-semibold border-none px-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="环境名称"
              />
            </div>
            <Textarea
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder="环境描述（可选）"
              className="text-sm text-muted-foreground resize-none border-none px-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={2}
            />
          </div>
          
          <div className="flex items-center gap-4">
            {/* 是否默认开关 */}
            <div className="flex items-center space-x-2">
              <Switch
                id="is-default"
                checked={formData.is_default}
                onCheckedChange={(checked) => handleFormChange('is_default', checked)}
              />
              <Label htmlFor="is-default" className="text-sm">
                默认环境
              </Label>
            </div>
            
            {/* 全局标识 */}
            {currentEnvironment.is_global && (
              <Badge variant="outline">全局</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {/* 前置 URL 卡片 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">前置 URL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Input
                id="base-url"
                value={formData.base_url}
                onChange={(e) => handleFormChange('base_url', e.target.value)}
                placeholder="http://192.168.188.192:8123"
                className={cn(
                  "font-mono text-sm",
                  !isValidUrl(formData.base_url) && formData.base_url && "border-red-500"
                )}
              />
              {!isValidUrl(formData.base_url) && formData.base_url && (
                <p className="text-xs text-red-500">
                  请输入有效的URL，如: http://192.168.188.192:8123
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                示例: http://192.168.188.192:8123 (不要以 / 结尾)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 环境变量表 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">环境变量</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenVariableTest}
                >
                  <TestTube className="w-4 h-4 mr-1" />
                  测试解析
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddVariable}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  添加变量
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <EnvironmentVariablesTable
              environmentId={currentEnvironment.id}
              variables={currentEnvironment.variables || []}
              onVariablesChange={() => onDataChange(true)}
              hideAddButton={true}
              hideAddDialog={true}
            />
          </CardContent>
        </Card>
      </div>

      {/* 变量解析预览对话框 */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>变量解析预览</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {/* 输入文本 */}
            <div className="space-y-2">
              <Label>要解析的文本</Label>
              <Textarea
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="输入包含变量引用的文本，如: https://{{server_ip}}:{{port}}/api"
                className="font-mono text-sm min-h-[80px]"
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  变量格式：<code>{'{{变量名}}'}</code>
                </p>
                <Button
                  size="sm"
                  onClick={() => performResolve(previewText)}
                  disabled={!previewText.trim() || isResolving}
                >
                  {isResolving ? '解析中...' : '解析'}
                </Button>
              </div>
            </div>

            {/* 解析结果 */}
            {resolveResult && (
              <div className="space-y-4 pt-4 border-t">
                {/* 解析后的文本 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>解析结果</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyResolvedText}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      复制
                    </Button>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-md">
                    <code className="text-sm break-all">
                      {resolveResult.resolved_text}
                    </code>
                  </div>
                </div>

                {/* 使用的变量 */}
                {resolveResult.variables_used.length > 0 && (
                  <div className="space-y-2">
                    <Label>使用的变量</Label>
                    <div className="flex flex-wrap gap-1">
                      {resolveResult.variables_used.map(variable => (
                        <Badge key={variable} variant="secondary" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 缺失的变量 */}
                {resolveResult.missing_variables.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-destructive">缺失的变量</Label>
                    <div className="flex flex-wrap gap-1">
                      {resolveResult.missing_variables.map(variable => (
                        <Badge key={variable} variant="destructive" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-destructive">
                      这些变量在当前环境中不存在，解析时将保持原始格式
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 添加变量对话框（正式） */}
      <Dialog open={isAddVariableDialogOpen} onOpenChange={setIsAddVariableDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加环境变量</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>变量名 *</Label>
              <Input
                value={newVariable.key_name}
                onChange={(e) => setNewVariable({ ...newVariable, key_name: e.target.value })}
                placeholder="变量名，如: bearer_token"
                className="font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>类型</Label>
                <Select
                  value={newVariable.variable_type}
                  onValueChange={(v) => setNewVariable({ ...newVariable, variable_type: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">string</SelectItem>
                    <SelectItem value="number">number</SelectItem>
                    <SelectItem value="boolean">boolean</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  id="is-secret"
                  checked={newVariable.is_secret}
                  onCheckedChange={(checked) => setNewVariable({ ...newVariable, is_secret: checked })}
                />
                <Label htmlFor="is-secret">密钥</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>变量值 *</Label>
              <Input
                value={newVariable.key_value}
                onChange={(e) => setNewVariable({ ...newVariable, key_value: e.target.value })}
                placeholder="变量值"
                className="font-mono"
                type={newVariable.is_secret ? 'password' : 'text'}
              />
            </div>
            <div className="space-y-2">
              <Label>说明</Label>
              <Textarea
                value={newVariable.description}
                onChange={(e) => setNewVariable({ ...newVariable, description: e.target.value })}
                placeholder="该变量的用途说明（可选）"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsAddVariableDialogOpen(false)}>取消</Button>
              <Button onClick={handleSaveNewVariable}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
