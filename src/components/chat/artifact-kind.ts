/** Preview capabilities are bounded by existing download resources. */
export type ArtifactPreviewKind = 'html' | 'image' | 'text' | 'unsupported'

export function artifactPreviewKind(filename: string): ArtifactPreviewKind {
  const extension = filename.split('.').at(-1)?.toLowerCase()
  if (extension === 'html' || extension === 'htm') return 'html'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(extension ?? ''))
    return 'image'
  if (
    [
      'txt',
      'text',
      'md',
      'markdown',
      'json',
      'csv',
      'log',
      'ts',
      'tsx',
      'js',
      'jsx',
      'py',
      'yaml',
      'yml',
      'xml',
      'css',
      'sql',
      'sh',
    ].includes(extension ?? '')
  )
    return 'text'
  return 'unsupported'
}
