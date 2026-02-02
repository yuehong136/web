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
export function GoogleDriveTokenField({ value, onChange }: GoogleDriveTokenFieldProps) {
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
        response.auth_url,
        'google_auth',
        'width=600,height=700,scrollbars=yes'
      )

      // 开始轮询结果
      const flowId = response.flow_id
      pollingRef.current = setInterval(async () => {
        try {
          const result = await datasourceAPI.oauth.pollGoogleDrive({ flow_id: flowId })
          
          if (result.status === 'completed' && result.tokens) {
            // 认证成功
            onChange(result.tokens)
            setAuthStatus('success')
            if (pollingRef.current) {
              clearInterval(pollingRef.current)
              pollingRef.current = null
            }
            authWindow?.close()
          } else if (result.status === 'error') {
            // 认证失败
            setAuthStatus('error')
            setErrorMessage(t('datasource.oauthError'))
            if (pollingRef.current) {
              clearInterval(pollingRef.current)
              pollingRef.current = null
            }
            authWindow?.close()
          }
        } catch {
          // 忽略轮询错误，继续轮询
        }
      }, 3000)

      // 30 秒超时
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
