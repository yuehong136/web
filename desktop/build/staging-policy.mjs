import path from 'node:path'

export const REQUIRED_RENDERER_ROOT_FILES = Object.freeze([
  'iconfont.js',
  'index.html',
  'openapi.json',
  'theme-init.js',
])

export const ALLOWED_RENDERER_ROOT_DIRECTORIES = Object.freeze([
  'assets',
  'js',
  'pdfjs-dist',
  'vs',
])

const allowedExtensionsByRoot = Object.freeze({
  assets: new Set([
    '.avif',
    '.css',
    '.eot',
    '.gif',
    '.ico',
    '.jpeg',
    '.jpg',
    '.js',
    '.json',
    '.mjs',
    '.otf',
    '.png',
    '.svg',
    '.ttf',
    '.wasm',
    '.webp',
    '.woff',
    '.woff2',
  ]),
  js: new Set(['.css', '.js', '.mjs', '.wasm']),
  'pdfjs-dist': new Set(['.bcmap']),
  vs: new Set([
    '.css',
    '.js',
    '.json',
    '.png',
    '.svg',
    '.ttf',
    '.woff',
    '.woff2',
  ]),
})

const forbiddenDirectoryNames = new Set([
  '__tests__',
  'fixture',
  'fixtures',
  'spec',
  'specs',
  'test',
  'tests',
])

const forbiddenSourceExtensions = new Set([
  '.jsx',
  '.less',
  '.sass',
  '.scss',
  '.svelte',
  '.ts',
  '.tsx',
  '.vue',
])

const forbiddenCredentialExtensions = new Set([
  '.cer',
  '.crt',
  '.der',
  '.key',
  '.p12',
  '.pem',
  '.pfx',
])

export function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/')
}

export function validateRendererRootEntry(entryName, isDirectory) {
  if (isDirectory) {
    if (!ALLOWED_RENDERER_ROOT_DIRECTORIES.includes(entryName)) {
      throw new Error(
        `renderer contains unknown top-level directory: ${entryName}`,
      )
    }
    return
  }

  if (!REQUIRED_RENDERER_ROOT_FILES.includes(entryName)) {
    throw new Error(`renderer contains unknown top-level file: ${entryName}`)
  }
}

export function validateRendererFile(relativePath) {
  const normalizedPath = toPosixPath(relativePath)
  const segments = normalizedPath.split('/')
  const fileName = segments.at(-1)

  if (!fileName || segments.length < 2) {
    throw new Error(
      `renderer file is outside an allowlisted directory: ${normalizedPath}`,
    )
  }

  const lowerSegments = segments.map((segment) => segment.toLowerCase())
  const lowerFileName = fileName.toLowerCase()

  if (lowerSegments.some((segment) => forbiddenDirectoryNames.has(segment))) {
    throw new Error(
      `renderer contains test or fixture content: ${normalizedPath}`,
    )
  }

  if (
    lowerSegments.some(
      (segment) => segment === '.env' || segment.startsWith('.env.'),
    ) ||
    lowerFileName === '.ds_store' ||
    lowerFileName === 'stats.html' ||
    lowerFileName.includes('.test.') ||
    lowerFileName.includes('.spec.')
  ) {
    throw new Error(
      `renderer contains a forbidden development file: ${normalizedPath}`,
    )
  }

  const matchedSourceExtension = [...forbiddenSourceExtensions].find(
    (extension) => lowerFileName.endsWith(extension),
  )
  if (matchedSourceExtension) {
    throw new Error(
      `renderer contains source or source-map content: ${normalizedPath}`,
    )
  }

  const extension = path.posix.extname(lowerFileName)
  if (forbiddenCredentialExtensions.has(extension)) {
    throw new Error(
      `renderer contains credential-like content: ${normalizedPath}`,
    )
  }

  const rootDirectory = segments[0]
  if (rootDirectory === 'pdfjs-dist' && fileName === 'LICENSE') {
    return
  }

  const allowedExtensions = allowedExtensionsByRoot[rootDirectory]
  if (!allowedExtensions?.has(extension)) {
    throw new Error(
      `renderer contains an unapproved file type: ${normalizedPath}`,
    )
  }
}

export function shouldOmitGeneratedRendererFile(relativePath) {
  const normalizedPath = toPosixPath(relativePath)
  const fileName = normalizedPath.split('/').at(-1)?.toLowerCase()
  return fileName === 'stats.html' || Boolean(fileName?.endsWith('.map'))
}
