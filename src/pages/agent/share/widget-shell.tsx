import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MessageCircle, X } from 'lucide-react'

export function WidgetLauncher() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    window.parent.postMessage(
      {
        type: 'CREATE_CHAT_WINDOW',
        src: window.location.href.replace('mode=master', 'mode=window'),
      },
      '*',
    )
  }, [])

  const toggle = () => {
    const nextOpen = !open
    setOpen(nextOpen)
    window.parent.postMessage(
      {
        type: 'TOGGLE_CHAT',
        isOpen: nextOpen,
      },
      '*',
    )
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-transparent">
      <Button
        size="icon-lg"
        className="rounded-radius-full shadow-elevation-high"
        onClick={toggle}
        aria-label={
          open
            ? t('agent.share.closeWidget', '关闭聊天浮窗')
            : t('agent.share.openWidget', '打开聊天浮窗')
        }
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}
      </Button>
    </div>
  )
}

export function WidgetShell({
  title,
  children,
  variant = 'iframe',
}: {
  title: string
  children: ReactNode
  variant?: 'iframe' | 'panel'
}) {
  const { t } = useTranslation()
  return (
    <div
      className={cn(
        'rounded-radius-lg bg-surface-primary shadow-elevation-high flex flex-col overflow-hidden border border-border-default',
        variant === 'iframe' ? 'h-screen w-screen' : 'h-full w-full',
      )}
    >
      <header className="px-space-base py-space-sm flex items-center justify-between border-b border-border-subtle">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">
            {title}
          </p>
          <p className="text-xs text-text-secondary">
            {t('agent.share.agentWidget', 'Agent Widget')}
          </p>
        </div>
      </header>
      {children}
    </div>
  )
}

export function useTransparentDocument() {
  const originalRef = useRef<{
    htmlBackground: string
    bodyBackground: string
    bodyMargin: string
  } | null>(null)

  useEffect(() => {
    originalRef.current = {
      htmlBackground: document.documentElement.style.background,
      bodyBackground: document.body.style.background,
      bodyMargin: document.body.style.margin,
    }
    document.documentElement.style.background = 'transparent'
    document.body.style.background = 'transparent'
    document.body.style.margin = '0'

    return () => {
      if (!originalRef.current) {
        return
      }
      document.documentElement.style.background =
        originalRef.current.htmlBackground
      document.body.style.background = originalRef.current.bodyBackground
      document.body.style.margin = originalRef.current.bodyMargin
    }
  }, [])
}
