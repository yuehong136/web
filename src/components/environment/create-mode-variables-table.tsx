import { useState } from 'react'
import { Copy, Trash2, Eye, EyeOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'

export interface CreateModeVariable {
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

// 创建模式下的变量表格（本地状态，未落库），从 EnvironmentDetail 抽出以控制文件体积。
export function CreateModeVariablesTable({
  variables,
  onVariablesChange,
}: CreateModeVariablesTableProps) {
  const [visibilityMap, setVisibilityMap] = useState<Record<string, boolean>>(
    {},
  )

  const toggleVisibility = (id: string) => {
    setVisibilityMap((prev) => ({ ...prev, [id]: !prev[id] }))
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
    onVariablesChange(variables.filter((v) => v.id !== id))
    toast.success('变量已移除')
  }

  return (
    <div className="px-6 pb-6">
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/30 border-b">
              <th className="p-3 text-left text-sm font-medium">变量名</th>
              <th className="p-3 text-left text-sm font-medium">类型</th>
              <th className="p-3 text-left text-sm font-medium">值</th>
              <th className="p-3 text-center text-sm font-medium">密钥</th>
              <th className="p-3 text-left text-sm font-medium">说明</th>
              <th className="p-3 text-center text-sm font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {variables.map((variable) => (
              <tr key={variable.id} className="hover:bg-muted/20 border-b">
                <td className="p-3">
                  <code className="font-mono text-sm">{variable.key_name}</code>
                </td>
                <td className="p-3">
                  <Badge variant="secondary" className="text-xs">
                    {variable.variable_type}
                  </Badge>
                </td>
                <td className="max-w-xs p-3">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate font-mono text-sm">
                      {variable.is_secret && !visibilityMap[variable.id]
                        ? '•'.repeat(Math.min(variable.key_value.length, 8))
                        : variable.key_value}
                    </code>
                    {variable.is_secret && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleVisibility(variable.id)}
                        className="h-8 w-8 p-0"
                      >
                        {visibilityMap[variable.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyValue(variable.key_value)}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
                <td className="p-3 text-center">
                  {variable.is_secret && (
                    <Badge variant="outline" className="text-xs">
                      密钥
                    </Badge>
                  )}
                </td>
                <td className="p-3">
                  <span className="truncate text-sm text-muted-foreground">
                    {variable.description || ''}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteVariable(variable.id)}
                    className="h-8 w-8 p-0 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
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
