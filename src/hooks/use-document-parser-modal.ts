import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { Document } from '@/types/api'
import {
  captureDocumentParserRequest,
  type DocumentParserPatch,
} from '@/api/knowledge-document-parser'
import { useUpdateDocumentParser } from './use-update-document-parser'
import { useDocumentParserActor } from './use-document-parser-actor'
import { parserErrorKey } from '@/components/knowledge/document-parser/errors'

export type DocumentParserSubmission = {
  docId: string
  patch: DocumentParserPatch
}

export function useDocumentParserModal(datasetId: string) {
  const actor = useDocumentParserActor()
  const { updateDocumentParser } = useUpdateDocumentParser()
  const [document, setDocument] = useState<Document | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errorKey, setErrorKey] = useState<string>()
  const [session, setSession] = useState(0)
  const ownerRef = useRef({ active: false, session: 0, busy: false, docId: '' })
  const scope = `${datasetId}:${actor.key}`
  const [stateScope, setStateScope] = useState<string>()
  useLayoutEffect(() => {
    const owner = { active: true, session: 0, busy: false, docId: '' }
    ownerRef.current = owner
    return () => {
      owner.active = false
    }
  }, [datasetId, actor])
  const show = useCallback(
    (doc: Document) => {
      const owner = ownerRef.current
      if (!owner.active || doc.kb_id !== datasetId) return
      setStateScope(scope)
      owner.session += 1
      owner.docId = doc.id
      owner.busy = false
      setSession(owner.session)
      setDocument(structuredClone(doc))
      setOpen(true)
      setBusy(false)
      setErrorKey(undefined)
    },
    [datasetId, scope],
  )
  const close = useCallback(() => {
    const owner = ownerRef.current
    if (!owner.active) return
    owner.session += 1
    owner.docId = ''
    owner.busy = false
    setOpen(false)
    setDocument(null)
    setBusy(false)
    setErrorKey(undefined)
  }, [])
  const submit = useCallback(
    async ({ docId, patch }: DocumentParserSubmission) => {
      const owner = ownerRef.current
      if (
        !owner.active ||
        owner.busy ||
        docId !== owner.docId ||
        !actor.isCurrent()
      )
        return
      const submittedSession = owner.session
      const current = () =>
        owner.active && owner.session === submittedSession && actor.isCurrent()
      if (!Object.keys(patch).length) {
        if (current()) close()
        return
      }
      owner.busy = true
      setBusy(true)
      setErrorKey(undefined)
      try {
        const request = captureDocumentParserRequest(datasetId, docId, patch)
        await updateDocumentParser({
          ...request,
          isCurrentActor: actor.isCurrent,
        })
        if (current()) close()
      } catch (error) {
        if (current()) setErrorKey(parserErrorKey(error))
      } finally {
        if (owner.session === submittedSession) owner.busy = false
        if (current()) setBusy(false)
      }
    },
    [actor, close, datasetId, updateDocumentParser],
  )
  const ownsState = stateScope === scope
  return {
    document: ownsState ? document : null,
    open: ownsState && open,
    busy: ownsState && busy,
    errorKey: ownsState ? errorKey : undefined,
    session,
    actorKey: actor.key,
    show,
    close,
    submit,
  }
}
