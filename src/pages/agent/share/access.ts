const DATA_PREFIX = 'data_'

export type AgentEmbedType = 'fullscreen' | 'widget'
export type AgentWidgetMode = 'master' | 'window'

export interface AgentShareAccess {
  agentId: string
  betaToken: string
  from: string
  release: boolean
  locale?: string
  theme?: string
  visibleAvatar: boolean
  userId?: string
  embedType: AgentEmbedType
  mode?: AgentWidgetMode
  streaming: boolean
  data: Record<string, string>
}

export interface BuildAgentShareUrlOptions {
  agentId: string
  betaToken: string
  release?: boolean
  origin?: string
  userId?: string
  locale?: string
  theme?: string
  visibleAvatar?: boolean
  mode?: AgentWidgetMode
  streaming?: boolean
}

export interface BuildAgentEmbedCodeOptions extends BuildAgentShareUrlOptions {
  embedType: AgentEmbedType
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
  const mode = searchParams.get('mode')

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
    embedType: mode ? 'widget' : 'fullscreen',
    mode: mode === 'master' || mode === 'window' ? mode : undefined,
    streaming: searchParams.get('streaming') === 'true',
    data,
  }
}

function appendCommonShareParams(
  params: URLSearchParams,
  {
    agentId,
    betaToken,
    release,
    userId,
    locale,
    visibleAvatar,
  }: BuildAgentShareUrlOptions,
) {
  params.set('shared_id', agentId)
  params.set('from', 'agent')
  params.set('auth', betaToken)

  if (release) {
    params.set('release', 'true')
  }

  if (userId) {
    params.set('userId', userId)
  }

  if (locale) {
    params.set('locale', locale)
  }

  if (visibleAvatar !== undefined) {
    params.set('visible_avatar', visibleAvatar ? '1' : '0')
  }
}

export function buildAgentSharePath(options: BuildAgentShareUrlOptions) {
  const params = new URLSearchParams()
  appendCommonShareParams(params, options)

  if (options.theme) {
    params.set('theme', options.theme)
  }

  return `/agent/share?${params.toString()}`
}

export function buildAgentWidgetSharePath(options: BuildAgentShareUrlOptions) {
  const params = new URLSearchParams()
  appendCommonShareParams(params, options)
  params.set('mode', options.mode || 'master')
  params.set('streaming', options.streaming ? 'true' : 'false')

  return `/chats/widget?${params.toString()}`
}

export function buildAgentFullscreenShareUrl(options: BuildAgentShareUrlOptions) {
  const origin =
    options.origin ||
    (typeof window === 'undefined' ? '' : window.location.origin)

  return `${origin}${buildAgentSharePath(options)}`
}

export function buildAgentWidgetShareUrl(options: BuildAgentShareUrlOptions) {
  const origin =
    options.origin ||
    (typeof window === 'undefined' ? '' : window.location.origin)

  return `${origin}${buildAgentWidgetSharePath(options)}`
}

export function buildAgentEmbedCode({
  embedType,
  ...options
}: BuildAgentEmbedCodeOptions) {
  if (embedType === 'widget') {
    const widgetUrl = buildAgentWidgetShareUrl({
      ...options,
      mode: 'master',
    })
    const widgetOrigin = readUrlOrigin(widgetUrl)

    return `<iframe
  src="${widgetUrl}"
  style="position:fixed;bottom:0;right:0;width:100px;height:100px;border:none;background:transparent;z-index:9999"
  frameborder="0"
  allow="microphone;camera"
></iframe>
<script>
window.addEventListener('message',e=>{
  if(e.origin!=='${widgetOrigin}')return;
  if(e.data.type==='CREATE_CHAT_WINDOW'){
    if(document.getElementById('chat-win'))return;
    const i=document.createElement('iframe');
    i.id='chat-win';i.src=e.data.src;
    i.style.cssText='position:fixed;bottom:104px;right:24px;width:380px;height:500px;border:none;background:transparent;z-index:9998;display:none';
    i.frameBorder='0';i.allow='microphone;camera';
    document.body.appendChild(i);
  }else if(e.data.type==='TOGGLE_CHAT'){
    const w=document.getElementById('chat-win');
    if(w)w.style.display=e.data.isOpen?'block':'none';
  }else if(e.data.type==='SCROLL_PASSTHROUGH')window.scrollBy(0,e.data.deltaY);
});
</script>`
  }

  const shareUrl = buildAgentFullscreenShareUrl(options)

  return `<iframe
  src="${shareUrl}"
  style="width:100%;height:100%;min-height:600px"
  frameborder="0"
></iframe>`
}

function readUrlOrigin(url: string) {
  try {
    return new URL(url).origin
  } catch {
    return typeof window === 'undefined' ? '' : window.location.origin
  }
}

export function buildAgentShareUrl(options: BuildAgentShareUrlOptions) {
  return buildAgentFullscreenShareUrl(options)
}
