import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'

interface ErrorBannerProps {
  message?: string
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  if (!message) {
    return null
  }

  return (
    <div className="rounded-radius-md border border-status-error bg-status-error/10 p-space-base">
      <div className="flex items-start gap-space-sm">
        <AlertTriangle className="mt-[2px] size-4 shrink-0 text-status-error" />
        <div className="min-w-0 space-y-space-xs">
          <Badge variant="destructive">运行错误</Badge>
          <p className="whitespace-pre-wrap text-sm text-status-error">
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}
