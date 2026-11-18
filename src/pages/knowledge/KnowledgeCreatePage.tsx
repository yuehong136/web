import { useCallback, type FC } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { DetailTemplate } from '@/components/page-templates'
import { ROUTES } from '@/constants'
import { cn } from '@/lib/utils'
import { CreateKnowledgeForm } from './create/create-knowledge-form'
import { knowledgePaths } from './list/use-knowledge-list-page'

const STEPS = ['details', 'import'] as const

/**
 * The one way to create a knowledge base: details here, then the new base's
 * documents page opens with the upload dialog for step two.
 */
export const KnowledgeCreatePage: FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleCancel = useCallback(() => {
    navigate(ROUTES.KNOWLEDGE)
  }, [navigate])

  const handleCreated = useCallback(
    (knowledgeBaseId: string) => {
      navigate(knowledgePaths.importDocuments(knowledgeBaseId))
    },
    [navigate],
  )

  return (
    <DetailTemplate
      title={t('knowledge.create.title')}
      crumbs={[{ label: t('knowledge.nav.knowledge'), to: ROUTES.KNOWLEDGE }]}
      subline={
        <ol
          aria-label={t('knowledge.create.steps.label')}
          className="flex flex-wrap items-center gap-x-space-md gap-y-space-2xs text-xs text-fg-subtle"
        >
          {STEPS.map((step, index) => (
            <li
              key={step}
              aria-current={index === 0 ? 'step' : undefined}
              className={cn(
                'inline-flex items-center gap-space-xs',
                index === 0 && 'font-medium text-fg',
              )}
            >
              <span className="tabular-nums">{index + 1}</span>
              {t(`knowledge.create.steps.${step}`)}
            </li>
          ))}
        </ol>
      }
    >
      <div className="mx-auto w-full max-w-[calc(45rem*var(--text-scale,1))] px-space-md py-space-lg sm:px-space-xl">
        <p className="mb-space-base text-sm text-fg-muted">
          {t('knowledge.create.description')}
        </p>
        <CreateKnowledgeForm
          bodyClassName="p-0"
          footerClassName="mt-space-lg border-t border-line-subtle bg-transparent px-0"
          onCancel={handleCancel}
          onCreated={handleCreated}
          submitLabel={t('knowledge.create.actions.createAndImport')}
        />
      </div>
    </DetailTemplate>
  )
}
