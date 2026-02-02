/**
 * 团队空状态组件
 * 展示组件 - 无 hooks、无 API、无 store
 */

import React from 'react'
import { Button } from '@/components/ui/button'
import { Users, UserPlus, Search } from 'lucide-react'

interface TeamEmptyStateProps {
  type: 'members' | 'joined-teams' | 'search'
  searchQuery?: string
  onInvite?: () => void
}

export const TeamEmptyState: React.FC<TeamEmptyStateProps> = ({
  type,
  searchQuery,
  onInvite,
}) => {
  const config = {
    members: {
      icon: Users,
      title: '还没有团队成员',
      description: '邀请您的团队成员加入，一起协作使用平台',
      showAction: true,
      actionLabel: '邀请成员',
    },
    'joined-teams': {
      icon: Users,
      title: '还没有加入任何团队',
      description: '等待其他团队所有者发送邀请，或创建您自己的团队',
      showAction: false,
      actionLabel: '',
    },
    search: {
      icon: Search,
      title: '未找到匹配结果',
      description: `未找到与 "${searchQuery}" 相关的内容，请尝试其他关键词`,
      showAction: false,
      actionLabel: '',
    },
  }

  const currentConfig = config[type]
  const Icon = currentConfig.icon

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div
        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-surface-secondary)' }}
      >
        <Icon className="w-8 h-8" style={{ color: 'var(--color-text-tertiary)' }} />
      </div>
      <h3
        className="text-lg font-medium mb-2"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {currentConfig.title}
      </h3>
      <p
        className="text-center max-w-md mb-4"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {currentConfig.description}
      </p>
      {currentConfig.showAction && onInvite && (
        <Button onClick={onInvite}>
          <UserPlus className="h-4 w-4 mr-2" />
          {currentConfig.actionLabel}
        </Button>
      )}
    </div>
  )
}

TeamEmptyState.displayName = 'TeamEmptyState'
