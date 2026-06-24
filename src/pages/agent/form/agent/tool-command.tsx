import lowerFirst from 'lodash/lowerFirst'
import { Plus } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useFetchMCPServers } from '@/hooks/use-mcp-request'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import OperatorIcon from '../../operator-icon'
import { Operator } from '../../constant'
import { getOperatorDefinition } from '../../operators/registry'

const toolMenus = [
  {
    labelKey: 'flow.search',
    list: [
      Operator.TavilySearch,
      Operator.TavilyExtract,
      Operator.Google,
      Operator.DuckDuckGo,
      Operator.Wikipedia,
      Operator.SearXNG,
      Operator.YahooFinance,
      Operator.PubMed,
      Operator.GoogleScholar,
      Operator.ArXiv,
      Operator.WenCai,
    ],
  },
  {
    labelKey: 'flow.communication',
    list: [Operator.Email],
  },
  {
    labelKey: 'flow.developer',
    list: [Operator.GitHub, Operator.ExeSQL, Operator.Code, Operator.Retrieval],
  },
] as const

export function BuiltInToolCommand({
  selectedToolNames,
  onSelect,
}: {
  selectedToolNames: Set<string>
  onSelect: (operator: Operator) => void
}) {
  const { t } = useTranslation()

  return (
    <Command>
      <CommandInput
        placeholder={t(
          'flow.typeCommandORsearch',
          'Type a command or search...',
        )}
      />
      <CommandList>
        <CommandEmpty>
          {t('flow.noResultsFound', 'No results found.')}
        </CommandEmpty>
        {toolMenus.map((group) => (
          <CommandGroup
            key={group.labelKey}
            heading={t(group.labelKey, group.labelKey)}
          >
            {group.list.map((operator) => {
              const isRetrieval = operator === Operator.Retrieval
              const fallbackName =
                getOperatorDefinition(operator)?.defaultName || operator

              return (
                <CommandItem
                  key={operator}
                  className="gap-space-sm flex items-center"
                  onSelect={() => onSelect(operator)}
                >
                  {isRetrieval ? (
                    <span className="inline-flex size-4 items-center justify-center">
                      <Plus className="size-4" />
                    </span>
                  ) : (
                    <Checkbox
                      checked={selectedToolNames.has(operator)}
                      className="pointer-events-none"
                    />
                  )}
                  <OperatorIcon name={operator} />
                  <span>{t(`flow.${lowerFirst(operator)}`, fallbackName)}</span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  )
}

export function McpToolCommand({
  selectedMcpIdList,
  onChange,
}: {
  selectedMcpIdList: string[]
  onChange: (ids: string[]) => void
}) {
  const { t } = useTranslation()
  const { data } = useFetchMCPServers({ page_size: 200 })
  const selectedMcpIds = useMemo(
    () => new Set(selectedMcpIdList),
    [selectedMcpIdList],
  )

  return (
    <Command>
      <CommandInput
        placeholder={t(
          'flow.typeCommandORsearch',
          'Type a command or search...',
        )}
      />
      <CommandList>
        <CommandEmpty>
          {t('flow.noResultsFound', 'No results found.')}
        </CommandEmpty>
        {(data?.mcp_servers || []).map((server) => {
          const checked = selectedMcpIds.has(server.id)

          return (
            <CommandItem
              key={server.id}
              className="gap-space-sm flex items-center"
              onSelect={() => {
                const nextIds = checked
                  ? selectedMcpIdList.filter((id) => id !== server.id)
                  : [...selectedMcpIdList, server.id]
                onChange(nextIds)
              }}
            >
              <Checkbox checked={checked} className="pointer-events-none" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-text-primary">
                  {server.name}
                </div>
                {server.description && (
                  <div className="truncate text-xs text-text-secondary">
                    {server.description}
                  </div>
                )}
              </div>
            </CommandItem>
          )
        })}
      </CommandList>
    </Command>
  )
}
