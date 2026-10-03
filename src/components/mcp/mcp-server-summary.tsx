import { useTranslation } from 'react-i18next'

interface MCPServerSummaryProps {
  totalServers: number
  activeServers: number
  totalTools: number
  serverTypes: number
  isLoading?: boolean
}

export const MCPServerSummary = ({
  totalServers,
  activeServers,
  totalTools,
  serverTypes,
  isLoading,
}: MCPServerSummaryProps) => {
  const { t } = useTranslation()
  const entries = [
    [t('mcp.servers.stats.totalServers'), totalServers],
    [t('mcp.servers.stats.readyServers'), activeServers],
    [t('mcp.servers.stats.availableTools'), totalTools],
    [t('mcp.servers.stats.protocolTypes'), serverTypes],
  ] as const
  return (
    <dl
      className="grid grid-cols-2 gap-space-base border-y border-border-subtle py-space-base @lg:grid-cols-4"
      aria-busy={isLoading}
    >
      {entries.map(([label, value]) => (
        <div key={label} className="flex items-baseline gap-space-sm">
          <dd className="order-1 text-xl font-semibold text-text-primary tabular-nums">
            {isLoading ? '—' : value}
          </dd>
          <dt className="order-2 text-sm text-text-secondary">{label}</dt>
        </div>
      ))}
    </dl>
  )
}
