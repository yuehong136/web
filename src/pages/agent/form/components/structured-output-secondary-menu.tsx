import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { cn } from '@/lib/utils'
import { get, isEmpty, isPlainObject } from 'lodash'
import { ChevronRight } from 'lucide-react'
import type { PropsWithChildren, ReactNode } from 'react'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { JsonSchemaDataType } from '../../constant'

type DataItem = { label: ReactNode; value: string; parentLabel?: ReactNode }

type StructuredOutputSecondaryMenuProps = {
  data: DataItem
  click(option: { label: ReactNode; value: string }): void
  types?: (typeof JsonSchemaDataType)[keyof typeof JsonSchemaDataType][]
} & PropsWithChildren

function getStructuredDatatype(value: any) {
  const type = get(value, 'type', 'string')
  const itemsType = get(value, 'items.type')

  if (type === 'array' && itemsType) {
    return {
      dataType: type,
      compositeDataType: `array<${itemsType}>`,
    }
  }

  return {
    dataType: type,
    compositeDataType: type,
  }
}

export function StructuredOutputSecondaryMenu({
  data,
  click,
  types = [],
}: StructuredOutputSecondaryMenuProps) {
  const { t } = useTranslation()

  const handleSubMenuClick = useCallback(
    (option: { label: ReactNode; value: string }, dataType?: string) => () => {
      if (
        (!isEmpty(types) && types?.some((x) => x === dataType)) ||
        isEmpty(types)
      ) {
        click(option)
      }
    },
    [click, types],
  )

  const handleMenuClick = useCallback(() => {
    if (isEmpty(types) || types?.some((x) => x === JsonSchemaDataType.Object)) {
      click(data)
    }
  }, [click, data, types])

  const renderAgentStructuredOutput = useCallback(
    (values: any, option: { label: ReactNode; value: string }) => {
      const properties =
        get(values, 'properties') || get(values, 'items.properties')

      if (isPlainObject(values) && properties) {
        return (
          <ul className="border-l border-border-primary">
            {Object.entries(properties).map(([key, value]) => {
              const nextOption = {
                label: option.label + `.${key}`,
                value: option.value + `.${key}`,
              }

              const { dataType, compositeDataType } =
                getStructuredDatatype(value)

              if (isEmpty(types) || types?.some((x) => x === compositeDataType)) {
                return (
                  <li key={key} className="pl-space-xs">
                    <div
                      onClick={handleSubMenuClick(
                        nextOption,
                        compositeDataType,
                      )}
                      className="hover:bg-surface-secondary p-space-xs text-text-primary rounded-radius-sm flex justify-between"
                    >
                      {key}
                      <span className="text-text-secondary">
                        {compositeDataType}
                      </span>
                    </div>
                    {[JsonSchemaDataType.Object, JsonSchemaDataType.Array].some(
                      (x) => x === dataType,
                    ) && renderAgentStructuredOutput(value, nextOption)}
                  </li>
                )
              }

              return null
            })}
          </ul>
        )
      }

      return <div></div>
    },
    [handleSubMenuClick, types],
  )

  return (
    <HoverCard key={data.value} openDelay={100} closeDelay={100}>
      <HoverCardTrigger asChild>
        <li
          onClick={handleMenuClick}
          className="hover:bg-surface-secondary py-space-xs px-space-sm text-text-primary rounded-radius-sm text-sm flex justify-between items-center gap-space-sm"
        >
          <div className="flex justify-between flex-1">
            {data.label} <span className="text-text-secondary">object</span>
          </div>
          <ChevronRight className="size-3.5 text-text-secondary" />
        </li>
      </HoverCardTrigger>
      <HoverCardContent
        side="left"
        align="start"
        className={cn(
          'min-w-72 border border-border-primary rounded-radius-md shadow-elevation-medium p-0',
        )}
      >
        <section className="p-space-sm">
          <div className="p-space-xs">
            {t('flow.structuredOutput.structuredOutput')}
          </div>
          {renderAgentStructuredOutput({}, data)}
        </section>
      </HoverCardContent>
    </HoverCard>
  )
}
