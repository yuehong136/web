import { realpath, stat } from 'node:fs/promises'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { parseAppResourceUrl } from './app-url'

export enum AppRequestResolutionKind {
  FILE = 'file',
  INVALID = 'invalid',
  NOT_FOUND = 'not_found',
}

export interface AppFileResolution {
  readonly kind: AppRequestResolutionKind.FILE
  readonly filePath: string
  readonly spaFallback: boolean
}

export interface AppEmptyResolution {
  readonly kind:
    | AppRequestResolutionKind.INVALID
    | AppRequestResolutionKind.NOT_FOUND
}

export type AppRequestResolution = AppFileResolution | AppEmptyResolution

export interface AppRequestResolver {
  resolve(
    url: string,
    options: { readonly documentNavigation: boolean },
  ): Promise<AppRequestResolution>
}

function isWithinRoot(root: string, candidate: string): boolean {
  const relativePath = relative(root, candidate)
  return (
    relativePath === '' ||
    (relativePath !== '..' &&
      !relativePath.startsWith(`..${sep}`) &&
      !isAbsolute(relativePath))
  )
}

async function resolveRegularFile(
  canonicalRoot: string,
  pathSegments: readonly string[],
): Promise<string | null> {
  const candidate = resolve(canonicalRoot, ...pathSegments)
  if (!isWithinRoot(canonicalRoot, candidate)) return null

  try {
    const canonicalCandidate = await realpath(candidate)
    if (!isWithinRoot(canonicalRoot, canonicalCandidate)) return null
    const metadata = await stat(canonicalCandidate)
    return metadata.isFile() ? canonicalCandidate : null
  } catch {
    return null
  }
}

export async function createAppRequestResolver(
  rendererRoot: string,
): Promise<AppRequestResolver> {
  const canonicalRoot = await realpath(rendererRoot)
  const rootMetadata = await stat(canonicalRoot)
  if (!rootMetadata.isDirectory()) {
    throw new TypeError('Renderer root must be a directory')
  }

  const entryPath = await resolveRegularFile(canonicalRoot, ['index.html'])
  if (!entryPath) throw new TypeError('Renderer entry is missing')

  return Object.freeze({
    async resolve(
      value: string,
      options: { readonly documentNavigation: boolean },
    ): Promise<AppRequestResolution> {
      const parsed = parseAppResourceUrl(value)
      if (!parsed) return { kind: AppRequestResolutionKind.INVALID }

      const requestedSegments =
        parsed.pathSegments.length === 0
          ? (['index.html'] as const)
          : parsed.pathSegments
      const requestedFile = await resolveRegularFile(
        canonicalRoot,
        requestedSegments,
      )
      if (requestedFile) {
        return {
          kind: AppRequestResolutionKind.FILE,
          filePath: requestedFile,
          spaFallback: false,
        }
      }

      if (options.documentNavigation) {
        return {
          kind: AppRequestResolutionKind.FILE,
          filePath: entryPath,
          spaFallback: true,
        }
      }

      return { kind: AppRequestResolutionKind.NOT_FOUND }
    },
  })
}

export function isDocumentNavigationRequest(
  request: Pick<Request, 'destination' | 'headers' | 'method' | 'mode'>,
): boolean {
  if (request.method !== 'GET') return false
  return (
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    request.headers.get('sec-fetch-dest') === 'document'
  )
}
