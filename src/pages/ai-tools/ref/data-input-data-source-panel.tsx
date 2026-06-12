import React from 'react'
import { Button } from '@/components/vendor/ui/button'
import { Input } from '@/components/vendor/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { Database, Globe, Plus, Trash2, X } from 'lucide-react'

export interface DataSourceItem {
  id: string
  type: 'api' | 'database'
  name: string
  description?: string
  config: Record<string, any>
  status: 'connected' | 'disconnected' | 'error'
  createdAt: Date
}

export interface DataSourceFormState {
  name: string
  description: string
  apiUrl: string
  apiMethod: string
  apiHeaders: string
  dbType: string
  dbHost: string
  dbPort: string
  dbName: string
  dbUser: string
  dbPassword: string
  dbQuery: string
}

export const createEmptyDataSourceForm = (): DataSourceFormState => ({
  name: '',
  description: '',
  apiUrl: '',
  apiMethod: 'GET',
  apiHeaders: '',
  dbType: 'mysql',
  dbHost: '',
  dbPort: '',
  dbName: '',
  dbUser: '',
  dbPassword: '',
  dbQuery: '',
})

export interface DataSourcePanelProps {
  dataSources: DataSourceItem[]
  setDataSources: React.Dispatch<React.SetStateAction<DataSourceItem[]>>
  showAddDataSource: boolean
  setShowAddDataSource: (open: boolean) => void
  newDataSourceType: 'api' | 'database'
  setNewDataSourceType: (type: 'api' | 'database') => void
  newDataSourceForm: DataSourceFormState
  setNewDataSourceForm: React.Dispatch<
    React.SetStateAction<DataSourceFormState>
  >
}

