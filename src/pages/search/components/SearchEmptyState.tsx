import React, { memo } from 'react'
import { Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SearchEmptyStateProps {
  onCreate: () => void
  type?: 'list' | 'search'
}

const SearchEmptyState: React.FC<SearchEmptyStateProps> = ({ onCreate, type = 'list' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ backgroundColor: 'var(--color-background-subtle)' }}
      >
        <Search className="h-8 w-8 text-text-tertiary" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">
        {type === 'search' ? '未找到匹配的搜索应用' : '还没有搜索应用'}
      </h3>
      <p className="text-sm text-text-secondary mb-6 text-center max-w-md">
        {type === 'search'
          ? '尝试调整搜索条件或筛选器后重试。'
          : '创建搜索应用，配置知识库和检索参数，快速从文档中查找信息并生成 AI 摘要'}
      </p>
      {type === 'list' ? (
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          创建搜索应用
        </Button>
      ) : null}
    </div>
  )
}

export default memo(SearchEmptyState)
