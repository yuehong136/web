import type { UploadFile } from '@/components/ui/file-uploader/types'

export interface ConfirmedDocumentUpload {
  file: UploadFile
  document: { id: string; name: string }
}

/** A 200 response only confirms files that can be matched to distinct document IDs. */
export function reconcileDocumentUploads(
  files: readonly UploadFile[],
  response: unknown,
): {
  confirmed: ConfirmedDocumentUpload[]
  unconfirmed: UploadFile[]
  valid: boolean
} {
  const invalid = () => ({
    confirmed: [],
    unconfirmed: [...files],
    valid: false,
  })
  if (!Array.isArray(response) || response.length > files.length)
    return invalid()
  const documents: { id: string; name: string }[] = []
  const ids = new Set<string>()
  for (const value of response) {
    if (
      !value ||
      typeof value !== 'object' ||
      typeof value.id !== 'string' ||
      !value.id.trim() ||
      value.id.trim() !== value.id ||
      typeof value.name !== 'string' ||
      !value.name ||
      ids.has(value.id)
    )
      return invalid()
    ids.add(value.id)
    documents.push({ id: value.id, name: value.name })
  }
  const byName = new Map<string, UploadFile[]>()
  files.forEach((file) =>
    byName.set(file.name, [...(byName.get(file.name) ?? []), file]),
  )
  for (const document of documents)
    if (!byName.has(document.name)) return invalid()
  // A partial result cannot identify which of two equal-name inputs succeeded.
  for (const [name, entries] of byName) {
    const returned = documents.filter(
      (document) => document.name === name,
    ).length
    if (
      returned > entries.length ||
      (returned > 0 && entries.length > 1 && returned !== entries.length)
    )
      return invalid()
  }
  const confirmed = documents.map((document) => ({
    file: byName.get(document.name)!.shift()!,
    document,
  }))
  const confirmedFiles = new Set(confirmed.map(({ file }) => file))
  return {
    confirmed,
    unconfirmed: files.filter((file) => !confirmedFiles.has(file)),
    valid: true,
  }
}
