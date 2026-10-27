import { BOOTSTRAP_NAMESPACES, type LocaleNamespace } from './locale-registry'

/** Domains used by the route plus shared controls rendered by its shell. */
export const namespacesForPath = (pathname: string): LocaleNamespace[] => {
  const domains: LocaleNamespace[] = ['desktop']
  if (/^\/(login|register|auth)(\/|$)/.test(pathname)) domains.push('auth')
  else if (
    /^\/(agent|agents|agent-templates|chats|workflow|dataflow-result)(\/|$)/.test(
      pathname,
    )
  ) {
    domains.push('agent', 'agents', 'flow', 'chat', 'knowledge', 'mcp')
  } else if (/^\/(knowledge|documents?)(\/|$)/.test(pathname)) {
    domains.push(
      'knowledge',
      'document-create',
      'datasource',
      'chat',
      'settings',
    )
  } else if (/^\/search(\/|$)/.test(pathname)) {
    domains.push('search', 'knowledge', 'chat', 'settings')
  } else if (/^\/settings(\/|$)/.test(pathname)) {
    domains.push(
      'settings',
      'appearance',
      'datasource',
      'channel',
      'mcp',
      'knowledge',
    )
  } else if (/^\/(studio|dialogs?)(\/|$)/.test(pathname)) {
    domains.push('studio', 'flow', 'agent', 'chat', 'knowledge', 'settings')
  } else if (/^\/skills(\/|$)/.test(pathname)) domains.push('skills')
  else if (/^\/memory(\/|$)/.test(pathname)) domains.push('memory')
  else if (/^\/explore(\/|$)/.test(pathname))
    domains.push('explore', 'chat', 'agent')
  else if (/^\/(ai-tools|tools|mcp(?:-[a-z]+)?)(\/|$)/.test(pathname))
    domains.push('mcp', 'chat')
  else domains.push('home', 'chat', 'skills', 'knowledge', 'settings')
  if (
    domains.some((domain) =>
      [
        'home',
        'chat',
        'search',
        'agent',
        'knowledge',
        'studio',
        'explore',
      ].includes(domain),
    )
  )
    domains.push('sources', 'reference')
  return [...new Set([...BOOTSTRAP_NAMESPACES, ...domains])]
}
