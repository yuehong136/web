import { memo, type FC } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, Search } from 'lucide-react'
import { PageEmptyState } from '@/components/patterns'
import { EmptyStart } from '@/components/patterns/empty-start'
import { KindStackIllustration } from '@/components/studio'
import { Button } from '@/components/ui/button'

interface SearchEmptyStateProps {
  type?: 'list' | 'search'
  onCreate: () => void
  /** First-use path: prepare the knowledge bases a search app reads. */
  onOpenKnowledge?: () => void
  /** Clears the search and filters in the `search` variant. */
  onReset?: () => void
}

const SearchEmptyState: FC<SearchEmptyStateProps> = ({
  type = 'list',
  onCreate,
  onOpenKnowledge,
  onReset,
}) => {
  const { t } = useTranslation()
  if (type === 'search')
    return (
      <PageEmptyState
        icon={<Search className="size-icon-lg" />}
        title={t('searchPage.empty.searchTitle')}
        description={t('searchPage.empty.searchDescription')}
        action={
          onReset ? (
            <Button variant="outline" onClick={onReset}>
              {t('searchPage.empty.reset')}
            </Button>
          ) : null
        }
      />
    )
  return (
    <EmptyStart
      illustration={
        <KindStackIllustration kinds={['knowledge', 'search', 'chat']} />
      }
      title={t('searchPage.empty.listTitle')}
      description={t('searchPage.empty.listDescription')}
      paths={[
        {
          key: 'create',
          primary: true,
          icon: <Search />,
          iconClassName: 'bg-avatar-2-bg text-avatar-2-fg',
          title: t('searchPage.create'),
          description: t('searchPage.empty.createDescription'),
          cta: t('searchPage.empty.createCta'),
          onSelect: onCreate,
        },
        ...(onOpenKnowledge
          ? [
              {
                key: 'knowledge',
                icon: <BookOpen />,
                iconClassName: 'bg-avatar-5-bg text-avatar-5-fg',
                title: t('searchPage.empty.knowledgeTitle'),
                description: t('searchPage.empty.knowledgeDescription'),
                cta: t('searchPage.empty.knowledgeCta'),
                onSelect: onOpenKnowledge,
              },
            ]
          : []),
      ]}
    />
  )
}

export default memo(SearchEmptyState)
