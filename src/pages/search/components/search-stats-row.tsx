import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, Search, Sparkles, Workflow } from 'lucide-react'
import { MemoryStatsCard } from '@/components/memory'
import type { SearchAppListItem } from '@/types/search'
import {
  resolveKbCount,
  resolveRelatedEnabled,
  resolveSummaryEnabled,
} from './utils'

interface SearchStatsRowProps {
  total: number
  apps: SearchAppListItem[]
}

const SearchStatsRow: React.FC<SearchStatsRowProps> = ({ total, apps }) => {
  const { t } = useTranslation()
  const { summaryCount, relatedCount, kbCount } = useMemo(() => {
    return apps.reduce(
      (acc, app) => {
        if (resolveSummaryEnabled(app)) acc.summaryCount += 1
        if (resolveRelatedEnabled(app)) acc.relatedCount += 1
        acc.kbCount += resolveKbCount(app)
        return acc
      },
      { summaryCount: 0, relatedCount: 0, kbCount: 0 },
    )
  }, [apps])

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MemoryStatsCard
        title={t('searchPage.stats.total', '搜索应用总数')}
        value={total}
        icon={Search}
        color="info"
      />
      <MemoryStatsCard
        title={t('searchPage.stats.summary', '已启用 AI 摘要')}
        value={summaryCount}
        icon={Sparkles}
        color="success"
      />
      <MemoryStatsCard
        title={t('searchPage.stats.related', '已启用相关问题')}
        value={relatedCount}
        icon={Workflow}
        color="purple"
      />
      <MemoryStatsCard
        title={t('searchPage.stats.knowledgeBases', '关联知识库总数')}
        value={kbCount}
        icon={BookOpen}
        color="warning"
      />
    </div>
  )
}

export default memo(SearchStatsRow)
