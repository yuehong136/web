import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import { ROUTES } from '@/constants'
import type { DialogConversationSummary } from '@/api/conversation'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import {
  chatKeys,
  useFetchConversationsByDialog,
} from '@/hooks/use-chat-request'
import { useDialogApps } from '@/hooks/use-dialog-apps'
import { useFetchKnowledgeList } from '@/hooks/use-knowledge-request'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { getCurrentLanguage } from '@/locales/i18n'
import { useHomeStore } from '@/stores/home'
import type { DialogApp } from '@/types/api'
import { formatRelativeTime } from '@/utils/conversation-utils'
import { matchesQuery, type PaletteItem } from './palette-items'

/** Rows per data group; the palette is a jump list, not a browser. */
const GROUP_LIMIT = 6

const byRecent = <T extends { update_time?: number }>(items: T[]) =>
  [...items].sort((a, b) => (b.update_time ?? 0) - (a.update_time ?? 0))

/**
 * Conversations, knowledge bases and chat apps from existing endpoints. There
 * is no cross-app session list, so conversations come from the app lists
 * already in the Query cache plus the current Home app, matched by title.
 * Knowledge bases use the list endpoint's `keywords`; apps are matched by name
 * in the shared app list.
 */
export const usePaletteEntityItems = (
  query: string,
  onClose: () => void,
): { items: PaletteItem[]; loading: boolean } => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const keywords = useDebouncedValue(query.trim(), 250)
  const homeApp = useHomeStore((state) => state.selectedApps[0])
  const { data: apps = [], isLoading: appsLoading } = useDialogApps()
  // Loads the current app's list into the cache read below.
  useFetchConversationsByDialog(homeApp?.id)
  const { knowledgeBases, isLoading: knowledgeLoading } = useFetchKnowledgeList(
    { keywords: keywords || undefined, page_size: 8 },
  )

  const appsById = React.useMemo(() => {
    const map = new Map<string, DialogApp>(apps.map((app) => [app.id, app]))
    if (homeApp) map.set(homeApp.id, homeApp)
    return map
  }, [apps, homeApp])

  const cachedLists = queryClient.getQueriesData<DialogConversationSummary[]>({
    queryKey: [...chatKeys.conversations(), 'byDialog'],
  })

  return React.useMemo(() => {
    const openApp = (app: DialogApp, conversationId: string | null) => {
      const home = useHomeStore.getState()
      if (home.selectedApps[0]?.id === app.id) {
        if (conversationId) home.selectConversation(conversationId)
        else home.startNewConversation()
      } else home.selectApp(app, conversationId)
      navigate(ROUTES.HOME)
      onClose()
    }
    const time = (value: number | string | undefined) =>
      formatRelativeTime(value, {
        locale: getCurrentLanguage(),
        format: (key, count) =>
          t(`desktop.conversations.time.${key}`, { count }),
      })

    const seen = new Set<string>()
    const conversations = cachedLists.flatMap(([key, list]) => {
      const app = appsById.get(String(key[3] ?? ''))
      if (!app || !Array.isArray(list)) return []
      return list.map((conversation) => ({ app, conversation }))
    })
    const conversationItems = byRecent(
      conversations.map(({ app, conversation }) => ({
        app,
        conversation,
        update_time: conversation.update_time,
      })),
    )
      .filter(({ conversation }) => {
        if (seen.has(conversation.id)) return false
        seen.add(conversation.id)
        const title =
          conversation.name ||
          conversation.title ||
          t('desktop.conversations.untitled')
        return matchesQuery(title, query)
      })
      .slice(0, GROUP_LIMIT)
      .map<PaletteItem>(({ app, conversation }) => ({
        value: `conversation ${conversation.id}`,
        group: 'conversations',
        title:
          conversation.name ||
          conversation.title ||
          t('desktop.conversations.untitled'),
        subtitle: app.name,
        meta: time(conversation.update_time || conversation.update_date),
        icon: (
          <MessageSquare
            className="size-icon-sm text-fg-subtle"
            aria-hidden="true"
          />
        ),
        run: () => openApp(app, conversation.id),
      }))

    const knowledgeItems = knowledgeBases
      .filter((knowledge) =>
        matchesQuery(`${knowledge.name} ${knowledge.description ?? ''}`, query),
      )
      .slice(0, GROUP_LIMIT)
      .map<PaletteItem>((knowledge) => ({
        value: `knowledge ${knowledge.id}`,
        group: 'knowledge',
        title: knowledge.name,
        subtitle: t('desktop.commands.palette.documents', {
          count: knowledge.doc_num ?? 0,
        }),
        icon: (
          <EntityAvatar
            name={knowledge.name}
            src={knowledge.avatar}
            seed={knowledge.id}
            size="2xs"
          />
        ),
        run: () => {
          navigate(`${ROUTES.KNOWLEDGE}/${knowledge.id}`)
          onClose()
        },
      }))

    const appItems = byRecent(apps)
      .filter((app) =>
        matchesQuery(`${app.name} ${app.description ?? ''}`, query),
      )
      .slice(0, GROUP_LIMIT)
      .map<PaletteItem>((app) => ({
        value: `app ${app.id}`,
        group: 'apps',
        title: app.name,
        subtitle: app.description || undefined,
        meta: t('desktop.commands.palette.startChat'),
        icon: (
          <EntityAvatar
            name={app.name}
            src={app.icon}
            seed={app.id}
            size="2xs"
          />
        ),
        run: () => openApp(app, null),
      }))

    return {
      items: [...conversationItems, ...knowledgeItems, ...appItems],
      loading: appsLoading || knowledgeLoading || keywords !== query.trim(),
    }
  }, [
    apps,
    appsById,
    appsLoading,
    cachedLists,
    keywords,
    knowledgeBases,
    knowledgeLoading,
    navigate,
    onClose,
    query,
    t,
  ])
}
