'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { datasourceAPI } from '@/api/datasource'

interface GmailTokenFieldProps {
  value: string
  onChange: (value: string) => void
}

type AuthStatus = 'idle' | 'waiting' | 'success' | 'error'

/**
 * Gmail OAuth Token 字段组件
 */
export function GmailTokenField({ value, onChange }: GmailTokenFieldProps) {
  const { t } = useTranslation()
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  const startAuth = useCallback(async () => {
    try {
      setAuthStatus('waiting')
      setErrorMessage('')

      const response = await datasourceAPI.oauth.startGmail({
        credentials: value || '{}',
      })

      const authWindow = window.open(
        response.auth_url,
        'gmail_auth',
        'width=600,height=700,scrollbars=yes'
      )

      const flowId = response.flow_id
      pollingRef.current = setInterval(async () => {
        try {
          const result = await datasourceAPI.oauth.pollGmail({ flow_id: flowId })
          
          if (result.status === 'completed' && result.tokens) {
            onChange(result.tokens)
            setAuthStatus('success')
            if (pollingRef.current) {
              clearInterval(pollingRef.current)
              pollingRef.current = null
            }
            authWindow?.close()
          } else if (result.status === 'error') {
            setAuthStatus('error')
            setErrorMessage(t('datasource.oauthError'))
            if (pollingRef.current) {
              clearInterval(pollingRef.current)
              pollingRef.current = null
            }
            authWindow?.close()
          }
        } catch {
          // 继续轮询
        }
      }, 3000)

      setTimeout(() => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
          if (authStatus === 'waiting') {
            setAuthStatus('error')
            setErrorMessage(t('datasource.oauthTimeout'))
          }
        }
      }, 30000)
    } catch (error: any) {
      setAuthStatus('error')
      setErrorMessage(error?.message || t('datasource.oauthError'))
    }
  }, [value, onChange, t, authStatus])

  return (
    <div className="space-y-3">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('datasource.pasteOAuthTokenPlaceholder')}
        rows={4}
        className="font-mono text-sm"
      />

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={startAuth}
          disabled={authStatus === 'waiting'}
          className="gap-2"
        >
          {authStatus === 'waiting' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('datasource.waitingForAuth')}
            </>
          ) : (
            <>
              <ExternalLink className="h-4 w-4" />
              {t('datasource.authenticateWithGmail')}
            </>
          )}
        </Button>

        {authStatus === 'success' && (
          <div className="flex items-center gap-1 text-status-success text-sm">
            <CheckCircle className="h-4 w-4" />
            {t('datasource.authSuccess')}
          </div>
        )}
        {authStatus === 'error' && (
          <div className="flex items-center gap-1 text-status-error text-sm">
            <XCircle className="h-4 w-4" />
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  )
}
