// src/components/environment/NewEnvironmentManager.tsx
import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { useEnvironmentStore } from '@/stores/environmentStore'
import { EnvironmentList, EnvironmentDetail } from '@/components/environment'
import { toast } from '@/lib/toast'

interface NewEnvironmentManagerProps {
  isOpen: boolean
  onClose: () => void
}

export function NewEnvironmentManager({ isOpen, onClose }: NewEnvironmentManagerProps) {
  const {
    environments,
    globalEnvironments,
    currentEnvironment,
    loadEnvironments,
    loadGlobalEnvironments,
    loadEnvironment
  } = useEnvironmentStore()

  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // 初始化数据
  useEffect(() => {
    if (isOpen) {
      loadEnvironments()
      loadGlobalEnvironments()
    }
  }, [isOpen])

  // 当环境列表加载完成后，自动选择第一个环境
  useEffect(() => {
    if (isOpen && environments.length > 0 && !selectedEnvironmentId) {
      const defaultEnv = environments.find(env => env.is_default) || environments[0]
      handleEnvironmentSelect(defaultEnv.id)
    }
  }, [isOpen, environments.length, selectedEnvironmentId])

  const handleEnvironmentSelect = async (environmentId: string | 'global' | 'create-new') => {
    // 如果有未保存的更改，提示用户
    if (isDirty) {
      const confirmed = window.confirm('您有未保存的更改，确定要切换环境吗？')
      if (!confirmed) {
        return
      }
    }

    if (environmentId === 'global') {
      setSelectedEnvironmentId('global')
    } else if (environmentId === 'create-new') {
      setSelectedEnvironmentId('create-new')
      // 创建模式不需要加载环境详情
    } else {
      setSelectedEnvironmentId(environmentId)
      try {
        await loadEnvironment(environmentId)
      } catch (error) {
        console.error('加载环境详情失败:', error)
      }
    }
    setIsDirty(false)
  }

  const handleSave = async () => {
    if (!selectedEnvironmentId || selectedEnvironmentId === 'global') return
    
    setIsSaving(true)
    try {
      // 调用EnvironmentDetail暴露的保存方法
      if (typeof window !== 'undefined' && (window as any).__saveEnvironmentData) {
        await (window as any).__saveEnvironmentData()
        setIsDirty(false)
      } else {
        toast.error('保存功能暂不可用')
      }
    } catch (error) {
      console.error('环境保存失败:', error)
      toast.error('保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (isDirty) {
      const confirmed = window.confirm('您有未保存的更改，确定要关闭吗？')
      if (!confirmed) {
        return
      }
    }
    onClose()
    setIsDirty(false)
    setSelectedEnvironmentId(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl w-full h-[90vh] p-0 gap-0">
        <DialogHeader className="flex-row items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">环境管理</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
            >
              关闭
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isDirty || isSaving}
            >
              <Save className="w-4 h-4 mr-1" />
              {isSaving 
                ? (selectedEnvironmentId === 'create-new' ? '创建中...' : '保存中...') 
                : (selectedEnvironmentId === 'create-new' ? '创建' : '保存')
              }
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* 左侧环境列表 */}
          <div className="w-80 border-r bg-muted/20">
            <EnvironmentList
              environments={environments}
              globalEnvironments={globalEnvironments}
              selectedEnvironmentId={selectedEnvironmentId}
              onEnvironmentSelect={handleEnvironmentSelect}
            />
          </div>

          {/* 右侧环境详情 */}
          <div className="flex-1 overflow-hidden">
            {selectedEnvironmentId ? (
              <EnvironmentDetail
                environmentId={selectedEnvironmentId}
                currentEnvironment={currentEnvironment}
                onDataChange={setIsDirty}
                onSaveRequest={handleSave}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <p className="text-lg mb-2">请选择一个环境</p>
                  <p className="text-sm">从左侧列表中选择一个环境来查看和编辑其详细信息</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
