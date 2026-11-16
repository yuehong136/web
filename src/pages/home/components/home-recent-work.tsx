import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants'
import { ResourceCard } from '@/components/patterns/resource-card'
import { useHomeStore } from '@/stores/home'
import type { DialogApp, KnowledgeBase } from '@/types/api'
import { ContinueSection, useRelativeTime } from './continue-section'
import { ModelChip } from './model-chip'

const LIMIT = 3

type RecentItem =
  | { kind: 'app'; app: DialogApp; time: number }
  | { kind: 'knowledge'; knowledge: KnowledgeBase; time: number }

/**
 * Recently updated chat apps and knowledge bases. An app card starts a chat
 * with that app here; a knowledge card opens the knowledge base. There is no
 * cross-app conversation list, so conversations appear once an app is chosen.
 */
export function HomeRecentWork({
  apps,
  knowledgeBases,
  loading,
}: {
  apps: DialogApp[]
  knowledgeBases: KnowledgeBase[]
  loading: boolean
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const relativeTime = useRelativeTime()
  const selectApp = useHomeStore((state) => state.selectApp)
  if (loading) return null
  const items: RecentItem[] = [
    ...apps.map((app) => ({
      kind: 'app' as const,
      app,
      time: toMillis(app.update_time),
    })),
    ...knowledgeBases.map((knowledge) => ({
      kind: 'knowledge' as const,
      knowledge,
      time: toMillis(knowledge.update_time),
    })),
  ]
    .sort((first, second) => second.time - first.time)
    .slice(0, LIMIT)
  if (!items.length) return null
  return (
    <ContinueSection title={t('home.continue.title')}>
      {items.map((item) => {
        if (item.kind === 'app') {
          const { app } = item
          return (
            <ResourceCard
              key={`app-${app.id}`}
              name={app.name}
              description={app.description || undefined}
              avatar={{ src: app.icon, seed: app.id, badge: 'chat' }}
              eyebrow={eyebrow(
                t('home.continue.app'),
                relativeTime(app.update_time),
              )}
              chips={
                app.llm_id ? <ModelChip reference={app.llm_id} /> : undefined
              }
              onOpen={() => selectApp(app, null)}
            />
          )
        }
        const { knowledge } = item
        return (
          <ResourceCard
            key={`knowledge-${knowledge.id}`}
            name={knowledge.name}
            description={knowledge.description || undefined}
            avatar={{
              src: knowledge.avatar,
              seed: knowledge.id,
              badge: 'knowledge',
            }}
            eyebrow={eyebrow(
              t('home.continue.knowledge'),
              relativeTime(knowledge.update_time),
            )}
            meta={
              <>
                <span>
                  {t('home.continue.documents', {
                    count: knowledge.doc_num ?? 0,
                  })}
                </span>
                <span>
                  {t('home.continue.chunks', {
                    count: knowledge.chunk_num ?? 0,
                  })}
                </span>
              </>
            }
            onOpen={() => navigate(`${ROUTES.KNOWLEDGE}/${knowledge.id}`)}
          />
        )
      })}
    </ContinueSection>
  )
}

const toMillis = (value?: number) =>
  !value ? 0 : value > 1_000_000_000_000 ? value : value * 1000

const eyebrow = (kind: string, time: string) =>
  [kind, time].filter(Boolean).join(' · ')
