// src/components/environment/EnvironmentList.tsx
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Globe, Key, Plus, MoreHorizontal, Copy, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEnvironmentStore } from '@/stores/environmentStore'
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
  onEnvironmentSelect
}: EnvironmentListProps) {
  const { duplicateEnvironment, deleteEnvironment, loadEnvironments } = useEnvironmentStore()
  
  // 对话框状态
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedEnv, setSelectedEnv] = useState<EnvironmentSummary | null>(null)
  const [newEnvName, setNewEnvName] = useState('')
  
  // 下拉菜单状态
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set())
  const [dropdownPositions, setDropdownPositions] = useState<Record<string, { top: number, right: number }>>({})

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
    setOpenDropdowns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(envId)) {
        newSet.delete(envId)
      } else {
        newSet.clear() // 关闭其他的下拉菜单
        newSet.add(envId)
        
        // 计算按钮位置
        const rect = buttonElement.getBoundingClientRect()
        setDropdownPositions(prev => ({
          ...prev,
          [envId]: {
            top: rect.bottom + window.scrollY + 4,
            right: window.innerWidth - rect.right + window.scrollX
          }
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
      await duplicateEnvironment(selectedEnv.id, newEnvName.trim())
      toast.success('环境复制成功')
      await loadEnvironments() // 刷新环境列表
      setIsDuplicateDialogOpen(false)
      setSelectedEnv(null)
      setNewEnvName('')
    } catch (error) {
      console.error('复制环境失败:', error)
      toast.error('复制环境失败')
    }
  }

  // 执行删除环境
  const handleConfirmDelete = async () => {
    if (!selectedEnv) return

    try {
      await deleteEnvironment(selectedEnv.id)
      toast.success('环境删除成功')
      await loadEnvironments() // 刷新环境列表
      setIsDeleteDialogOpen(false)
      setSelectedEnv(null)
      
      // 如果删除的是当前选中的环境，清空选择
      if (selectedEnvironmentId === selectedEnv.id) {
        onEnvironmentSelect('global')
      }
    } catch (error) {
      console.error('删除环境失败:', error)
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
      'bg-cyan-500'
    ]
    
    const normalized = name.toLowerCase()
    const colorMap: Record<string, string> = {
      'production': 'bg-red-500',
      'prod': 'bg-red-500',
      'staging': 'bg-yellow-500',
      'stage': 'bg-yellow-500',
      'development': 'bg-blue-500',
      'dev': 'bg-blue-500',
      'test': 'bg-purple-500',
      'testing': 'bg-purple-500',
      'local': 'bg-green-500',
      'demo': 'bg-pink-500',
      '演示': 'bg-pink-500',
      '开发': 'bg-blue-500',
      '测试': 'bg-purple-500',
      '正式': 'bg-red-500',
      '体验': 'bg-orange-500',
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
    <div className="flex flex-col h-full">
      {/* 全局区域 */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">全局</h3>
        </div>
        
        <div
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50",
            selectedEnvironmentId === 'global' 
              ? "bg-primary/10 border border-primary/20" 
              : "bg-muted/20"
          )}
          onClick={() => onEnvironmentSelect('global')}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
            <Globe className="w-4 h-4 text-blue-600" />
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
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">环境</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onEnvironmentSelect('create-new')}
              title="创建新环境"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {environments.map((env, index) => (
              <div
                key={env.id}
                className={cn(
                  "group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 relative",
                  selectedEnvironmentId === env.id
                    ? "bg-primary/10 border border-primary/20"
                    : "bg-background"
                )}
                onClick={() => onEnvironmentSelect(env.id)}
              >
                {/* 彩色点 */}
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    getEnvironmentColor(env.name, index)
                  )}
                />

                {/* 环境图标 */}
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100">
                  <span className="text-sm font-semibold text-blue-700">
                    {env.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* 环境信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {env.name}
                    </span>
                    {env.is_default && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        默认
                      </Badge>
                    )}
                    {env.is_global && (
                      <Globe className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* 三个点菜单 - 悬停时显示 */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleDropdown(env.id, e.currentTarget)
                    }}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {environments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无环境</p>
              <p className="text-xs">点击上方 + 按钮创建环境</p>
            </div>
          )}
        </div>
      </div>
      
      {/* 复制环境对话框 */}
      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
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
            <Button variant="outline" onClick={() => setIsDuplicateDialogOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={handleConfirmDuplicate}
              disabled={!newEnvName.trim()}
            >
              <Copy className="w-4 h-4 mr-2" />
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
            <p className="text-sm text-muted-foreground mb-4">
              您确定要删除环境 <span className="font-medium text-foreground">"{selectedEnv?.name}"</span> 吗？
            </p>
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium mb-1">
                ⚠️ 此操作不可逆
              </p>
              <p className="text-xs text-destructive/80">
                删除环境将同时删除环境下的所有变量，请谨慎操作。
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Portal 渲染的下拉菜单 */}
      {openDropdowns.size > 0 && createPortal(
        <>
          {Array.from(openDropdowns).map((envId) => {
            const position = dropdownPositions[envId]
            const env = environments.find(e => e.id === envId)
            
            if (!position || !env) return null
            
            return (
              <div 
                key={envId}
                className="fixed w-40 bg-background border border-border rounded-md shadow-lg z-[9999]"
                style={{
                  top: position.top,
                  right: position.right
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="py-1">
                  <button 
                    onClick={() => handleDuplicateClick(env)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    复制
                  </button>
                  {!env.is_default && (
                    <button 
                      onClick={() => handleDeleteClick(env)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2 text-destructive hover:text-destructive"
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
        document.body
      )}
    </div>
  )
}
