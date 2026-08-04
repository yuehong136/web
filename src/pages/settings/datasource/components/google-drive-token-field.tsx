'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { datasourceAPI } from '@/api/datasource'

interface GoogleDriveTokenFieldProps {
  value: string
  onChange: (value: string) => void
}

type AuthStatus = 'idle' | 'waiting' | 'success' | 'error'

/**
 * Google Drive OAuth Token 字段组件
 * 支持两种方式：
 * 1. 直接粘贴 OAuth Token JSON
 * 2. 通过 Web OAuth 流程获取
 */
export function GoogleDriveTokenField({
  value,
  onChange,
}: GoogleDriveTokenFieldProps) {
  const { t } = useTranslation()
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  // 开始 OAuth 认证
  const startAuth = useCallback(async () => {
    try {
      setAuthStatus('waiting')
      setErrorMessage('')

      // 获取认证 URL
      const response = await datasourceAPI.oauth.startGoogleDrive({
        credentials: value || '{}',
      })

      // 打开认证窗口
      const authWindow = window.open(
        response.authorization_url,
        'google_auth',
        'width=600,height=700,scrollbars=yes',
      )

      // 开始轮询结果
      const flowId = response.flow_id
      const stopPolling = () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
      }
      pollingRef.current = setInterval(async () => {
        try {
          const result = await datasourceAPI.oauth.pollGoogleDrive({
            flow_id: flowId,
          })

          if (result.status === 'completed') {
            onChange(String(result.credentials))
            setAuthStatus('success')
            stopPolling()
            authWindow?.close()
          }
        } catch (error) {
          setAuthStatus('error')
          setErrorMessage(
            error instanceof Error ? error.message : t('datasource.oauthError'),
          )
          stopPolling()
          authWindow?.close()
        }
      }, 3000)

      // 与后端 flow 有效期一致（15 分钟）：用户要在弹窗里登录并授权，30 秒根本不够
      setTimeout(
        () => {
          if (pollingRef.current) {
            stopPolling()
            if (authStatus === 'waiting') {
              setAuthStatus('error')
              setErrorMessage(t('datasource.oauthTimeout'))
            }
          }
        },
        15 * 60 * 1000,
      )
    } catch (error: any) {
      setAuthStatus('error')
      setErrorMessage(error?.message || t('datasource.oauthError'))
    }
  }, [value, onChange, t, authStatus])

  return (
    <div className="space-y-3">
      {/* 手动输入区域 */}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('datasource.pasteOAuthTokenPlaceholder')}
        rows={4}
        className="font-mono text-sm"
      />

      {/* OAuth 认证按钮 */}
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
              {t('datasource.authenticateWithGoogle')}
            </>
          )}
        </Button>

        {/* 状态指示 */}
        {authStatus === 'success' && (
          <div className="flex items-center gap-1 text-sm text-status-success">
            <CheckCircle className="h-4 w-4" />
            {t('datasource.authSuccess')}
          </div>
        )}
        {authStatus === 'error' && (
          <div className="flex items-center gap-1 text-sm text-status-error">
            <XCircle className="h-4 w-4" />
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  )
}
