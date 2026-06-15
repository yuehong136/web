import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { agentAPI } from '@/api/agent'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { JsonViewer } from '../form/components/json-viewer'
import { cn, copyToClipboard } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { Check, Copy, Loader2, Play, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { adaptAgentWebhookTrace } from '../adapters'
import { WebhookTimeline } from './webhook-timeline'
import {
  buildWebhookCurlExample,
  buildWebhookTestRequest,
  getWebhookBeginConfig,
  summarizeWebhookResponse,
} from './utils'
import type { AgentFlow, AgentWebhookTraceSummary } from '@/types/agent'

enum WebhookTraceTab {
  Overview = 'overview',
  Timeline = 'timeline',
  Request = 'request',
}

interface WebhookSheetProps {
  hideModal?: (open: boolean) => void
  webhookUrl?: string
  flow?: AgentFlow
}

const wait = (ms: number) =>
  new Promise((resolve) => window.setTimeout(resolve, ms))

const mergeTrace = (
  previous: AgentWebhookTraceSummary | undefined,
  next: AgentWebhookTraceSummary,
): AgentWebhookTraceSummary => ({
  ...next,
  events: [...(previous?.events || []), ...next.events],
  firstInput: next.firstInput ?? previous?.firstInput,
  latestOutput: next.latestOutput ?? previous?.latestOutput,
})

export function WebhookSheet({
  hideModal,
  webhookUrl = '',
  flow,
}: WebhookSheetProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [trace, setTrace] = useState<AgentWebhookTraceSummary>()
  const [responseSummary, setResponseSummary] = useState<unknown>()
  const [testing, setTesting] = useState(false)
  const [testError, setTestError] = useState<string>()
  const cancelledRef = useRef(false)

  useEffect(() => {
    return () => {
      cancelledRef.current = true
    }
  }, [])

  const config = useMemo(() => getWebhookBeginConfig(flow), [flow])
  const testUrl = useMemo(
    () =>
      flow?.id
        ? `${location.protocol}//${location.host}/api/v1/webhook_test/${flow.id}`
        : '',
    [flow?.id],
  )
  const testBuild = useMemo(
    () => buildWebhookTestRequest(flow?.id || '', config),
    [config, flow?.id],
  )
  const curlExample = useMemo(
    () => buildWebhookCurlExample(testUrl || webhookUrl, testBuild.request),
    [testBuild.request, testUrl, webhookUrl],
  )

  const status = testError
    ? 'error'
    : testing || trace?.status === 'running'
      ? 'running'
      : trace?.status === 'success'
        ? 'success'
        : trace?.status || 'idle'

  const handleCopyUrl = useCallback(async () => {
    try {
      await copyToClipboard(webhookUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('复制失败，请手动复制 Webhook URL')
    }
  }, [webhookUrl])

  const pollTrace = useCallback(
    async (baseline?: AgentWebhookTraceSummary) => {
      if (!flow?.id) {
        return
      }

      let currentTrace = baseline
      let nextSinceTs = baseline?.nextSinceTs
      let webhookId = baseline?.webhookId

      for (let index = 0; index < 20; index += 1) {
        if (cancelledRef.current) {
          return
        }

        const nextTrace = adaptAgentWebhookTrace(
          await agentAPI.fetchWebhookTrace(flow.id, {
            since_ts: nextSinceTs,
            webhook_id: webhookId,
          }),
        )

        currentTrace = mergeTrace(currentTrace, nextTrace)
        setTrace(currentTrace)
        nextSinceTs = nextTrace.nextSinceTs || nextSinceTs
        webhookId = nextTrace.webhookId || webhookId

        if (nextTrace.finished || nextTrace.status === 'error') {
          return
        }

        await wait(2000)
      }
    },
    [flow?.id],
  )

  const handleTest = useCallback(async () => {
    if (!flow?.id) {
      return
    }

    cancelledRef.current = false
    setTesting(true)
    setTestError(undefined)
    setResponseSummary(undefined)
    setTrace(undefined)

    try {
      const baseline = adaptAgentWebhookTrace(
        await agentAPI.fetchWebhookTrace(flow.id),
      )
      setTrace(baseline)

      const response = await agentAPI.testWebhook(testBuild.request)
      const bodyText = await response.text()
      setResponseSummary(summarizeWebhookResponse(response, bodyText))

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      await pollTrace(baseline)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t('agent.webhook.testFailed', 'Webhook test failed')
      setTestError(message)
      toast.error(message)
    } finally {
      setTesting(false)
    }
  }, [flow?.id, pollTrace, t, testBuild.request])

  const handleRefreshTrace = useCallback(async () => {
    if (!flow?.id) {
      return
    }
    const nextTrace = adaptAgentWebhookTrace(
      await agentAPI.fetchWebhookTrace(flow.id),
    )
    setTrace(nextTrace)
  }, [flow?.id])

  return (
    <Sheet open onOpenChange={hideModal} modal={false}>
      <SheetContent
        showOverlay={false}
        className={cn(
          'top-20 flex h-[calc(100vh-5rem)] w-[min(720px,90vw)] flex-col',
        )}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle className="gap-space-sm flex items-center">
            Webhook 测试
            <Badge
              variant={
                status === 'success'
                  ? 'success'
                  : status === 'error'
                    ? 'destructive'
                    : status === 'running'
                      ? 'warning'
                      : 'secondary'
              }
            >
              {status}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-space-lg py-space-lg flex-1 overflow-auto">
          <section className="space-y-space-sm">
            <p className="text-sm font-medium text-text-primary">Webhook URL</p>
            <div className="gap-space-sm flex">
              <Input
                value={webhookUrl}
                readOnly
                className="bg-surface-secondary flex-1"
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
            {testUrl ? (
              <p className="break-all text-xs text-text-secondary">
                Test endpoint: {testUrl}
              </p>
            ) : null}
          </section>

          {testBuild.warnings.length ? (
            <div className="space-y-space-xs rounded-radius-md bg-surface-secondary p-space-sm border border-border-subtle text-sm text-text-secondary">
              {testBuild.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          ) : null}

          {testError ? (
            <div className="rounded-radius-md bg-surface-secondary p-space-sm border border-status-error text-sm text-status-error">
              {testError}
            </div>
          ) : null}

          <div className="gap-space-sm flex flex-wrap">
            <Button
              onClick={() => void handleTest()}
              disabled={testing || !flow?.id}
            >
              {testing ? (
                <Loader2 className="mr-space-xs h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-space-xs h-4 w-4" />
              )}
              {testing ? '测试中...' : '触发测试'}
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleRefreshTrace()}
              disabled={testing || !flow?.id}
            >
              <RefreshCw className="mr-space-xs h-4 w-4" />
              刷新 Trace
            </Button>
          </div>

          <Tabs defaultValue={WebhookTraceTab.Overview}>
            <TabsList>
              <TabsTrigger value={WebhookTraceTab.Overview}>
                Overview
              </TabsTrigger>
              <TabsTrigger value={WebhookTraceTab.Timeline}>
                Timeline
              </TabsTrigger>
              <TabsTrigger value={WebhookTraceTab.Request}>Request</TabsTrigger>
            </TabsList>
            <TabsContent
              value={WebhookTraceTab.Overview}
              className="space-y-space-md"
            >
              <div className="gap-space-md grid md:grid-cols-2">
                <div className="space-y-space-sm">
                  <p className="text-sm font-medium text-text-primary">Input</p>
                  <JsonViewer data={trace?.firstInput || {}} />
                </div>
                <div className="space-y-space-sm">
                  <p className="text-sm font-medium text-text-primary">
                    Output
                  </p>
                  <JsonViewer data={trace?.latestOutput || {}} />
                </div>
              </div>
              <div className="space-y-space-sm">
                <p className="text-sm font-medium text-text-primary">
                  Response
                </p>
                <JsonViewer data={responseSummary || {}} />
              </div>
            </TabsContent>
            <TabsContent value={WebhookTraceTab.Timeline}>
              <WebhookTimeline events={trace?.events || []} />
            </TabsContent>
            <TabsContent
              value={WebhookTraceTab.Request}
              className="space-y-space-md"
            >
              <div className="space-y-space-sm">
                <p className="text-sm font-medium text-text-primary">Request</p>
                <JsonViewer data={testBuild.request} />
              </div>
              <div className="space-y-space-sm">
                <p className="text-sm font-medium text-text-primary">curl</p>
                <pre className="rounded-radius-md bg-surface-secondary p-space-sm max-h-60 overflow-auto text-xs text-text-primary">
                  {curlExample}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}
