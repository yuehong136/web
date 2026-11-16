import { useDialogApps } from '@/hooks/use-dialog-apps'
import { useFetchKnowledgeList } from '@/hooks/use-knowledge-request'
import { useFetchMCPServers } from '@/hooks/use-mcp-request'

/**
 * What the new-chat page can say about the workspace, from list queries other
 * surfaces already use (the command palette shares the knowledge list and the
 * skill panel the MCP list), so opening those later reuses the cache. A list
 * that failed contributes nothing; the page never shows guessed counts.
 */
export function useHomeOverview() {
  const apps = useDialogApps()
  const knowledge = useFetchKnowledgeList({ page_size: 8 })
  const mcp = useFetchMCPServers({ page_size: 100 })
  return {
    /** Apps that can answer on Home (the active ones). */
    apps: apps.isError ? [] : apps.data.filter((app) => app.status === '1'),
    knowledgeBases: knowledge.isError ? [] : knowledge.knowledgeBases,
    /** Either recent-work list is still loading. */
    loading: apps.isLoading || knowledge.isLoading,
    /** Totals are null until their list has loaded without error. */
    knowledgeTotal:
      knowledge.isLoading || knowledge.isError ? null : knowledge.total,
    mcpTotal: mcp.isSuccess ? (mcp.data?.total ?? null) : null,
  }
}
