'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { datasourceAPI } from '@/api/datasource'

interface BoxTokenFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

type AuthStatus = 'idle' | 'waiting' | 'success' | 'error'

/**
 * Box OAuth Token 字段组件
 */
export function BoxTokenField({ value, onChange, placeholder }: BoxTokenFieldProps) {
  const { t } = useTranslation()
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // 仅在组件首次挂载时解析初始值
  useEffect(() => {
    try {
      if (value) {
        const parsed = JSON.parse(value)
        if (parsed.client_id) setClientId(parsed.client_id)
        if (parsed.client_secret) setClientSecret(parsed.client_secret)
      }
    } catch {
      // 忽略解析错误
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  const startAuth = useCallback(async () => {
    if (!clientId || !clientSecret) {
      setAuthStatus('error')
      setErrorMessage(t('datasource.boxCredentialsRequired'))
      return
    }

    try {
      setAuthStatus('waiting')
      setErrorMessage('')

      const response = await datasourceAPI.oauth.startBox({
        client_id: clientId,
        client_secret: clientSecret,
      })

      const authWindow = window.open(
        response.auth_url,
        'box_auth',
        'width=600,height=700,scrollbars=yes'
      )

      const flowId = response.flow_id
      pollingRef.current = setInterval(async () => {
        try {
          const result = await datasourceAPI.oauth.pollBox({ flow_id: flowId })
          
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
  }, [clientId, clientSecret, onChange, t, authStatus])

  return (
    <div className="space-y-3">
      {/* Client ID 和 Secret 输入 */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="Client ID"
        />
        <Input
          type="password"
          value={clientSecret}
          onChange={(e) => setClientSecret(e.target.value)}
          placeholder="Client Secret"
        />
      </div>

      {/* Token JSON 输入 */}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || t('datasource.pasteBoxTokenPlaceholder')}
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
              {t('datasource.authenticateWithBox')}
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
