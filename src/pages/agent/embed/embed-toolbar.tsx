import { useCallback } from 'react'
import { PageHeader } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Compass,
  History,
  Link2,
  MessageSquareCode,
  Play,
  Save,
  Settings2,
} from 'lucide-react'
import type { EmbedShowKey } from './use-embed-access'
import type { EmbedNavigateTarget } from './protocol'

export interface EmbedToolbarProps {
  /** Display title (editable input). */
  title: string
  onTitleChange: (next: string) => void

  /** Whitelist of buttons to render. */
  show: ReadonlySet<EmbedShowKey>

  /** Save handler: directly invokes useSaveGraph in the parent component. */
  onSave: () => void
  saving: boolean

  /** Runtime workbench opener (P0: optional, gated by `show=run`). */
  onRun?: () => void

  /** Navigation requests get bridged to the host via postMessage. */
  onNavigateRequest: (target: EmbedNavigateTarget) => void

  /** Optional banner / description below the title. */
  description?: string
}

/**
 * Toolbar for the embed shell. Imports the main project's PageHeader and
 * Button so any visual upgrade to those primitives automatically propagates
 * here. The shape mirrors `AgentEditorPage`'s toolbar but with embed-specific
 * wiring: save calls useSaveGraph (real backend write), navigation buttons
 * postMessage to the host instead of `navigate(...)`.
 *
 * The `share` button is intentionally absent — embedded surfaces must never
 * generate further embedding links (套娃 / scope inflation).
 */
export function EmbedToolbar({
  title,
  onTitleChange,
  show,
  onSave,
  saving,
  onRun,
  onNavigateRequest,
  description,
}: EmbedToolbarProps) {
  const handleNav = useCallback(
    (target: EmbedNavigateTarget) => () => onNavigateRequest(target),
    [onNavigateRequest],
  )

  const showNav = show.has('nav')
  const showPublish = show.has('publish')
  const showWebhook = show.has('webhook')
  const showSettings = show.has('settings')
  const showVariables = show.has('variables')
  const showRun = show.has('run') && Boolean(onRun)

  return (
    <PageHeader
      compact
      title={
        <div className="gap-space-sm flex max-w-xl items-center">
          <Input
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            className="h-11 text-base font-semibold"
            placeholder="输入 Agent 名称"
          />
        </div>
      }
      description={description}
      actions={
        <>
          {showNav ? (
            <>
              <Button variant="outline" onClick={handleNav('back')}>
                <ArrowLeft className="mr-space-xs h-4 w-4" />
                返回
              </Button>
              <Button variant="outline" onClick={handleNav('explore')}>
                <Compass className="mr-space-xs h-4 w-4" />
                Explore
              </Button>
            </>
          ) : null}

          {showPublish ? (
            <Button variant="outline" onClick={handleNav('versions')}>
              <History className="mr-space-xs h-4 w-4" />
              发布
            </Button>
          ) : null}

          {showWebhook ? (
            <Button variant="outline" onClick={handleNav('webhook')}>
              <Link2 className="mr-space-xs h-4 w-4" />
              Webhook
            </Button>
          ) : null}

          {showVariables ? (
            <Button variant="outline" onClick={handleNav('variables')}>
              <MessageSquareCode className="mr-space-xs h-4 w-4" />
              会话变量
            </Button>
          ) : null}

          {showSettings ? (
            <Button variant="outline" onClick={handleNav('settings')}>
              <Settings2 className="mr-space-xs h-4 w-4" />
              设置
            </Button>
          ) : null}

          <Button variant="secondary" onClick={onSave} disabled={saving}>
            <Save className="mr-space-xs h-4 w-4" />
            {saving ? '保存中...' : '保存'}
          </Button>

          {showRun ? (
            <Button onClick={onRun}>
              <Play className="mr-space-xs h-4 w-4" />
              运行
            </Button>
          ) : null}
        </>
      }
    />
  )
}
