/**
 * 创建项目类型选择弹窗
 * 使用设计令牌重写
 */

import React from 'react'
import { Sparkles, Bot, ArrowRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
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
  const projectTypes = [
    {
      type: 'app' as const,
      title: STUDIO_TEXTS.projectType.appTitle,
      description: STUDIO_TEXTS.projectType.appDescription,
      icon: Sparkles,
      iconColor: 'text-components-badge-purple-text',
      bgColor: 'bg-components-avatar-gradient-purple-from/10',
      hoverBorder: 'hover:border-components-avatar-gradient-purple-from',
      features: STUDIO_TEXTS.projectType.appFeatures,
      dotColor: 'bg-components-avatar-gradient-purple-from',
    },
    {
      type: 'agent' as const,
      title: STUDIO_TEXTS.projectType.agentTitle,
      description: STUDIO_TEXTS.projectType.agentDescription,
      icon: Bot,
      iconColor: 'text-components-badge-blue-text',
      bgColor: 'bg-components-avatar-gradient-blue-from/10',
      hoverBorder: 'hover:border-components-avatar-gradient-blue-from',
      features: STUDIO_TEXTS.projectType.agentFeatures,
      dotColor: 'bg-components-avatar-gradient-blue-from',
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-text-primary">
            {STUDIO_TEXTS.projectType.title}
          </DialogTitle>
          <DialogDescription className="text-text-secondary">
            {STUDIO_TEXTS.projectType.description}
          </DialogDescription>
        </DialogHeader>

        {/* 项目类型选择 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {projectTypes.map((projectType) => {
            const Icon = projectType.icon
            return (
              <div
                key={projectType.type}
                className={cn(
                  'group relative rounded-xl border-2 border-border-default p-6 transition-all cursor-pointer',
                  'hover:shadow-lg hover:-translate-y-0.5',
                  projectType.hoverBorder
                )}
                style={{
                  backgroundColor: 'var(--color-components-card-bg)',
                }}
                onClick={() => onCreateProject(projectType.type)}
              >
                {/* 图标和标题 */}
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={cn(
                      'p-3 rounded-xl transition-colors',
                      projectType.bgColor
                    )}
                  >
                    <Icon className={cn('h-12 w-12', projectType.iconColor)} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary group-hover:text-text-accent transition-colors">
                      {projectType.title}
                    </h3>
                  </div>
                </div>

                {/* 描述 */}
                <p className="text-text-secondary mb-6 leading-relaxed">
                  {projectType.description}
                </p>

                {/* 特性列表 */}
                <div className="space-y-2 mb-6">
                  {projectType.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className={cn('w-1.5 h-1.5 rounded-full', projectType.dotColor)}
                      />
                      <span className="text-sm text-text-secondary">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* 创建按钮 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-tertiary">
                    {STUDIO_TEXTS.projectType.clickToCreate}
                  </span>
                  <ArrowRight
                    className={cn(
                      'h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity',
                      projectType.iconColor
                    )}
                  />
                </div>

                {/* 悬停效果 */}
                <div
                  className={cn(
                    'absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none',
                    projectType.bgColor
                  )}
                  style={{ opacity: 0.05 }}
                />
              </div>
            )
          })}
        </div>

        {/* 底部说明 */}
        <div
          className="mt-6 rounded-xl p-4"
          style={{ backgroundColor: 'var(--color-surface-secondary)' }}
        >
          <p className="text-sm text-text-secondary leading-relaxed">
            <strong className="text-text-primary">提示：</strong>
            {STUDIO_TEXTS.projectType.tip}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
