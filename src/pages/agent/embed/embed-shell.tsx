import { type ReactNode } from 'react'
import {
  AppScene,
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns'
import { cn } from '@/lib/utils'

interface EmbedShellProps {
  /** Top toolbar built by `EmbedToolbar`. */
  toolbar?: ReactNode
  /** Optional right rail (EditorRuntimeRail or null when `hide_rail=1`). */
  sidePanel?: ReactNode
  /** Canvas body. */
  children: ReactNode
  className?: string
}

/**
 * Minimal shell for the embed iframe. Visually parallel to
 * `StudioPageTemplate` but without `AppShell` (which carries the main-site
 * sidebar). Designed so its DOM and class structure can fall back to the same
 * Studio tokens — if the main project tweaks the studio surface tokens, the
 * embed automatically follows.
 */
export function EmbedShell({
  toolbar,
  sidePanel,
  children,
  className,
}: EmbedShellProps) {
  return (
    <div
      className={cn(
        'flex h-screen min-h-0 w-screen flex-col bg-components-studio-bg',
        className,
      )}
    >
      {toolbar}
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-auto">{children}</div>
        {sidePanel ? (
          <aside className="flex min-h-0 w-80 shrink-0 flex-col border-l border-components-studio-border">
            {sidePanel}
          </aside>
        ) : null}
      </div>
    </div>
  )
}

interface EmbedWaitingHostProps {
  parentOrigin: string
}

/**
 * Rendered before the host completes the `embed-init` handshake. Static
 * messaging only — no postMessage retry loop, because the host SDK is
 * responsible for sending init after `ready`.
 */
export function EmbedWaitingHost({ parentOrigin }: EmbedWaitingHostProps) {
  return (
    <PageLoadingState
      scene={AppScene.STUDIO}
      title="正在等待宿主初始化"
      description={`已就绪，等待 ${parentOrigin} 通过 postMessage 发送 embed-init。`}
    />
  )
}

interface EmbedAccessErrorProps {
  message: string
}

/**
 * Terminal error page for malformed URL params. Renders without any host
 * communication because we cannot trust an unverified parent at this point.
 */
export function EmbedAccessError({ message }: EmbedAccessErrorProps) {
  return (
    <PageErrorState
      scene={AppScene.STUDIO}
      title="无法加载嵌入页"
      description={message}
    />
  )
}

interface EmbedAuthErrorProps {
  onRetry?: () => void
}

/**
 * Rendered when the active JWT has been rejected and the host has not yet
 * supplied a refreshed one. `onRetry` should typically trigger a fresh
 * fetch / mount cycle after the host has acknowledged the auth-expired
 * notification.
 */
export function EmbedAuthError({ onRetry }: EmbedAuthErrorProps) {
  return (
    <PageErrorState
      scene={AppScene.STUDIO}
      title="身份验证已过期"
      description="嵌入身份过期或无效，等待宿主刷新 JWT。"
      retryLabel={onRetry ? '重试' : undefined}
      onRetry={onRetry}
    />
  )
}
