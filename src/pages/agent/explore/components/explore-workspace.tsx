import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Bot,
  History,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Link2,
  Activity,
  X,
  Plus,
} from 'lucide-react'
import { WorkspacePageTemplate } from '@/components/page-templates'
import { PageHeader, PageToolbar } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { copyToClipboardWithFeedback } from '@/lib/clipboard'
import { AgentRuntimeStatus } from '../../features/runtime-workbench/types'

interface ExploreWorkspaceProps {
  agentName: string
  agentDescription?: string
  avatar?: string
  editorPath: string
  onCreateSession: () => void
  sessionId: string
  sessionName?: string
  status: AgentRuntimeStatus
  historyOpen: boolean
  onHistoryOpenChange: (open: boolean) => void
  history: ReactNode
  runMode?: ReactNode
  runModeLabel?: string
  details: ReactNode
  children: ReactNode
}

export function ExploreWorkspace({
  agentName,
  agentDescription,
  avatar,
  editorPath,
  onCreateSession,
  sessionId,
  sessionName,
  status,
  historyOpen,
  onHistoryOpenChange,
  history,
  runMode,
  runModeLabel,
  details,
  children,
}: ExploreWorkspaceProps) {
  const { t } = useTranslation()
  const [historyVisible, setHistoryVisible] = useState(true)
  const statusVisible = status !== AgentRuntimeStatus.IDLE

  return (
    <WorkspacePageTemplate
      className="h-full overflow-hidden bg-components-console-surface"
      header={
        <PageHeader
          compact
          titleSize="md"
          align="center"
          className="px-space-md md:px-space-lg"
          title={<span className="block truncate">{agentName}</span>}
          description={
            <span className="block max-w-xl truncate">
              {agentDescription || t('agent.explore.workspaceDescription')}
            </span>
          }
          leading={
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                className="hidden md:inline-flex"
                aria-label={t(
                  historyVisible
                    ? 'agent.explore.hideHistory'
                    : 'agent.explore.showHistory',
                )}
                aria-expanded={historyVisible}
                aria-controls="explore-history"
                onClick={() => setHistoryVisible((value) => !value)}
              >
                {historyVisible ? (
                  <PanelLeftClose className="size-icon-md" />
                ) : (
                  <PanelLeftOpen className="size-icon-md" />
                )}
              </Button>
              <Sheet open={historyOpen} onOpenChange={onHistoryOpenChange}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="md:hidden"
                    aria-label={t('agent.explore.showHistory')}
                  >
                    <History className="size-icon-md" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  showCloseButton={false}
                  className="flex w-full max-w-sm flex-col gap-space-sm bg-components-console-surface p-space-base motion-reduce:animate-none motion-reduce:transition-none"
                >
                  <SheetHeader className="flex-row items-center justify-between space-y-0 text-left">
                    <SheetTitle>{t('agent.explore.history')}</SheetTitle>
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t('common.close')}
                      >
                        <X className="size-icon-sm" />
                      </Button>
                    </SheetClose>
                  </SheetHeader>
                  <SheetDescription className="sr-only">
                    {t('agent.explore.historyDescription')}
                  </SheetDescription>
                  <div className="min-h-0 flex-1">{history}</div>
                </SheetContent>
              </Sheet>
              <Avatar className="size-icon-2xl rounded-radius-lg">
                <AvatarImage src={avatar} alt="" />
                <AvatarFallback className="rounded-radius-lg bg-background-subtle">
                  <Bot className="size-icon-lg" />
                </AvatarFallback>
              </Avatar>
            </>
          }
          actions={
            <>
              <Button
                variant="ghost"
                size="sm"
                className={historyVisible ? 'md:hidden' : ''}
                onClick={onCreateSession}
                aria-label={t('agent.explore.newChat')}
              >
                <Plus className="size-icon-sm" />
                <span className="hidden sm:inline">
                  {t('agent.explore.newChat')}
                </span>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="sm"
                aria-label={t('agent.explore.editAgent')}
              >
                <Link to={editorPath}>
                  <Pencil className="size-icon-sm" />
                  <span className="hidden sm:inline">
                    {t('agent.explore.editAgent')}
                  </span>
                </Link>
              </Button>
            </>
          }
        />
      }
    >
      <div className="flex h-full min-h-0 overflow-hidden">
        {historyVisible ? (
          <aside
            id="explore-history"
            aria-label={t('agent.explore.history')}
            className="hidden w-72 shrink-0 border-r border-border-subtle bg-components-sidebar-bg md:block"
          >
            {history}
          </aside>
        ) : null}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <PageToolbar
            className="min-h-12 flex-wrap border-border-subtle px-space-md md:px-space-lg"
            left={
              <div className="flex min-w-0 flex-wrap items-center gap-space-sm">
                <span className="truncate text-sm font-medium text-text-secondary">
                  {sessionName || t('agent.explore.conversation')}
                </span>
                {runMode ? (
                  <Badge variant="outline">{runModeLabel}</Badge>
                ) : null}
                {statusVisible ? (
                  <Badge
                    variant={
                      status === AgentRuntimeStatus.ERROR
                        ? 'destructive'
                        : 'outline'
                    }
                    aria-live="polite"
                  >
                    {t(
                      status === AgentRuntimeStatus.STOPPED
                        ? 'agent.explore.outputDisconnected'
                        : `agent.runtime.${status}`,
                    )}
                  </Badge>
                ) : null}
              </div>
            }
            right={
              <>
                {sessionId ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t('agent.explore.copyLink')}
                    onClick={() => {
                      void copyToClipboardWithFeedback(
                        window.location.href,
                        t('agent.explore.linkCopied'),
                        t('agent.explore.copyFailed'),
                      )
                    }}
                  >
                    <Link2 className="size-icon-sm" />
                  </Button>
                ) : null}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Activity className="size-icon-sm" />
                      <span className="hidden sm:inline">
                        {t('agent.explore.details')}
                      </span>
                      <span className="sr-only sm:hidden">
                        {t('agent.explore.details')}
                      </span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    showCloseButton={false}
                    className="flex w-full max-w-lg flex-col gap-space-md overflow-hidden bg-components-console-surface p-space-lg motion-reduce:animate-none motion-reduce:transition-none sm:max-w-lg"
                  >
                    <SheetHeader className="flex-row items-center justify-between space-y-0 text-left">
                      <SheetTitle>{t('agent.explore.details')}</SheetTitle>
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t('common.close')}
                        >
                          <X className="size-icon-sm" />
                        </Button>
                      </SheetClose>
                    </SheetHeader>
                    <SheetDescription>
                      {t('agent.explore.detailsDescription')}
                    </SheetDescription>
                    <div className="min-h-0 flex-1 overflow-auto">
                      {runMode ? (
                        <div className="mb-space-lg border-b border-border-subtle pb-space-base">
                          {runMode}
                        </div>
                      ) : null}
                      {details}
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            }
          />
          <div className="min-h-0 flex-1">{children}</div>
        </main>
      </div>
    </WorkspacePageTemplate>
  )
}
