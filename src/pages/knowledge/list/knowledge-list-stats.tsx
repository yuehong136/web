import type { FC } from 'react'
import { Database, FileText, Layers, Target } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { StatCard } from '@/components/patterns/stat-card'
import type { KnowledgeBase } from '@/types/api'

interface KnowledgeListStatsProps {
  knowledgeBases: KnowledgeBase[]
  total: number
}

export const KnowledgeListStats: FC<KnowledgeListStatsProps> = ({
  knowledgeBases,
  total,
}) => {
  const { t } = useTranslation()
  const totalDocuments = knowledgeBases.reduce(
    (sum, knowledgeBase) => sum + (knowledgeBase.doc_num || 0),
    0,
  )
  const totalChunks = knowledgeBases.reduce(
    (sum, knowledgeBase) => sum + (knowledgeBase.chunk_num || 0),
    0,
  )
  const totalTokens = knowledgeBases.reduce(
    (sum, knowledgeBase) => sum + (knowledgeBase.token_num || 0),
    0,
  )

  return (
    <div className="gap-space-base grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={<Database className="h-5 w-5" />}
        title={t('knowledge.list.stats.totalKnowledgeBases')}
        tone="info"
        value={total.toLocaleString()}
      />
      <StatCard
        icon={<FileText className="h-5 w-5" />}
        title={t('knowledge.list.stats.totalDocuments')}
        tone="success"
        value={totalDocuments.toLocaleString()}
      />
      <StatCard
        icon={<Layers className="h-5 w-5" />}
        title={t('knowledge.list.stats.totalChunks')}
        tone="warning"
        value={totalChunks.toLocaleString()}
      />
      <StatCard
        icon={<Target className="h-5 w-5" />}
        title={t('knowledge.list.stats.totalTokens')}
        tone="neutral"
        value={totalTokens.toLocaleString()}
      />
    </div>
  )
}
