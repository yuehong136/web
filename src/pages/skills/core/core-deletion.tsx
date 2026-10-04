import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { APIError } from '@/api/client'
import { skillCoreAPI } from '@/api/skill-core'
import {
  useCoreSpace,
  useCoreAction,
  skillCoreKeys,
} from '@/hooks/use-skill-core-request'
import { Button } from '@/components/ui/button'
import { SkillError } from '../skill-shared'

export function useCoreDeletionRoute() {
  const [params, setParams] = useSearchParams()
  return {
    ids: params.getAll('deleting').filter((id) => /^[a-f0-9]{32}$/.test(id)),
    accepted: (id: string) =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          if (!next.getAll('deleting').includes(id)) next.append('deleting', id)
          return next
        },
        { replace: true },
      ),
    dismiss: (id: string) =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          next.delete('deleting', id)
          return next
        },
        { replace: true },
      ),
  }
}
export function CoreDeletion({
  id,
  dismiss,
}: {
  id: string
  dismiss: () => void
}) {
  const { t } = useTranslation()
  const query = useCoreSpace(id)
  const action = useCoreAction()
  const client = useQueryClient()
  const deleted =
    query.data?.status === 'deleted' ||
    (query.error instanceof APIError && query.error.status === 404)
  useEffect(() => {
    if (deleted)
      void client.invalidateQueries({ queryKey: skillCoreKeys.spaces() })
  }, [client, deleted])
  return (
    <section
      className="flex flex-wrap items-center justify-between gap-space-sm rounded-radius-lg bg-background-subtle p-space-base"
      aria-live="polite"
    >
      <div>
        <p>
          {query.data?.name || t('skills.space')} ·{' '}
          {t(
            deleted
              ? 'skills.states.deleted'
              : query.data?.delete_error
                ? 'skills.states.delete_failed'
                : 'skills.core.deletionPending',
          )}
        </p>
        {!deleted && <SkillError error={query.error || action.error} />}
      </div>
      <div className="flex gap-space-sm">
        {query.data?.delete_error?.retryable && (
          <Button
            disabled={action.isPending}
            onClick={() => action.mutate(() => skillCoreAPI.deleteSpace(id))}
          >
            {t('skills.retry')}
          </Button>
        )}
        {!!query.error && !deleted && (
          <Button variant="outline" onClick={() => void query.refetch()}>
            {t('skills.refresh')}
          </Button>
        )}
        {deleted && (
          <Button variant="ghost" onClick={dismiss}>
            {t('skills.dismiss')}
          </Button>
        )}
      </div>
    </section>
  )
}
