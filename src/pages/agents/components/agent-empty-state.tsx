import { useTranslation } from 'react-i18next'
import { Bot, FileInput, LayoutTemplate, Search } from 'lucide-react'
import {
  EmptyStart,
  type EmptyStartPath,
} from '@/components/patterns/empty-start'
import { PageEmptyState } from '@/components/patterns/page-states'
import { KindStackIllustration } from '@/components/studio'
import { Button } from '@/components/ui/button'
interface AgentEmptyStateProps {
  type: 'list' | 'search'
  onCreate?: () => void
  onTemplate?: () => void
  onImport?: () => void
  onReset?: () => void
  className?: string
}

/** First use: create, template and import paths. Misses keep a reset. */
export function AgentEmptyState({
  type,
  onCreate,
  onTemplate,
  onImport,
  onReset,
  className,
}: AgentEmptyStateProps) {
  const { t } = useTranslation()
  if (type === 'search')
    return (
      <PageEmptyState
        className={className}
        title={t('agents.noMatchTitle')}
        description={t('agents.noMatchDescription')}
        icon={<Search className="size-icon-lg" />}
        action={
          onReset && (
            <Button variant="outline" onClick={onReset}>
              {t('agents.resetFilters')}
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
      icon: <Bot />,
      iconClassName: 'bg-avatar-7-bg text-avatar-7-fg',
      title: t('agents.createAsset'),
      description: t('agents.empty.createDescription'),
      cta: t('agents.empty.createCta'),
      onSelect: onCreate,
    })
  if (onTemplate)
    paths.push({
      key: 'template',
      icon: <LayoutTemplate />,
      iconClassName: 'bg-avatar-2-bg text-avatar-2-fg',
      title: t('agents.createFromTemplate'),
      description: t('agents.empty.templateDescription'),
      cta: t('agents.empty.templateCta'),
      onSelect: onTemplate,
    })
  if (onImport)
    paths.push({
      key: 'import',
      icon: <FileInput />,
      iconClassName: 'bg-avatar-4-bg text-avatar-4-fg',
      title: t('agents.importJson'),
      description: t('agents.empty.importDescription'),
      cta: t('agents.empty.importCta'),
      onSelect: onImport,
    })
  return (
    <EmptyStart
      className={className}
      illustration={
        <KindStackIllustration kinds={['mcp', 'agent', 'knowledge']} />
      }
      title={t('agents.emptyTitle')}
      description={t('agents.emptyDescription')}
      paths={paths}
    />
  )
}
