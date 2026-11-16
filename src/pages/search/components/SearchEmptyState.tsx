import { memo, type FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search } from 'lucide-react'
import { PageEmptyState } from '@/components/patterns'
import { Button } from '@/components/ui/button'

interface SearchEmptyStateProps {
  type?: 'list' | 'search'
  onCreate: () => void
  /** Clears the search and filters in the `search` variant. */
  onReset?: () => void
}

const SearchEmptyState: FC<SearchEmptyStateProps> = ({
  type = 'list',
  onCreate,
  onReset,
}) => {
  const { t } = useTranslation()
  const search = type === 'search'
  return (
    <PageEmptyState
      icon={<Search className="size-icon-lg" />}
      title={t(
        search ? 'searchPage.empty.searchTitle' : 'searchPage.empty.listTitle',
      )}
      description={t(
        search
          ? 'searchPage.empty.searchDescription'
          : 'searchPage.empty.listDescription',
      )}
      action={
        search ? (
          onReset ? (
            <Button variant="outline" onClick={onReset}>
              {t('searchPage.empty.reset')}
            </Button>
          ) : null
        ) : (
          <Button onClick={onCreate}>
            <Plus className="size-icon-sm" aria-hidden="true" />
            {t('searchPage.create')}
          </Button>
        )
      }
    />
  )
}

export default memo(SearchEmptyState)
