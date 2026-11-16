import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Play } from 'lucide-react'
import { mcpAPI } from '@/api/mcp'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { MCPTool, MCPToolCallContent } from '@/types/mcp'
import { parseToolArguments } from './mcp-utils'

export interface ToolRunTarget {
  tool: MCPTool
  serverId: string
  serverName: string
}

type RunResult =
  | { status: 'success'; content: MCPToolCallContent[]; duration: number }
  | { status: 'failed'; duration?: number }

/** Calls one tool with JSON arguments and shows what it returned. */
export function MCPToolRunDialog({
  target,
  onClose,
}: {
  target: ToolRunTarget | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [args, setArgs] = useState('')
  const [invalid, setInvalid] = useState(false)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<RunResult | null>(null)
  const [previousTarget, setPreviousTarget] = useState(target)
  if (previousTarget !== target) {
    setPreviousTarget(target)
    setArgs('')
    setInvalid(false)
    setResult(null)
  }

  const run = async () => {
    if (!target) return
    const parsed = parseToolArguments(args)
    if (!parsed) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    setRunning(true)
    setResult(null)
    const started = Date.now()
    try {
      const response = await mcpAPI.testTool({
        mcp_id: target.serverId,
        tool_name: target.tool.name,
        arguments: parsed,
        timeout: 30,
      })
      const duration = Date.now() - started
      setResult(
        response.isError
          ? { status: 'failed', duration }
          : { status: 'success', content: response.content ?? [], duration },
      )
    } catch {
      setResult({ status: 'failed' })
    } finally {
      setRunning(false)
    }
  }

  const argsId = 'mcp-tool-arguments'
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle className="font-mono">{target?.tool.name}</DialogTitle>
          <DialogDescription>
            {t('mcp.tools.runOn', { server: target?.serverName ?? '' })}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-space-base">
          {target?.tool.description ? (
            <p className="text-sm whitespace-pre-wrap text-text-secondary">
              {target.tool.description}
            </p>
          ) : null}
          {target?.tool.inputSchema ? (
            <details className="text-sm">
              <summary className="cursor-pointer text-text-secondary">
                {t('mcp.tools.schema')}
              </summary>
              <pre className="mt-space-xs max-h-40 overflow-auto rounded-radius-md bg-background-subtle p-space-sm font-mono text-xs text-text-secondary">
                {JSON.stringify(target.tool.inputSchema, null, 2)}
              </pre>
            </details>
          ) : null}
          <div className="flex flex-col gap-space-xs">
            <Label htmlFor={argsId}>{t('mcp.tools.arguments')}</Label>
            <Textarea
              id={argsId}
              value={args}
              rows={5}
              className="font-mono text-sm"
              placeholder={t(
                target?.tool.inputSchema
                  ? 'mcp.tools.argumentsPlaceholder'
                  : 'mcp.tools.noArguments',
              )}
              aria-invalid={invalid}
              aria-describedby={invalid ? `${argsId}-error` : undefined}
              onChange={(event) => {
                setArgs(event.target.value)
                setInvalid(false)
              }}
            />
            {invalid ? (
              <p
                id={`${argsId}-error`}
                role="alert"
                className="text-xs text-status-error"
              >
                {t('mcp.tools.invalidArguments')}
              </p>
            ) : null}
          </div>
          {result ? (
            <div className="flex flex-col gap-space-xs border-t border-border-subtle pt-space-sm">
              <output
                className={
                  result.status === 'success'
                    ? 'block text-sm font-medium text-status-success'
                    : 'block text-sm font-medium text-status-error'
                }
              >
                {t(
                  result.status === 'success'
                    ? 'mcp.tools.runSucceeded'
                    : 'mcp.tools.runFailed',
                )}
                {result.duration !== undefined ? (
                  <span className="ml-space-sm font-normal text-text-tertiary tabular-nums">
                    {t('mcp.common.milliseconds', { value: result.duration })}
                  </span>
                ) : null}
              </output>
              {result.status === 'success' && result.content.length > 0 ? (
                <pre className="max-h-48 overflow-auto rounded-radius-md bg-background-subtle p-space-sm font-mono text-xs text-text-secondary">
                  {JSON.stringify(result.content, null, 2)}
                </pre>
              ) : null}
            </div>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.close')}
          </Button>
          <Button
            loading={running}
            leftIcon={<Play className="size-icon-sm" aria-hidden="true" />}
            onClick={() => void run()}
          >
            {t('mcp.tools.run')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
