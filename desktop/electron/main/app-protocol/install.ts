import { extname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { net, protocol } from 'electron'
import {
  APP_SCHEME,
  APP_SCHEME_PRIVILEGES,
  createAppContentSecurityPolicy,
} from './constants'
import {
  AppRequestResolutionKind,
  createAppRequestResolver,
  isDocumentNavigationRequest,
} from './request-resolution'

const RESPONSE_SECURITY_HEADERS = Object.freeze({
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
})

export function registerAppScheme(): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: APP_SCHEME, privileges: APP_SCHEME_PRIVILEGES },
  ])
}

function emptyResponse(
  status: number,
  contentSecurityPolicy: string,
): Response {
  return new Response(null, {
    status,
    headers: {
      ...RESPONSE_SECURITY_HEADERS,
      'content-security-policy': contentSecurityPolicy,
    },
  })
}

function withSecurityHeaders(
  response: Response,
  isHtml: boolean,
  contentSecurityPolicy: string,
): Response {
  const headers = new Headers(response.headers)
  for (const [name, value] of Object.entries(RESPONSE_SECURITY_HEADERS)) {
    headers.set(name, value)
  }
  if (isHtml) {
    headers.set('content-security-policy', contentSecurityPolicy)
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export async function installAppProtocol(
  rendererRoot: string,
  connectSources: readonly string[],
): Promise<void> {
  const resolver = await createAppRequestResolver(rendererRoot)
  const contentSecurityPolicy = createAppContentSecurityPolicy(connectSources)

  protocol.handle(APP_SCHEME, async (request) => {
    if (request.method !== 'GET') {
      return emptyResponse(405, contentSecurityPolicy)
    }

    const resolution = await resolver.resolve(request.url, {
      documentNavigation: isDocumentNavigationRequest(request),
    })
    if (resolution.kind === AppRequestResolutionKind.INVALID) {
      return emptyResponse(400, contentSecurityPolicy)
    }
    if (resolution.kind !== AppRequestResolutionKind.FILE) {
      return emptyResponse(404, contentSecurityPolicy)
    }

    const response = await net.fetch(pathToFileURL(resolution.filePath).href)
    return withSecurityHeaders(
      response,
      extname(resolution.filePath).toLowerCase() === '.html',
      contentSecurityPolicy,
    )
  })
}
