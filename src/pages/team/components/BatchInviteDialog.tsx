/**
 * 批量邀请成员对话框
 * 支持多邮箱输入、前端校验、逐条结果展示
 */

import React, { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { UserPlus, Loader2, Send } from 'lucide-react'
import { InviteResultsView } from './InviteResultsView'
import type { BatchInviteResponse } from '@/types/team'

interface BatchInviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvite: (emails: string[]) => Promise<BatchInviteResponse>
  isLoading?: boolean
}

type DialogPhase = 'input' | 'submitting' | 'results'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** 将输入文本解析为去重的邮箱列表 */
const parseEmails = (text: string): string[] => {
  const raw = text
    .split(/[\n,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return [...new Set(raw)]
}

export const BatchInviteDialog: React.FC<BatchInviteDialogProps> = ({
  open,
  onOpenChange,
  onInvite,
  isLoading = false,
}) => {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [phase, setPhase] = useState<DialogPhase>('input')
  const [results, setResults] = useState<BatchInviteResponse | null>(null)

  const parsedEmails = React.useMemo(() => parseEmails(input), [input])
  const invalidEmails = React.useMemo(
    () => parsedEmails.filter((e) => !EMAIL_REGEX.test(e)),
    [parsedEmails]
  )
  const validEmails = React.useMemo(
    () => parsedEmails.filter((e) => EMAIL_REGEX.test(e)),
    [parsedEmails]
  )

  const handleSubmit = useCallback(async () => {
    setError('')

    if (parsedEmails.length === 0) {
      setError('请输入至少一个邮箱地址')
      return
    }

    if (invalidEmails.length > 0 && validEmails.length === 0) {
      setError('所有输入的邮箱格式均无效')
      return
    }

    setPhase('submitting')
    try {
      // 发送所有解析出的邮箱（包括无效的，让后端统一返回结果）
      const response = await onInvite(parsedEmails)
      setResults(response)
      setPhase('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : '邀请失败，请重试')
      setPhase('input')
    }
  }, [parsedEmails, invalidEmails, validEmails, onInvite])

  const handleClose = useCallback(() => {
    setInput('')
    setError('')
    setPhase('input')
    setResults(null)
    onOpenChange(false)
  }, [onOpenChange])

  const handleBack = useCallback(() => {
    setPhase('input')
    setResults(null)
  }, [])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            邀请成员
          </DialogTitle>
          <DialogDescription>
            {phase === 'results'
              ? '邀请已发送，以下是每个邮箱的处理结果'
              : '输入成员邮箱地址，每行一个或用逗号分隔，批量发送邀请'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          {/* 输入阶段 */}
          {(phase === 'input' || phase === 'submitting') && (
            <div className="space-y-3">
              <Label htmlFor="emails">邮箱地址</Label>
              <Textarea
                id="emails"
                placeholder={'user1@example.com\nuser2@example.com\nuser3@example.com'}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  setError('')
                }}
                disabled={phase === 'submitting'}
                className="min-h-[120px] font-mono text-sm"
              />

              {/* 解析提示 */}
              <div className="flex items-center justify-between text-xs text-text-tertiary">
                <span>
                  {parsedEmails.length > 0
                    ? `已识别 ${parsedEmails.length} 个邮箱${invalidEmails.length > 0 ? `（${invalidEmails.length} 个格式无效）` : ''}`
                    : '支持每行一个邮箱，或用逗号、分号分隔'}
                </span>
              </div>

              {/* 无效邮箱预览 */}
              {invalidEmails.length > 0 && (
                <div className="text-xs text-state-warning bg-state-warning-subtle/50 rounded-lg px-3 py-2">
                  格式无效：{invalidEmails.join(', ')}
                </div>
              )}

              {error && (
                <p className="text-sm" style={{ color: 'var(--color-status-error-text)' }}>
                  {error}
                </p>
              )}
            </div>
          )}

          {/* 结果阶段 */}
          {phase === 'results' && results && (
            <InviteResultsView results={results.results} summary={results.summary} />
          )}
        </div>

        <DialogFooter>
          {phase === 'results' ? (
            <>
              <Button variant="outline" onClick={handleBack}>
                继续邀请
              </Button>
              <Button onClick={handleClose}>完成</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={phase === 'submitting'}>
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={phase === 'submitting' || isLoading || parsedEmails.length === 0}
              >
                {phase === 'submitting' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    发送中...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    发送邀请{validEmails.length > 0 ? ` (${validEmails.length})` : ''}
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

BatchInviteDialog.displayName = 'BatchInviteDialog'
