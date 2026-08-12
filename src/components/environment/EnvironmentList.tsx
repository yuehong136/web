// src/components/environment/EnvironmentList.tsx
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Globe, Key, Plus, MoreHorizontal, Copy, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useDeleteEnvironment,
  useDuplicateEnvironment,
} from '@/hooks/use-environment-request'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import type { EnvironmentSummary, GlobalEnvironment } from '@/types/api'

interface EnvironmentListProps {
  environments: EnvironmentSummary[]
  globalEnvironments: GlobalEnvironment[]
  selectedEnvironmentId: string | null
  onEnvironmentSelect: (environmentId: string | 'global' | 'create-new') => void
}

export function EnvironmentList({
  environments,
  globalEnvironments,
  selectedEnvironmentId,
  onEnvironmentSelect,
}: EnvironmentListProps) {
  const { duplicateEnvironment } = useDuplicateEnvironment()
  const { deleteEnvironment } = useDeleteEnvironment()

  // 对话框状态
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedEnv, setSelectedEnv] = useState<EnvironmentSummary | null>(
    null,
  )
  const [newEnvName, setNewEnvName] = useState('')

  // 下拉菜单状态
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set())
  const [dropdownPositions, setDropdownPositions] = useState<
    Record<string, { top: number; right: number }>
  >({})

  // 处理点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdowns(new Set())
    }

    if (openDropdowns.size > 0) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [openDropdowns.size])

  // 切换下拉菜单显示
  const toggleDropdown = (envId: string, buttonElement: HTMLButtonElement) => {
    setOpenDropdowns((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(envId)) {
        newSet.delete(envId)
      } else {
        newSet.clear() // 关闭其他的下拉菜单
        newSet.add(envId)

        // 计算按钮位置
        const rect = buttonElement.getBoundingClientRect()
        setDropdownPositions((prev) => ({
          ...prev,
          [envId]: {
            top: rect.bottom + window.scrollY + 4,
            right: window.innerWidth - rect.right + window.scrollX,
          },
        }))
      }
      return newSet
    })
  }

  // 处理复制环境
  const handleDuplicateClick = (env: EnvironmentSummary) => {
    setSelectedEnv(env)
    setNewEnvName(`${env.name} 副本`)
    setIsDuplicateDialogOpen(true)
    setOpenDropdowns(new Set()) // 关闭下拉菜单
  }

  // 处理删除环境
  const handleDeleteClick = (env: EnvironmentSummary) => {
    setSelectedEnv(env)
    setIsDeleteDialogOpen(true)
    setOpenDropdowns(new Set()) // 关闭下拉菜单
  }

  // 执行复制环境
  const handleConfirmDuplicate = async () => {
    if (!selectedEnv || !newEnvName.trim()) return

    try {
      await duplicateEnvironment({
        id: selectedEnv.id,
        newName: newEnvName.trim(),
      })
      toast.success('环境复制成功')
      setIsDuplicateDialogOpen(false)
      setSelectedEnv(null)
      setNewEnvName('')
    } catch {
      toast.error('复制环境失败')
    }
  }

  // 执行删除环境
  const handleConfirmDelete = async () => {
    if (!selectedEnv) return

    try {
      await deleteEnvironment(selectedEnv.id)
      toast.success('环境删除成功')
      setIsDeleteDialogOpen(false)
      setSelectedEnv(null)

      // 如果删除的是当前选中的环境，清空选择
      if (selectedEnvironmentId === selectedEnv.id) {
        onEnvironmentSelect('global')
      }
    } catch {
      toast.error('删除环境失败')
    }
  }

  // 生成环境颜色
  const getEnvironmentColor = (name: string, index: number) => {
    const colors = [
      'bg-purple-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500',
    ]

    const normalized = name.toLowerCase()
    const colorMap: Record<string, string> = {
      production: 'bg-red-500',
      prod: 'bg-red-500',
      staging: 'bg-yellow-500',
      stage: 'bg-yellow-500',
      development: 'bg-blue-500',
      dev: 'bg-blue-500',
      test: 'bg-purple-500',
      testing: 'bg-purple-500',
      local: 'bg-green-500',
      demo: 'bg-pink-500',
      演示: 'bg-pink-500',
      开发: 'bg-blue-500',
      测试: 'bg-purple-500',
      正式: 'bg-red-500',
      体验: 'bg-orange-500',
    }

    // 检查是否有匹配的预定义颜色
    for (const [key, color] of Object.entries(colorMap)) {
      if (normalized.includes(key)) {
        return color
      }
    }

    // 否则使用循环颜色
    return colors[index % colors.length]
  }

  return (
    <div className="flex h-full flex-col">
      {/* 全局区域 */}
      <div className="border-b p-4">
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">全局</h3>
        </div>

        <div
          className={cn(
            'hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors',
            selectedEnvironmentId === 'global'
              ? 'border border-primary/20 bg-primary/10'
              : 'bg-muted/20',
          )}
          onClick={() => onEnvironmentSelect('global')}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
            <Globe className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">全局变量</div>
            <div className="text-xs text-muted-foreground">
              {globalEnvironments.length} 个变量
            </div>
          </div>
        </div>
      </div>

      {/* 环境列表 */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">环境</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEnvironmentSelect('create-new')}
              title="创建新环境"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {environments.map((env, index) => (
              <div
                key={env.id}
                className={cn(
                  'hover:bg-muted/50 group relative flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors',
                  selectedEnvironmentId === env.id
                    ? 'border border-primary/20 bg-primary/10'
                    : 'bg-background',
                )}
                onClick={() => onEnvironmentSelect(env.id)}
              >
                {/* 彩色点 */}
                <div
                  className={cn(
                    'h-2 w-2 rounded-full',
                    getEnvironmentColor(env.name, index),
                  )}
                />

                {/* 环境图标 */}
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100">
                  <span className="text-sm font-semibold text-blue-700">
                    {env.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* 环境信息 */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {env.name}
                    </span>
                    {env.is_default && (
                      <Badge variant="secondary" className="px-1 py-0 text-xs">
                        默认
                      </Badge>
                    )}
                    {env.is_global && (
                      <Globe className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* 三个点菜单 - 悬停时显示 */}
                <div className="opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleDropdown(env.id, e.currentTarget)
                    }}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {environments.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              <Key className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">暂无环境</p>
              <p className="text-xs">点击上方 + 按钮创建环境</p>
            </div>
          )}
        </div>
      </div>

      {/* 复制环境对话框 */}
      <Dialog
        open={isDuplicateDialogOpen}
        onOpenChange={setIsDuplicateDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>复制环境</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>原环境名称</Label>
              <Input
                value={selectedEnv?.name || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>新环境名称 *</Label>
              <Input
                value={newEnvName}
                onChange={(e) => setNewEnvName(e.target.value)}
                placeholder="请输入新环境名称"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDuplicateDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleConfirmDuplicate}
              disabled={!newEnvName.trim()}
            >
              <Copy className="mr-2 h-4 w-4" />
              复制
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除环境确认对话框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>确认删除环境</DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <p className="mb-4 text-sm text-muted-foreground">
              您确定要删除环境{' '}
              <span className="font-medium text-foreground">
                "{selectedEnv?.name}"
              </span>{' '}
              吗？
            </p>
            <div className="bg-destructive/10 border-destructive/20 rounded-lg border p-3">
              <p className="mb-1 text-sm font-medium text-destructive">
                ⚠️ 此操作不可逆
              </p>
              <p className="text-destructive/80 text-xs">
                删除环境将同时删除环境下的所有变量，请谨慎操作。
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              取消
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Portal 渲染的下拉菜单 */}
      {openDropdowns.size > 0 &&
        createPortal(
          <>
            {Array.from(openDropdowns).map((envId) => {
              const position = dropdownPositions[envId]
              const env = environments.find((e) => e.id === envId)

              if (!position || !env) return null

              return (
                <div
                  key={envId}
                  className="fixed z-[9999] w-40 rounded-md border border-border bg-background shadow-lg"
                  style={{
                    top: position.top,
                    right: position.right,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="py-1">
                    <button
                      onClick={() => handleDuplicateClick(env)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-muted"
                    >
                      <Copy className="h-4 w-4" />
                      复制
                    </button>
                    {!env.is_default && (
                      <button
                        onClick={() => handleDeleteClick(env)}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-destructive transition-colors hover:bg-muted hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        删除
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </>,
          document.body,
        )}
    </div>
  )
}
