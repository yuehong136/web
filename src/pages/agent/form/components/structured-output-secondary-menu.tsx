import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import get from 'lodash/get.js'
import isEmpty from 'lodash/isEmpty.js'
import isPlainObject from 'lodash/isPlainObject.js'
import { ChevronRight } from 'lucide-react'
import type { ForwardedRef, PropsWithChildren, ReactNode } from 'react'
import { forwardRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { JsonSchemaDataType } from '../../constant'
import { useGetStructuredOutputByValue } from '../../hooks/use-build-structured-output'
import { hasSpecificTypeChild } from '../../utils/filter-agent-structured-output'

type DataItem = { label: ReactNode; value: string; parentLabel?: ReactNode }

type StructuredOutputSecondaryMenuProps = {
  className?: string
  data: DataItem
  click(option: { label: ReactNode; value: string }): void
  types?: (typeof JsonSchemaDataType)[keyof typeof JsonSchemaDataType][]
} & PropsWithChildren

function getStructuredDatatype(value: unknown) {
  const type = String(get(value, 'type', 'string'))
  const itemsType = get(value, 'items.type') as string | undefined

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

export const StructuredOutputSecondaryMenu = forwardRef(
  function StructuredOutputSecondaryMenu(
    {
      className,
      data,
      click,
      types = [],
    }: StructuredOutputSecondaryMenuProps,
    ref: ForwardedRef<HTMLLIElement>,
  ) {
    const { t } = useTranslation()
    const filterStructuredOutput = useGetStructuredOutputByValue()
    const structuredOutput = filterStructuredOutput(data.value)

    const handleSubMenuClick = useCallback(
      (
          option: { label: ReactNode; value: string },
          dataType?: string,
        ) =>
        () => {
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
      if (
        isEmpty(types) ||
        types?.some((x) => x === JsonSchemaDataType.Object)
      ) {
        click(data)
      }
    }, [click, data, types])

    const renderAgentStructuredOutput = useCallback(
      (
        values: unknown,
        option: { label: ReactNode; value: string },
      ): ReactNode => {
        const properties =
          get(values, 'properties') || get(values, 'items.properties')

        if (isPlainObject(values) && properties) {
          return (
            <ul className="border-l border-border-default">
              {Object.entries(properties).map(([key, value]) => {
                const nextOption = {
                  label: `${option.label}.${key}`,
                  value: `${option.value}.${key}`,
                }

                const { dataType, compositeDataType } =
                  getStructuredDatatype(value)

                if (
                  isEmpty(types) ||
                  (!isEmpty(types) &&
                    (types?.some((x) => x === compositeDataType) ||
                      hasSpecificTypeChild(value ?? {}, types as string[])))
                ) {
                  return (
                    <li key={key} className="pl-space-xs">
                      <div
                        onClick={handleSubMenuClick(nextOption, compositeDataType)}
                        className="flex cursor-pointer items-center justify-between rounded-radius-sm p-space-xs text-sm text-text-primary hover:bg-components-dropdown-item-bg-hover"
                      >
                        <span className="truncate">{key}</span>
                        <span className="shrink-0 text-xs text-text-secondary">
                          {compositeDataType}
                        </span>
                      </div>
                      {[
                        JsonSchemaDataType.Object,
                        JsonSchemaDataType.Array,
                      ].some((x) => x === dataType) &&
                        renderAgentStructuredOutput(value, nextOption)}
                    </li>
                  )
                }

                return null
              })}
            </ul>
          )
        }

        return null
      },
      [handleSubMenuClick, types],
    )

    if (
      !isEmpty(types) &&
      !hasSpecificTypeChild(structuredOutput ?? {}, types as string[]) &&
      !types.some((x) => x === JsonSchemaDataType.Object)
    ) {
      return null
    }

    return (
      <HoverCard key={data.value} openDelay={100} closeDelay={100}>
        <HoverCardTrigger asChild>
          <li
            ref={ref}
            onClick={handleMenuClick}
            onMouseDown={(event) => event.preventDefault()}
            className={cn(
              'flex cursor-pointer items-center gap-space-sm rounded-radius-sm px-space-sm py-space-xs text-sm text-text-primary',
              'hover:bg-components-dropdown-item-bg-hover focus-visible:bg-components-dropdown-item-bg-hover',
              className,
            )}
          >
            <span className="truncate">{data.label}</span>
            <span className="ml-auto text-xs text-text-secondary">object</span>
            <ChevronRight className="size-3.5 text-text-secondary" />
          </li>
        </HoverCardTrigger>

        <HoverCardContent
          side="left"
          align="start"
          className={cn(
            'min-w-72 border border-border-default bg-components-dropdown-bg p-0 shadow-lg',
          )}
        >
          <ScrollArea className="max-h-80 p-space-sm">
            <section>
              <header className="mb-space-xs text-xs text-text-secondary">
                {t('flow.structuredOutput.structuredOutput')}
              </header>
              {renderAgentStructuredOutput(structuredOutput, data)}
            </section>
          </ScrollArea>
        </HoverCardContent>
      </HoverCard>
    )
  },
)
