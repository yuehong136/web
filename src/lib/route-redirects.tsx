import { Navigate, useLocation, useParams } from 'react-router-dom'
import { ROUTES } from '@/constants'

// ---------------------------------------------------------------------------
/** Redirects a retired route, keeping its query and optionally opening a tab. */
export function SearchRedirect({ to, tab }: { to: string; tab?: string }) {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const legacyServer = params.get('serverId')
  if (legacyServer && !params.has('server')) params.set('server', legacyServer)
  params.delete('serverId')
  if (tab) params.set('tab', tab)
  const query = params.toString()
  return (
    <Navigate to={{ pathname: to, search: query ? `?${query}` : '' }} replace />
  )
}

// ---------------------------------------------------------------------------
// The MCP playground became Home's model and MCP chat; keep any query on the way.
export function MCPChatRedirect() {
  const { search, hash } = useLocation()
  return <Navigate to={{ pathname: ROUTES.HOME, search, hash }} replace />
}

// ---------------------------------------------------------------------------
// The retired prompt editor edited the same dialog the Studio editor opens.
export function PromptEditorRedirect() {
  const { id } = useParams<{ id: string }>()
  return (
    <Navigate
      to={
        id
          ? `${ROUTES.STUDIO_CREATE_APP}?dialog_id=${encodeURIComponent(id)}`
          : ROUTES.STUDIO
      }
      replace
    />
  )
}

export function AgentLogRedirect() {
  const { id } = useParams<{ id: string }>()
  return (
    <Navigate
      to={`/agents/log${id ? `?canvas=${encodeURIComponent(id)}` : ''}`}
      replace
    />
  )
}
