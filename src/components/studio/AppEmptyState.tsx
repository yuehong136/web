import { useTranslation } from 'react-i18next'
import { LayoutTemplate, MessageSquare, Search, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  EmptyStart,
  type EmptyStartPath,
} from '@/components/patterns/empty-start'
import { PageEmptyState } from '@/components/patterns/page-states'
import { KindStackIllustration } from './collection-identity'

interface AppEmptyStateProps {
  type: 'list' | 'search'
  /** First-use path: create a chat app. */
  onCreate?: () => void
  /** First-use path: start from an agent template. */
  onTemplate?: () => void
  /** First-use path: import app templates. */
  onImport?: () => void
  onReset?: () => void
  className?: string
}

/**
 * First use: start paths over a faded grid. Search or filter misses keep the
 * plain empty state with a reset.
 */
export function AppEmptyState({
  type,
  onCreate,
  onTemplate,
  onImport,
  onReset,
  className,
}: AppEmptyStateProps) {
  const { t } = useTranslation()
  if (type === 'search')
    return (
      <PageEmptyState
        className={className}
        title={t('studio.empty.searchTitle')}
        description={t('studio.empty.searchDescription')}
        icon={<Search className="size-icon-lg" />}
        action={
          onReset && (
            <Button variant="outline" onClick={onReset}>
              {t('studio.filters.reset')}
            </Button>
          )
        }
      />
    )
  const paths: EmptyStartPath[] = []
  if (onCreate)
    paths.push({
      key: 'create',
      primary: true,
      icon: <MessageSquare />,
      iconClassName: 'bg-avatar-6-bg text-avatar-6-fg',
      title: t('studio.empty.createTitle'),
      description: t('studio.empty.createDescription'),
      cta: t('studio.empty.createCta'),
      onSelect: onCreate,
    })
  if (onTemplate)
    paths.push({
      key: 'template',
      icon: <LayoutTemplate />,
      iconClassName: 'bg-avatar-7-bg text-avatar-7-fg',
      title: t('studio.empty.templateTitle'),
      description: t('studio.empty.templateDescription'),
      cta: t('studio.empty.templateCta'),
      onSelect: onTemplate,
    })
  if (onImport)
    paths.push({
      key: 'import',
      icon: <Upload />,
      iconClassName: 'bg-avatar-4-bg text-avatar-4-fg',
      title: t('studio.empty.importTitle'),
      description: t('studio.empty.importDescription'),
      cta: t('studio.empty.importCta'),
      onSelect: onImport,
    })
  return (
    <EmptyStart
      className={className}
      illustration={
        <KindStackIllustration kinds={['agent', 'chat', 'knowledge']} />
      }
      title={t('studio.empty.listTitle')}
      description={t('studio.empty.listDescription')}
      paths={paths}
    />
  )
}
