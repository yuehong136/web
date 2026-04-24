const DATA_PREFIX = 'data_'

export interface AgentShareAccess {
  agentId: string
  betaToken: string
  from: string
  release: boolean
  locale?: string
  theme?: string
  visibleAvatar: boolean
  userId?: string
  data: Record<string, string>
}

export interface BuildAgentShareUrlOptions {
  agentId: string
  betaToken: string
  release?: boolean
  origin?: string
  userId?: string
}

const readParam = (params: URLSearchParams, keys: string[]) => {
  for (const key of keys) {
    const value = params.get(key)
    if (value) {
      return value
    }
  }

  return ''
}

export function parseAgentShareAccess(
  searchParams: URLSearchParams,
): AgentShareAccess {
  const data = Object.fromEntries(
    Array.from(searchParams.entries())
      .filter(([key]) => key.startsWith(DATA_PREFIX))
      .map(([key, value]) => [key.replace(DATA_PREFIX, ''), value]),
  )

  const visibleAvatarParam = searchParams.get('visible_avatar')

  return {
    agentId: readParam(searchParams, ['shared_id', 'id', 'agent_id']),
    betaToken: readParam(searchParams, ['auth', 'beta', 'token']),
    from: searchParams.get('from') || 'agent',
    release: ['true', '1'].includes(
      (searchParams.get('release') || '').toLowerCase(),
    ),
    locale: searchParams.get('locale') || undefined,
    theme: searchParams.get('theme') || undefined,
    visibleAvatar: visibleAvatarParam ? visibleAvatarParam !== '0' : true,
    userId: searchParams.get('userId') || undefined,
    data,
  }
}

export function buildAgentSharePath({
  agentId,
  betaToken,
  release,
  userId,
}: BuildAgentShareUrlOptions) {
  const params = new URLSearchParams()
  params.set('shared_id', agentId)
  params.set('from', 'agent')
  params.set('auth', betaToken)

  if (release) {
    params.set('release', 'true')
  }

  if (userId) {
    params.set('userId', userId)
  }

  return `/agent/share?${params.toString()}`
}

export function buildAgentShareUrl(options: BuildAgentShareUrlOptions) {
  const origin =
    options.origin ||
    (typeof window === 'undefined' ? '' : window.location.origin)

  return `${origin}${buildAgentSharePath(options)}`
}
