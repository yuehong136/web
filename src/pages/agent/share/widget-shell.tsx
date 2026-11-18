import { playWidgetSound } from './widget-sound'
import type { WidgetSettings } from './widget-settings'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MessageCircle, X } from 'lucide-react'

type WidgetHostMessage =
  | { type: 'CREATE_CHAT_WINDOW'; src: string }
  | { type: 'TOGGLE_CHAT'; isOpen: boolean }

function postWidgetHostMessage(message: WidgetHostMessage) {
  window.parent.postMessage(message, '*')
}

export function WidgetLauncher({ muted = false }: { muted?: boolean }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('mode', 'window')
    postWidgetHostMessage({ type: 'CREATE_CHAT_WINDOW', src: url.href })
  }, [])

  const toggle = () => {
    const nextOpen = !open
    if (nextOpen) playWidgetSound(muted)
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
      className="widget-launcher rounded-radius-full shadow-elevation-high"
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

export function WidgetStandalonePreview({
  children,
  muted = false,
}: {
  children: ReactNode
  muted?: boolean
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)

  const toggle = () => {
    if (!open) playWidgetSound(muted)
    setHasOpened(true)
    setOpen((previous) => !previous)
  }

  return (
    <div className="min-h-screen bg-surface">
      {hasOpened && (
        <div
          hidden={!open}
          className="fixed right-6 bottom-24 h-[500px] max-h-[calc(100dvh-120px)] w-[380px] max-w-[calc(100vw-48px)] overflow-hidden rounded-radius-lg"
        >
          <Button
            variant="ghost"
            size="icon-sm"
            className="widget-close absolute top-space-sm right-space-sm z-10"
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
  avatar,
  children,
  variant = 'iframe',
  settings,
}: {
  title: string
  /** The agent's identity in the header; omitted when the share hides it. */
  avatar?: { src?: string; seed?: string }
  children: ReactNode
  variant?: 'iframe' | 'panel'
  settings?: WidgetSettings
}) {
  const { t } = useTranslation()
  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-radius-lg border border-line bg-surface shadow-elevation-high',
        variant === 'iframe' ? 'h-screen w-screen' : 'h-full w-full',
      )}
    >
      <header className="widget-header flex items-center gap-space-sm border-b border-line-subtle px-space-base py-space-sm">
        {avatar ? (
          <EntityAvatar
            name={settings?.widgetTitle.trim() || title}
            src={avatar.src}
            seed={avatar.seed}
            badge="agent"
          />
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-fg">
            {settings?.widgetTitle.trim() || title}
          </p>
          <p className="text-xs text-fg-muted">
            {settings?.widgetSubtitle ||
              t('agent.share.agentWidget', 'Agent Widget')}
          </p>
        </div>
      </header>
      {children}
      {settings?.widgetFooterText && (
        <footer className="widget-footer shrink-0 px-space-base py-space-sm text-center text-xs">
          {settings.widgetFooterLink ? (
            <a
              href={settings.widgetFooterLink}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              {settings.widgetFooterText}
            </a>
          ) : (
            settings.widgetFooterText
          )}
        </footer>
      )}
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
