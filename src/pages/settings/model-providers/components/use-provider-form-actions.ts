import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  normalizeVerifyResult,
  type ApiKeyModalProps,
} from './api-key-modal-utils'
import { buildProviderFormCandidate } from './provider-form-candidate'
import type { ProviderDraft } from './provider-form-schema'

export function useProviderFormActions(
  props: ApiKeyModalProps,
  draft: ProviderDraft,
  local: boolean,
  toolsChanged: boolean,
) {
  const { t } = useTranslation()
  const mounted = useRef(false)
  const request = useRef(0)
  const [busy, setBusy] = useState<'save' | 'verify' | null>(null)
  const [verified, setVerified] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      request.current += 1
    }
  }, [])
  const invalidate = () => {
    request.current += 1
    setVerified(null)
    setError('')
  }
  const run = async (kind: 'save' | 'verify') => {
    if (busy) return
    const candidate = buildProviderFormCandidate(
      props.providerName,
      draft,
      local,
      !props.initialValues || toolsChanged,
    )
    setError('')
    setVerified(null)
    if (!candidate.ok) {
      setError(
        t(candidate.error, {
          field: candidate.field
            ? t(`settings.models.form.${candidate.field}`)
            : '',
        }),
      )
      return
    }
    const generation = ++request.current
    const current = () => mounted.current && request.current === generation
    setBusy(kind)
    try {
      if (kind === 'verify') {
        const result = await props.onVerify?.(
          candidate.apiKey,
          candidate.baseUrl,
          candidate.fields,
        )
        if (current())
          setVerified(normalizeVerifyResult(result).isValid === true)
      } else {
        await props.onSave(
          candidate.apiKey,
          candidate.baseUrl,
          candidate.fields,
        )
        if (current()) props.onClose()
      }
    } catch {
      if (current()) {
        if (kind === 'verify') setVerified(false)
        else
          setError(
            t(
              props.providerName === 'PaddleOCR'
                ? 'settings.models.paddleOCR.saveFailed'
                : 'settings.models.connection.saveFailed',
            ),
          )
      }
    } finally {
      if (mounted.current) setBusy(null)
    }
  }
  return { busy, verified, error, invalidate, run }
}
