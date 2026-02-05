import { get, isArray } from 'lodash'
import { type MouseEventHandler, type PropsWithChildren, useCallback, useMemo } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useFetchAgent } from '@/hooks/use-agent-request'
import { useTranslation } from 'react-i18next'
import useGraphStore from '../../store'

interface NextNodePopoverProps extends PropsWithChildren {
  nodeId: string
  name?: string
}

export function NextNodePopover({ children, nodeId, name }: NextNodePopoverProps) {
  const { t } = useTranslation()
  const { data } = useFetchAgent()
  const getNode = useGraphStore((state) => state.getNode)

  const component = useMemo(() => {
    return get(data, ['dsl', 'components', nodeId], {})
  }, [data, nodeId])

  const inputs = useMemo(() => {
    const raw = get(component, ['obj', 'inputs'], [])
    return isArray(raw) ? raw : []
  }, [component])

  const output = useMemo(() => {
    return get(component, ['obj', 'output'], {})
  }, [component])

  const stopPropagation: MouseEventHandler = useCallback((e) => {
    e.stopPropagation()
  }, [])

  const getLabel = useCallback(
    (componentId: string) => {
      return getNode(componentId)?.data?.name ?? componentId
    },
    [getNode],
  )

  const outputText = useMemo(() => {
    try {
      return JSON.stringify(output, null, 2)
    } catch {
      return String(output)
    }
  }, [output])

  return (
    <Popover>
      <PopoverTrigger onClick={stopPropagation} asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="right"
        sideOffset={16}
        onClick={stopPropagation}
        className="w-[420px]"
      >
        <div className="mb-space-sm text-base font-semibold text-text-primary">
          {name} {t('flow.operationResults', '操作结果')}
        </div>
        <div className="flex w-full flex-col gap-space-md">
          <div className="flex flex-col gap-space-xs">
            <span className="text-sm font-semibold text-text-primary">
              {t('flow.input', '输入')}
            </span>
            <div className="rounded-radius-sm border border-border-primary bg-surface-secondary p-space-xs">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('flow.componentId', '组件')}</TableHead>
                    <TableHead className="w-[120px]">
                      {t('flow.content', '内容')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inputs.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{getLabel(item.component_id)}</TableCell>
                      <TableCell className="truncate">
                        {item.content}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="flex flex-col gap-space-xs">
            <span className="text-sm font-semibold text-text-primary">
              {t('flow.output', '输出')}
            </span>
            <div className="rounded-radius-sm border border-border-primary bg-surface-secondary p-space-xs">
              <pre className="max-h-[300px] overflow-auto text-xs text-text-primary">
                {outputText}
              </pre>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
