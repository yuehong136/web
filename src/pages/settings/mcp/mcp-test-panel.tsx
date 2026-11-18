import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Play } from 'lucide-react'
import { mcpAPI } from '@/api/mcp'
import { MCPFormKeyValues } from '@/components/mcp/mcp-form-key-values'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { getCurrentLanguage } from '@/locales/i18n'
import { MCP_SERVER_TYPES, type MCPServer, type MCPTool } from '@/types/mcp'
import {
  protocolLabel,
  toEntries,
  toHeaders,
  toVariables,
  type KeyValueEntry,
} from './mcp-utils'

type Attempt = {
  url: string
  success: boolean
  tools: MCPTool[]
  duration: number
  at: Date
}

const DEFAULT_TIMEOUT_SECONDS = 10

function updateEntry(
  entries: KeyValueEntry[],
  index: number,
  field: keyof KeyValueEntry,
  value: string,
) {
  return entries.map((entry, i) =>
    i === index ? { ...entry, [field]: value } : entry,
  )
}

/**
 * Tests a connection before saving: prefilled from the selected server and
 * freely editable. Nothing here is saved; the history covers this visit.
 */
export function MCPTestPanel({ server }: { server: MCPServer | null }) {
  const { t } = useTranslation()
  const [url, setUrl] = useState(server?.url ?? '')
  const [protocol, setProtocol] = useState<string>(
    server?.server_type ?? 'streamable-http',
  )
  const [timeout, setTimeoutSeconds] = useState(DEFAULT_TIMEOUT_SECONDS)
  const [headers, setHeaders] = useState(() => toEntries(server?.headers))
  const [variables, setVariables] = useState(() =>
    toEntries(
      Object.fromEntries(
        Object.entries(server?.variables ?? {}).filter(
          ([key]) => key !== 'tools',
        ),
      ),
    ),
  )
  const [testing, setTesting] = useState(false)
  const [history, setHistory] = useState<Attempt[]>([])
  const latest = history[0]

  const test = async () => {
    if (!url.trim()) return
    setTesting(true)
    const started = Date.now()
    let attempt: Omit<Attempt, 'duration' | 'at'>
    try {
      const tools = await mcpAPI.testConnection({
        url: url.trim(),
        server_type: protocol,
        timeout,
        headers: toHeaders(headers),
        variables: toVariables(variables),
      })
      attempt = { url, success: true, tools }
    } catch {
      attempt = { url, success: false, tools: [] }
    } finally {
      setTesting(false)
    }
    setHistory((previous) =>
      [
        { ...attempt, duration: Date.now() - started, at: new Date() },
        ...previous,
      ].slice(0, 10),
    )
  }

  const time = new Intl.DateTimeFormat(getCurrentLanguage(), {
    timeStyle: 'medium',
  })
  return (
    <form
      className="flex flex-col gap-space-base"
      onSubmit={(event) => {
        event.preventDefault()
        void test()
      }}
    >
      <div className="flex flex-col gap-space-xs">
        <Label htmlFor="mcp-test-url">{t('mcp.form.url')}</Label>
        <Input
          id="mcp-test-url"
          inputSize="sm"
          value={url}
          required
          placeholder={t('mcp.test.urlPlaceholder')}
          className="font-mono"
          onChange={(event) => setUrl(event.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-end gap-space-base">
        <div className="flex flex-col gap-space-xs">
          <span id="mcp-test-protocol" className="text-sm font-medium">
            {t('mcp.form.protocol')}
          </span>
          <SegmentedControl
            aria-labelledby="mcp-test-protocol"
            size="sm"
            value={protocol}
            onValueChange={setProtocol}
            options={MCP_SERVER_TYPES.map((type) => ({
              value: type,
              label: protocolLabel(type),
            }))}
          />
        </div>
        <div className="flex w-32 flex-col gap-space-xs">
          <Label htmlFor="mcp-test-timeout">{t('mcp.test.timeout')}</Label>
          <Input
            id="mcp-test-timeout"
            type="number"
            inputSize="sm"
            min={1}
            max={60}
            value={timeout}
            onChange={(event) =>
              setTimeoutSeconds(
                Math.min(
                  60,
                  Math.max(
                    1,
                    Number(event.target.value) || DEFAULT_TIMEOUT_SECONDS,
                  ),
                ),
              )
            }
          />
        </div>
      </div>

      <details className="flex flex-col gap-space-sm">
        <summary className="cursor-pointer text-sm font-medium text-fg">
          {t('mcp.form.httpHeaders')}
          <span className="ml-space-sm text-xs font-normal text-fg-subtle tabular-nums">
            {headers.length}
          </span>
        </summary>
        <div className="pt-space-sm">
          <MCPFormKeyValues
            entries={headers}
            onChange={(index, field, value) =>
              setHeaders(updateEntry(headers, index, field, value))
            }
            onRemove={(index) =>
              setHeaders(headers.filter((_, i) => i !== index))
            }
            onAdd={() => setHeaders([...headers, { key: '', value: '' }])}
            keyPlaceholder={t('mcp.form.headerKey')}
            valuePlaceholder={t('mcp.form.headerValue')}
            emptyText={t('mcp.form.headersEmpty')}
            emptyDescription={t('mcp.form.headersEmptyDescription')}
          />
        </div>
      </details>
      <details className="flex flex-col gap-space-sm">
        <summary className="cursor-pointer text-sm font-medium text-fg">
          {t('mcp.form.variables')}
          <span className="ml-space-sm text-xs font-normal text-fg-subtle tabular-nums">
            {variables.length}
          </span>
        </summary>
        <div className="pt-space-sm">
          <MCPFormKeyValues
            entries={variables}
            onChange={(index, field, value) =>
              setVariables(updateEntry(variables, index, field, value))
            }
            onRemove={(index) =>
              setVariables(variables.filter((_, i) => i !== index))
            }
            onAdd={() => setVariables([...variables, { key: '', value: '' }])}
            keyPlaceholder={t('mcp.form.variableKey')}
            valuePlaceholder={t('mcp.form.variableValue')}
            emptyText={t('mcp.form.variablesEmpty')}
            emptyDescription={t('mcp.form.variablesEmptyDescription')}
          />
        </div>
      </details>

      <div>
        <Button
          type="submit"
          size="sm"
          disabled={!url.trim()}
          loading={testing}
          leftIcon={<Play className="size-icon-sm" aria-hidden="true" />}
        >
          {t('mcp.form.startTest')}
        </Button>
        <p className="mt-space-xs text-xs text-fg-subtle">
          {t('mcp.test.hint')}
        </p>
      </div>

      {latest ? (
        <section
          aria-label={t('mcp.test.result')}
          className="flex flex-col gap-space-xs border-t border-line-subtle pt-space-sm"
        >
          <output
            className={
              latest.success
                ? 'block text-sm font-medium text-success-fg'
                : 'block text-sm font-medium text-danger-fg'
            }
          >
            {latest.success
              ? t('mcp.test.succeeded', { count: latest.tools.length })
              : t('mcp.form.testFailed')}
            <span className="ml-space-sm font-normal text-fg-subtle tabular-nums">
              {t('mcp.common.milliseconds', { value: latest.duration })}
            </span>
          </output>
          {latest.tools.length ? (
            <ul className="flex flex-col">
              {latest.tools.map((tool) => (
                <li
                  key={tool.name}
                  className="border-t border-line-subtle py-space-xs first:border-t-0"
                >
                  <span className="font-mono text-xs text-fg">{tool.name}</span>
                  {tool.description ? (
                    <p className="line-clamp-2 text-xs text-fg-muted">
                      {tool.description}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {history.length > 1 ? (
        <section
          aria-label={t('mcp.test.history')}
          className="flex flex-col gap-space-xs border-t border-line-subtle pt-space-sm"
        >
          <h3 className="text-xs font-medium text-fg-subtle">
            {t('mcp.test.history')}
          </h3>
          <ul className="flex flex-col">
            {history.slice(1).map((attempt, index) => (
              <li
                key={`${attempt.at.getTime()}-${index}`}
                className="flex items-center gap-space-sm py-space-2xs text-xs"
              >
                <span
                  aria-hidden="true"
                  className={
                    attempt.success
                      ? 'size-1.5 shrink-0 rounded-radius-full bg-success-fg'
                      : 'size-1.5 shrink-0 rounded-radius-full bg-danger-fg'
                  }
                />
                <span className="sr-only">
                  {t(
                    attempt.success ? 'mcp.form.connected' : 'mcp.form.failed',
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-fg-muted">
                  {attempt.url}
                </span>
                <span className="text-fg-subtle tabular-nums">
                  {t('mcp.common.milliseconds', { value: attempt.duration })}
                </span>
                <time
                  dateTime={attempt.at.toISOString()}
                  className="text-fg-subtle tabular-nums"
                >
                  {time.format(attempt.at)}
                </time>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </form>
  )
}
