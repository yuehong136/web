import { useCallback, useState } from 'react'
import type { Document } from '@/types/api'

/**
 * The document shown in the Inspector. It follows the live list row so a
 * running parse keeps updating, and falls back to the row it was opened with
 * while that row is off the current page.
 */
export function useDocumentInspector(documents: Document[]) {
  const [selected, setSelected] = useState<Document | null>(null)
  const live = selected
    ? (documents.find((doc) => doc.id === selected.id) ?? selected)
    : null

  const openDocument = useCallback((doc: Document) => setSelected(doc), [])
  const close = useCallback(() => setSelected(null), [])
  const closeIfShowing = useCallback(
    (ids: string[]) =>
      setSelected((current) =>
        current && ids.includes(current.id) ? null : current,
      ),
    [],
  )

  return {
    document: live,
    open: live !== null,
    openDocument,
    close,
    closeIfShowing,
  }
}

export type DocumentInspectorState = ReturnType<typeof useDocumentInspector>
