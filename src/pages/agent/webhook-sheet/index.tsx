import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { Copy, Check } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface WebhookSheetProps {
  hideModal?: (open: boolean) => void
  webhookUrl?: string
}

export function WebhookSheet({ hideModal, webhookUrl = '' }: WebhookSheetProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }, [webhookUrl])

  return (
    <Sheet open onOpenChange={hideModal} modal={false}>
      <SheetContent
        className={cn('top-20 h-auto flex flex-col')}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-space-sm">
            {t('flow.webhookConfiguration', 'Webhook 配置')}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-space-lg py-space-lg">
          {/* Webhook URL */}
          <div className="space-y-space-sm">
            <label className="text-sm font-medium">
              {t('flow.webhookUrl', 'Webhook URL')}
            </label>
            <div className="flex gap-space-sm">
              <Input
                value={webhookUrl}
                readOnly
                className="flex-1 bg-surface-secondary"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyUrl}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="size-4 text-status-success" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-text-secondary">
              {t('flow.webhookUrlDescription', '使用此 URL 来触发 Agent 工作流')}
            </p>
          </div>

          {/* 请求示例 */}
          <div className="space-y-space-sm">
            <label className="text-sm font-medium">
              {t('flow.requestExample', '请求示例')}
            </label>
            <pre className="text-xs bg-surface-secondary p-space-sm rounded-radius-md overflow-auto max-h-40">
{`curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "Hello"}'`}
            </pre>
          </div>

          {/* 状态 */}
          <div className="space-y-space-sm">
            <label className="text-sm font-medium">
              {t('flow.webhookStatus', '状态')}
            </label>
            <div className="flex items-center gap-space-sm">
              <span className="size-2 rounded-full bg-status-success" />
              <span className="text-sm">{t('flow.webhookActive', '已激活')}</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
