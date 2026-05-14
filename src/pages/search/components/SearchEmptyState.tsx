import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SearchEmptyStateProps {
  onCreate: () => void
  type?: 'list' | 'search'
}

const SearchEmptyState: React.FC<SearchEmptyStateProps> = ({
  onCreate,
  type = 'list',
}) => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ backgroundColor: 'var(--color-background-subtle)' }}
      >
        <Search className="h-8 w-8 text-text-tertiary" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-text-primary">
        {type === 'search'
          ? t('searchPage.empty.searchTitle', '未找到匹配的搜索应用')
          : t('searchPage.empty.listTitle', '还没有搜索应用')}
      </h3>
      <p className="mb-6 max-w-md text-center text-sm text-text-secondary">
        {type === 'search'
          ? t(
              'searchPage.empty.searchDescription',
              '尝试调整搜索条件或筛选器后重试。',
            )
          : t(
              'searchPage.empty.listDescription',
              '创建搜索应用，配置知识库和检索参数，快速从文档中查找信息并生成 AI 摘要',
            )}
      </p>
      {type === 'list' ? (
        <Button onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('searchPage.create', '创建搜索应用')}
        </Button>
      ) : null}
    </div>
  )
}

export default memo(SearchEmptyState)
