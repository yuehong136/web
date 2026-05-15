import { useCallback, type FC } from 'react'
import { ArrowLeft, Database } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ROUTES } from '@/constants'
import { cn } from '@/lib/utils'
import { CreateKnowledgeForm } from './create/create-knowledge-form'

export const KnowledgeCreatePage: FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleCancel = useCallback(() => {
    navigate(ROUTES.KNOWLEDGE)
  }, [navigate])

  const handleCreated = useCallback(
    (knowledgeBaseId: string) => {
      navigate(`${ROUTES.KNOWLEDGE}/${knowledgeBaseId}`)
    },
    [navigate],
  )

  return (
    <div className="min-h-screen bg-background-body">
      <div className="px-space-lg py-space-xl mx-auto max-w-3xl">
        <div className="mb-space-xl">
          <Button
            className="mb-space-base gap-space-xs text-text-secondary hover:text-text-primary"
            onClick={handleCancel}
            size="sm"
            variant="ghost"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('knowledge.create.actions.back')}
          </Button>

          <div className="gap-space-base flex items-center">
            <div
              className={cn(
                'rounded-radius-xl flex h-12 w-12 items-center justify-center',
                'bg-gradient-to-br from-components-avatar-gradient-indigo-from to-components-avatar-gradient-indigo-to',
                'shadow-elevation-low',
              )}
            >
              <Database className="h-6 w-6 text-text-inverted" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-text-primary">
                {t('knowledge.create.title')}
              </h1>
              <p className="mt-1 text-text-secondary">
                {t('knowledge.create.description')}
              </p>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden" padding="none">
          <CreateKnowledgeForm
            bodyClassName="p-space-lg"
            onCancel={handleCancel}
            onCreated={handleCreated}
            submitLabel={t('knowledge.create.actions.submit')}
          />
        </Card>
      </div>
    </div>
  )
}
