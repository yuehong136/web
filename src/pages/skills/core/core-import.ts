import { APIError } from '@/api/client'
import { allCoreFiles, skillCoreAPI } from '@/api/skill-core'
import { normalizeSkillPath } from '../skill-upload-package'

export type CoreImportFile = { file: File; path: string }
export function prepareCoreDirectory(files: File[]): CoreImportFile[] {
  const root = files[0]?.webkitRelativePath?.split('/')[0]
  const seen = new Set<string>()
  return files
    .map((file) => {
      const relative = file.webkitRelativePath || file.name
      if (root && !relative.startsWith(root + '/'))
        throw new APIError(422, 'INVALID_PACKAGE', 'Invalid directory')
      const path = normalizeSkillPath(
        root ? relative.slice(root.length + 1) : relative,
      )
      if (seen.has(path))
        throw new APIError(422, 'INVALID_PACKAGE', 'Duplicate path')
      seen.add(path)
      return { file, path }
    })
    .sort((a, b) => a.path.localeCompare(b.path))
}

/** Each result is a real File ID. Partial writes stay visible for inspection. */
export async function uploadCoreDirectory(
  parent: string,
  entries: CoreImportFile[],
  onSaved: (count: number) => void,
) {
  const folders = new Map<string, string>([['', parent]])
  let saved = 0
  for (const entry of entries) {
    const parts = entry.path.split('/')
    parts.pop()
    let prefix = ''
    for (const part of parts) {
      const previous = prefix
      prefix = prefix ? `${prefix}/${part}` : part
      if (!folders.has(prefix)) {
        const folder = await skillCoreAPI.folder(folders.get(previous)!, part)
        folders.set(prefix, folder.id)
      }
    }
    const uploaded = await skillCoreAPI.upload(folders.get(prefix)!, entry.file)
    if (uploaded.length !== 1)
      throw new APIError(200, 'INVALID_SKILL_RESPONSE', 'Incomplete upload')
    onSaved(++saved)
  }
}

export async function createCoreVersion(
  spaceFolder: string,
  name: string,
  version: string,
) {
  for (const segment of [name, version]) {
    if (normalizeSkillPath(segment).includes('/'))
      throw new APIError(422, 'INVALID_PACKAGE', 'Invalid folder name')
  }
  const existing = await allCoreFiles(spaceFolder)
  let skill = existing.find(
    (file) => file.name === name && file.type === 'folder',
  )
  if (!skill) skill = await skillCoreAPI.folder(spaceFolder, name)
  const versions = await allCoreFiles(skill.id)
  if (versions.some((file) => file.name === version))
    throw new APIError(409, 'CORE_VERSION_EXISTS', 'Version folder exists')
  const folder = await skillCoreAPI.folder(skill.id, version)
  return { skill, folder }
}
