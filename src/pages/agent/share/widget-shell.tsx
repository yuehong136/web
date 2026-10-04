import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MessageCircle, X } from 'lucide-react'

type WidgetHostMessage =
  | { type: 'CREATE_CHAT_WINDOW'; src: string }
  | { type: 'TOGGLE_CHAT'; isOpen: boolean }

function postWidgetHostMessage(message: WidgetHostMessage) {
  window.parent.postMessage(message, '*')
}

export function WidgetLauncher() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('mode', 'window')
    postWidgetHostMessage({ type: 'CREATE_CHAT_WINDOW', src: url.href })
  }, [])

  const toggle = () => {
    const nextOpen = !open
    setOpen(nextOpen)
    postWidgetHostMessage({ type: 'TOGGLE_CHAT', isOpen: nextOpen })
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-transparent">
      <WidgetToggleButton open={open} onToggle={toggle} />
    </div>
  )
}

function WidgetToggleButton({
  open,
  onToggle,
}: {
  open: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  return (
    <Button
      size="icon-lg"
      className="rounded-radius-full shadow-elevation-high"
      onClick={onToggle}
      aria-expanded={open}
      aria-label={
        open
          ? t('agent.share.closeWidget', '关闭聊天浮窗')
          : t('agent.share.openWidget', '打开聊天浮窗')
      }
    >
      {open ? (
        <X className="size-icon-lg" />
      ) : (
        <MessageCircle className="size-icon-lg" />
      )}
    </Button>
  )
}

export function WidgetStandalonePreview({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)

  const toggle = () => {
    setHasOpened(true)
    setOpen((previous) => !previous)
  }

  return (
    <div className="min-h-screen bg-background-body">
      {hasOpened && (
        <div
          hidden={!open}
          className="fixed right-6 bottom-24 h-[500px] max-h-[calc(100dvh-120px)] w-[380px] max-w-[calc(100vw-48px)] overflow-hidden rounded-radius-lg"
        >
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute top-space-sm right-space-sm z-10"
            onClick={() => setOpen(false)}
            aria-label={t('agent.share.closeWidget', '关闭聊天浮窗')}
          >
            <X className="size-icon-md" />
          </Button>
          {children}
        </div>
      )}
      <div className="fixed right-space-lg bottom-space-lg">
        <WidgetToggleButton open={open} onToggle={toggle} />
      </div>
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
        'flex flex-col overflow-hidden rounded-radius-lg border border-border-default bg-background-surface shadow-elevation-high',
        variant === 'iframe' ? 'h-screen w-screen' : 'h-full w-full',
      )}
    >
      <header className="flex items-center justify-between border-b border-border-subtle px-space-base py-space-sm">
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