// 数据源模式区块：自 DataInput.tsx 原样拆出（棘轮债务文件减行），状态仍由
// DataInput 持有，避免设置弹窗关闭卸载子树时丢失已添加的数据源
export const DataSourcePanel: React.FC<DataSourcePanelProps> = ({
  dataSources,
  setDataSources,
  showAddDataSource,
  setShowAddDataSource,
  newDataSourceType,
  setNewDataSourceType,
  newDataSourceForm,
  setNewDataSourceForm,
}) => {
  return (
    <div className="space-y-3">
      {/* 添加数据源按钮 */}
      {!showAddDataSource && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNewDataSourceType('api')
              setShowAddDataSource(true)
            }}
            className="gap-1.5"
          >
            <Globe className="h-3.5 w-3.5" />
            API 接口
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNewDataSourceType('database')
              setShowAddDataSource(true)
            }}
            className="gap-1.5"
          >
            <Database className="h-3.5 w-3.5" />
            数据库
          </Button>
        </div>
      )}

      {/* 添加数据源表单 */}
      {showAddDataSource && (
        <div className="bg-background-body-subtle space-y-3 rounded-lg border border-border-default p-4">
          <div className="flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-sm font-medium">
              {newDataSourceType === 'api' ? (
                <>
                  <Globe className="h-4 w-4" /> 添加 API 数据源
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" /> 添加数据库数据源
                </>
              )}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowAddDataSource(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-3">
            <div>
              <label className="mb-1 block text-xs text-text-secondary">
                名称
              </label>
              <Input
                value={newDataSourceForm.name}
                onChange={(e) =>
                  setNewDataSourceForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="数据源名称"
                className="h-8"
              />
            </div>

            {newDataSourceType === 'api' ? (
              <>
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">
                    API URL
                  </label>
                  <Input
                    value={newDataSourceForm.apiUrl}
                    onChange={(e) =>
                      setNewDataSourceForm((prev) => ({
                        ...prev,
                        apiUrl: e.target.value,
                      }))
                    }
                    placeholder="https://api.example.com/data"
                    className="h-8"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-text-secondary">
                      请求方法
                    </label>
                    <select
                      value={newDataSourceForm.apiMethod}
                      onChange={(e) =>
                        setNewDataSourceForm((prev) => ({
                          ...prev,
                          apiMethod: e.target.value,
                        }))
                      }
                      className="h-8 w-full rounded-md border border-input bg-background-body px-2 text-sm"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-text-secondary">
                      请求头 (JSON)
                    </label>
                    <Input
                      value={newDataSourceForm.apiHeaders}
                      onChange={(e) =>
                        setNewDataSourceForm((prev) => ({
                          ...prev,
                          apiHeaders: e.target.value,
                        }))
                      }
                      placeholder='{"Authorization": "..."}'
                      className="h-8 font-mono text-xs"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-text-secondary">
                      数据库类型
                    </label>
                    <select
                      value={newDataSourceForm.dbType}
                      onChange={(e) =>
                        setNewDataSourceForm((prev) => ({
                          ...prev,
                          dbType: e.target.value,
                        }))
                      }
                      className="h-8 w-full rounded-md border border-input bg-background-body px-2 text-sm"
                    >
                      <option value="mysql">MySQL</option>
                      <option value="postgresql">PostgreSQL</option>
                      <option value="mongodb">MongoDB</option>
                      <option value="sqlite">SQLite</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-text-secondary">
                      主机
                    </label>
                    <Input
                      value={newDataSourceForm.dbHost}
                      onChange={(e) =>
                        setNewDataSourceForm((prev) => ({
                          ...prev,
                          dbHost: e.target.value,
                        }))
                      }
                      placeholder="localhost"
                      className="h-8"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-text-secondary">
                      端口
                    </label>
                    <Input
                      value={newDataSourceForm.dbPort}
                      onChange={(e) =>
                        setNewDataSourceForm((prev) => ({
                          ...prev,
                          dbPort: e.target.value,
                        }))
                      }
                      placeholder="3306"
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-text-secondary">
                      数据库名
                    </label>
                    <Input
                      value={newDataSourceForm.dbName}
                      onChange={(e) =>
                        setNewDataSourceForm((prev) => ({
                          ...prev,
                          dbName: e.target.value,
                        }))
                      }
                      placeholder="database"
                      className="h-8"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-text-secondary">
                      用户名
                    </label>
                    <Input
                      value={newDataSourceForm.dbUser}
                      onChange={(e) =>
                        setNewDataSourceForm((prev) => ({
                          ...prev,
                          dbUser: e.target.value,
                        }))
                      }
                      placeholder="root"
                      className="h-8"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-text-secondary">
                      密码
                    </label>
                    <Input
                      type="password"
                      value={newDataSourceForm.dbPassword}
                      onChange={(e) =>
                        setNewDataSourceForm((prev) => ({
                          ...prev,
                          dbPassword: e.target.value,
                        }))
                      }
                      placeholder="••••••"
                      className="h-8"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">
                    查询语句
                  </label>
                  <Input
                    value={newDataSourceForm.dbQuery}
                    onChange={(e) =>
                      setNewDataSourceForm((prev) => ({
                        ...prev,
                        dbQuery: e.target.value,
                      }))
                    }
                    placeholder="SELECT * FROM table LIMIT 100"
                    className="h-8 font-mono text-xs"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddDataSource(false)}
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!newDataSourceForm.name) {
                  toast.error('请输入数据源名称')
                  return
                }
                const newSource: DataSourceItem = {
                  id: `ds-${Date.now()}`,
                  type: newDataSourceType,
                  name: newDataSourceForm.name,
                  description:
                    newDataSourceType === 'api'
                      ? newDataSourceForm.apiUrl
                      : `${newDataSourceForm.dbType}://${newDataSourceForm.dbHost}:${newDataSourceForm.dbPort}/${newDataSourceForm.dbName}`,
                  config:
                    newDataSourceType === 'api'
                      ? {
                          url: newDataSourceForm.apiUrl,
                          method: newDataSourceForm.apiMethod,
                          headers: newDataSourceForm.apiHeaders,
                        }
                      : {
                          type: newDataSourceForm.dbType,
                          host: newDataSourceForm.dbHost,
                          port: newDataSourceForm.dbPort,
                          database: newDataSourceForm.dbName,
                          user: newDataSourceForm.dbUser,
                          query: newDataSourceForm.dbQuery,
                        },
                  status: 'disconnected',
                  createdAt: new Date(),
                }
                setDataSources((prev) => [...prev, newSource])
                setShowAddDataSource(false)
                setNewDataSourceForm(createEmptyDataSourceForm())
                toast.success('数据源添加成功（后端接口待对接）')
              }}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              添加
            </Button>
          </div>
        </div>
      )}

      {/* 数据源列表 */}
      {dataSources.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary">
            已添加 {dataSources.length} 个数据源
          </p>
          <div className="max-h-40 space-y-2 overflow-auto">
            {dataSources.map((ds) => (
              <div
                key={ds.id}
                className="bg-background-body-subtle flex items-center justify-between rounded-lg border border-border-default p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      ds.type === 'api'
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-green-500/10 text-green-500',
                    )}
                  >
                    {ds.type === 'api' ? (
                      <Globe className="h-4 w-4" />
                    ) : (
                      <Database className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{ds.name}</p>
                    <p className="truncate text-xs text-text-secondary">
                      {ds.description}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      ds.status === 'connected' &&
                        'border-green-500 text-green-500',
                      ds.status === 'disconnected' &&
                        'border-muted-foreground text-text-secondary',
                      ds.status === 'error' &&
                        'border-destructive text-destructive',
                    )}
                  >
                    {ds.status === 'connected'
                      ? '已连接'
                      : ds.status === 'error'
                        ? '错误'
                        : '未连接'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() =>
                      setDataSources((prev) =>
                        prev.filter((d) => d.id !== ds.id),
                      )
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {dataSources.length === 0 && !showAddDataSource && (
        <div className="py-6 text-center text-text-secondary">
          <Database className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p className="text-sm">暂无数据源</p>
          <p className="mt-1 text-xs">点击上方按钮添加 API 或数据库数据源</p>
        </div>
      )}
    </div>
  )
}
