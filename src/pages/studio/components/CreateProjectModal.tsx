/**
 * 创建项目类型选择弹窗
 * 现代化 AI 产品风格设计
 */

import React, { useState } from 'react'
import { Sparkles, Bot, ArrowRight, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { STUDIO_TEXTS } from '@/constants/studio-texts'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateProject: (type: 'app' | 'agent') => void
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const [selectedType, setSelectedType] = useState<'app' | 'agent' | null>(null)

  const projectTypes = [
    {
      type: 'app' as const,
      title: STUDIO_TEXTS.projectType.appTitle,
      description: STUDIO_TEXTS.projectType.appDescription,
      icon: Sparkles,
      features: STUDIO_TEXTS.projectType.appFeatures,
      gradientFrom: 'from-violet-500',
      gradientTo: 'to-purple-600',
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-500',
      ringColor: 'ring-violet-500',
      checkBg: 'bg-violet-500',
    },
    {
      type: 'agent' as const,
      title: STUDIO_TEXTS.projectType.agentTitle,
      description: STUDIO_TEXTS.projectType.agentDescription,
      icon: Bot,
      features: STUDIO_TEXTS.projectType.agentFeatures,
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-cyan-500',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      ringColor: 'ring-blue-500',
      checkBg: 'bg-blue-500',
    },
  ]

  const handleConfirm = () => {
    if (selectedType) {
      onCreateProject(selectedType)
      setSelectedType(null)
    }
  }

  const handleClose = () => {
    setSelectedType(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent size="lg" className="overflow-hidden">
        <DialogHeader className="pb-0">
          <DialogTitle className="text-xl font-semibold text-text-primary">
            {STUDIO_TEXTS.projectType.title}
          </DialogTitle>
          <DialogDescription className="text-text-secondary">
            {STUDIO_TEXTS.projectType.description}
          </DialogDescription>
        </DialogHeader>

        {/* 内容区域 */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projectTypes.map((projectType) => {
              const Icon = projectType.icon
              const isSelected = selectedType === projectType.type
              
              return (
                <div
                  key={projectType.type}
                  onClick={() => setSelectedType(projectType.type)}
                  className={cn(
                    'group relative rounded-2xl p-5 cursor-pointer transition-all duration-200',
                    'border-2',
                    isSelected
                      ? `border-transparent ring-2 ${projectType.ringColor} bg-[var(--color-surface-secondary)]`
                      : 'border-border-default hover:border-border-hover hover:bg-[var(--color-surface-secondary)]/50'
                  )}
                >
                  {/* 选中标记 */}
                  {isSelected && (
                    <div className={cn(
                      'absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center',
                      projectType.checkBg
                    )}>
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  )}

                  {/* 图标 */}
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                    'bg-gradient-to-br',
                    projectType.gradientFrom,
                    projectType.gradientTo,
                    'shadow-lg',
                    isSelected ? 'scale-110' : 'group-hover:scale-105',
                    'transition-transform duration-200'
                  )}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* 标题 */}
                  <h3 className={cn(
                    'text-base font-semibold mb-2 transition-colors',
                    isSelected ? 'text-text-primary' : 'text-text-primary group-hover:text-text-primary'
                  )}>
                    {projectType.title}
                  </h3>

                  {/* 描述 */}
                  <p className="text-sm text-text-secondary leading-relaxed mb-4">
                    {projectType.description}
                  </p>

                  {/* 特性标签 */}
                  <div className="flex flex-wrap gap-1.5">
                    {projectType.features.map((feature, index) => (
                      <span
                        key={index}
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-md text-xs',
                          'bg-[var(--color-surface-tertiary)] text-text-secondary'
                        )}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 提示文字 */}
          <p className="text-xs text-text-tertiary text-center mt-5">
            {STUDIO_TEXTS.projectType.tip}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedType}
            className="gap-1.5"
          >
            继续
            <ArrowRight className="w-4 h-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
