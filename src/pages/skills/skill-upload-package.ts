import { APIError } from '@/api/client'
import type { SkillManifest } from '@/api/skill-types'

const rejectPackage = () =>
  new APIError(422, 'INVALID_PACKAGE', 'Invalid skill package')
export function normalizeSkillPath(path: string): string {
  const value = path.normalize('NFC')
  if (
    !value ||
    Array.from(value).length > 512 ||
    value.includes('\\') ||
    Array.from(value).some(
      (char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127,
    ) ||
    value
      .split('/')
      .some(
        (part) =>
          !part ||
          part === '.' ||
          part === '..' ||
          Array.from(part).length > 255,
      )
  )
    throw rejectPackage()
  return value
}
const encoder = new TextEncoder()
export function compareSkillPaths(left: string, right: string): number {
  const a = encoder.encode(left),
    b = encoder.encode(right)
  for (let i = 0; i < Math.min(a.length, b.length); i++)
    if (a[i] !== b[i]) return a[i] - b[i]
  return a.length - b.length
}
/** Remove only the explicit directory-picker root; ZIP paths are server-owned. */
export async function prepareSkillDirectory(
  files: File[],
  name: string,
  version: string,
  activate: boolean,
): Promise<{ files: File[]; manifest: SkillManifest }> {
  if (!files.length || files.length > 1000) throw rejectPackage()
  const root = files[0].webkitRelativePath?.split('/')[0]
  let total = 0
  const paths = new Set<string>()
  const entries = files
    .map((file) => {
      const relative = file.webkitRelativePath || file.name
      if (root && !relative.startsWith(`${root}/`)) throw rejectPackage()
      const path = normalizeSkillPath(
        root ? relative.slice(root.length + 1) : relative,
      )
      total += file.size
      if (
        paths.has(path) ||
        file.size > 5 * 1024 * 1024 ||
        total > 50 * 1024 * 1024
      )
        throw rejectPackage()
      paths.add(path)
      return { path, file }
    })
    .sort((a, b) => compareSkillPaths(a.path, b.path))
  if (!paths.has('SKILL.md')) throw rejectPackage()
  const manifestFiles = []
  for (const entry of entries) {
    const hash = await crypto.subtle.digest(
      'SHA-256',
      await entry.file.arrayBuffer(),
    )
    manifestFiles.push({
      path: entry.path,
      size: entry.file.size,
      sha256: Array.from(new Uint8Array(hash), (byte) =>
        byte.toString(16).padStart(2, '0'),
      ).join(''),
    })
  }
  return {
    files: entries.map((entry) => entry.file),
    manifest: { name, version, activate, files: manifestFiles },
  }
}
