import { memo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MethodBadge } from '@/components/ui/method-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { OpenAPISpec } from '@/types/api'
import type { APIEndpoint } from '@/pages/settings/api-keys-types'
import {
  buildCurlExample,
  endpointAnchor,
  requestBodyExample,
  resolveSchemaRef,
  schemaType,
} from './api-schema'
import { DocMarkdown } from './doc-markdown'

interface ApiEndpointSectionProps {
  endpoint: APIEndpoint
  spec: OpenAPISpec | null
  url: string
  copiedStates: Record<string, boolean>
  onCopy: (text: string, key: string) => void
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-space-xs">
      <h4 className="text-xs font-medium text-fg-subtle">{title}</h4>
      {children}
    </div>
  )
}

function CodeBlock({
  code,
  copyLabel,
  copied,
  onCopy,
}: {
  code: string
  copyLabel: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div className="relative rounded-radius-md border border-line-subtle bg-sunken">
      <pre className="overflow-x-auto p-space-sm pr-space-2xl font-mono text-xs text-fg">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute top-space-xs right-space-xs"
        aria-label={copyLabel}
        onClick={onCopy}
      >
        {copied ? (
          <Check className="size-icon-sm text-success-fg" aria-hidden="true" />
        ) : (
          <Copy className="size-icon-sm" aria-hidden="true" />
        )}
      </Button>
    </div>
  )
}

/** One endpoint of the API docs: request line, description, inputs, responses, example. */
export const ApiEndpointSection = memo(function ApiEndpointSection({
  endpoint,
  spec,
  url,
  copiedStates,
  onCopy,
}: ApiEndpointSectionProps) {
  const { t } = useTranslation()
  const anchor = endpointAnchor(endpoint)
  const parameters = endpoint.parameters ?? []
  const bodies = Object.entries(endpoint.requestBody?.content ?? {})
  const curl = buildCurlExample(
    endpoint.method,
    url,
    requestBodyExample(spec, endpoint),
  )
  return (
    <section
      id={anchor}
      aria-labelledby={`${anchor}-title`}
      data-api-section
      className="flex scroll-mt-space-md flex-col gap-space-base border-t border-line-subtle py-space-lg first:border-t-0"
    >
      <div className="flex flex-col gap-space-xs">
        <h3
          id={`${anchor}-title`}
          className="flex flex-wrap items-center gap-space-sm text-base font-semibold text-fg"
        >
          {endpoint.summary}
          {endpoint.deprecated ? (
            <Badge variant="warning">{t('settings.apiDocs.deprecated')}</Badge>
          ) : null}
        </h3>
        <div className="flex min-w-0 items-center gap-space-sm">
          <MethodBadge method={endpoint.method} size="sm" />
          <code className="min-w-0 font-mono text-xs break-all text-fg-muted">
            {url}
          </code>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('settings.apiDocs.copyUrl', {
              name: endpoint.summary,
            })}
            onClick={() => onCopy(url, `${anchor}-url`)}
          >
            {copiedStates[`${anchor}-url`] ? (
              <Check
                className="size-icon-sm text-success-fg"
                aria-hidden="true"
              />
            ) : (
              <Copy className="size-icon-sm" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {endpoint.description ? (
        <DocMarkdown content={endpoint.description} />
      ) : null}

      <Block title={t('settings.apiDocs.parameters')}>
        {parameters.length === 0 && bodies.length === 0 ? (
          <p className="text-sm text-fg-subtle">
            {t('settings.apiDocs.noParameters')}
          </p>
        ) : null}
        {parameters.length > 0 ? (
          <Table aria-label={t('settings.apiDocs.parameters')}>
            <TableHeader>
              <TableRow>
                <TableHead>{t('settings.apiDocs.name')}</TableHead>
                <TableHead>{t('settings.apiDocs.location')}</TableHead>
                <TableHead>{t('settings.apiDocs.type')}</TableHead>
                <TableHead>{t('settings.apiDocs.details')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parameters.map((param) => (
                <TableRow key={`${param.in}-${param.name}`}>
                  <TableCell className="font-mono text-xs text-fg">
                    {param.name}
                    {param.required ? (
                      <span className="ml-space-2xs text-danger-fg">
                        <span aria-hidden="true">*</span>
                        <span className="sr-only">
                          {t('settings.apiDocs.required')}
                        </span>
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-xs text-fg-muted">
                    {param.in}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-fg-muted">
                    {param.type ?? schemaType(spec, param.schema)}
                  </TableCell>
                  <TableCell className="text-xs text-fg-muted">
                    {param.description || '—'}
                    {param.example !== undefined ? (
                      <code className="mt-space-2xs block font-mono">
                        {t('settings.apiDocs.example', {
                          value: JSON.stringify(param.example),
                        })}
                      </code>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </Block>

      {bodies.map(([mime, content]) => {
        const schema = resolveSchemaRef(spec, content.schema)
        const properties =
          schema?.type === 'object'
            ? Object.entries(schema.properties ?? {})
            : []
        const required = schema?.required ?? []
        return (
          <Block
            key={mime}
            title={t('settings.apiDocs.requestBody', { type: mime })}
          >
            {endpoint.requestBody?.description ? (
              <p className="text-sm text-fg-muted">
                {endpoint.requestBody.description}
              </p>
            ) : null}
            {schema?.type === 'array' ? (
              <p className="text-sm text-fg-muted">
                {t('settings.apiDocs.arrayOf', {
                  type: schemaType(spec, schema.items),
                })}
              </p>
            ) : null}
            {properties.length > 0 ? (
              <Table
                aria-label={t('settings.apiDocs.requestBody', { type: mime })}
              >
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('settings.apiDocs.field')}</TableHead>
                    <TableHead>{t('settings.apiDocs.type')}</TableHead>
                    <TableHead>{t('settings.apiDocs.details')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map(([name, property]) => {
                    const resolved = resolveSchemaRef(spec, property)
                    return (
                      <TableRow key={name}>
                        <TableCell className="font-mono text-xs text-fg">
                          {name}
                          {required.includes(name) ? (
                            <span className="ml-space-2xs text-danger-fg">
                              <span aria-hidden="true">*</span>
                              <span className="sr-only">
                                {t('settings.apiDocs.required')}
                              </span>
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-fg-muted">
                          {schemaType(spec, resolved)}
                        </TableCell>
                        <TableCell className="text-xs text-fg-muted">
                          {resolved?.description || '—'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : null}
          </Block>
        )
      })}

      {endpoint.responses?.length ? (
        <Block title={t('settings.apiDocs.responses')}>
          <dl className="flex flex-col">
            {endpoint.responses.map((response) => (
              <div
                key={response.status}
                className="flex gap-space-sm border-t border-line-subtle py-space-xs first:border-t-0"
              >
                <dt className="w-12 shrink-0 font-mono text-xs text-fg tabular-nums">
                  {Number.isNaN(response.status) ? '—' : response.status}
                </dt>
                <dd className="min-w-0 text-sm text-fg-muted">
                  {response.description || '—'}
                </dd>
              </div>
            ))}
          </dl>
        </Block>
      ) : null}

      <Block title={t('settings.apiDocs.curlExample')}>
        <CodeBlock
          code={curl}
          copyLabel={t('settings.apiDocs.copyExample', {
            name: endpoint.summary,
          })}
          copied={Boolean(copiedStates[`${anchor}-curl`])}
          onCopy={() => onCopy(curl, `${anchor}-curl`)}
        />
      </Block>
    </section>
  )
})
