import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
} from '@lexical/react/LexicalTypeaheadMenuPlugin'
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  TextNode,
} from 'lexical'
import type { JSX } from 'react'
import React, { useCallback, useDeferredValue, useMemo } from 'react'
import * as ReactDOM from 'react-dom'
import {
  ArrowUpDown,
  CornerDownLeft,
  Search,
  Variable as VariableIcon,
} from 'lucide-react'

import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { $createVariableNode } from './variable-node'
import { VariablePickerPopover } from './variable-picker-popover'
import { getVariableVisual } from './variable-picker-visuals'
import type { VariableOptionGroup, VariableOptionItem } from './types'
import { filterVariableOptionGroups } from './utils'
import { useTranslation } from 'react-i18next'

if (typeof document !== 'undefined') {
  void import('./index.css')
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

class VariableMenuOption extends MenuOption {
  label: string
  value: string
  parentLabel?: string
  icon?: VariableOptionItem['icon']
  type?: string
  groupTitle: string
  isDisabled: boolean

  constructor({
    groupTitle,
    label,
    value,
    parentLabel,
    icon,
    type,
    isDisabled = false,
  }: VariableOptionItem & { groupTitle: string; isDisabled?: boolean }) {
    super(value)
    this.label = label
    this.value = value
    this.parentLabel = parentLabel
    this.icon = icon
    this.type = type
    this.groupTitle = groupTitle
    this.isDisabled = isDisabled
  }
}

function VariableTypeBadge({ type }: { type?: string }) {
  if (!type) {
    return null
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-radius-full border border-border-default bg-background-subtle px-space-sm py-0.5 text-xs font-medium',
        'text-text-secondary',
      )}
    >
      {type}
    </span>
  )
}

function VariablePickerEmptyState({ query }: { query: string }) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-space-sm rounded-radius-xl border border-dashed border-border-default bg-background-subtle px-space-lg py-space-xl text-center',
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-radius-xl bg-surface-secondary text-text-secondary">
        <Search className="size-5" />
      </div>
      <div className="space-y-space-xs">
        <div className="text-sm font-medium text-text-primary">
          {t('flow.variablePickerEmptyTitle', 'No variables found')}
        </div>
        <div className="max-w-72 text-xs leading-relaxed text-text-secondary">
          {query
            ? t(
                'flow.variablePickerEmptyQuery',
                `No matches for "/${query}". Try a variable name, node name, or type.`,
              )
            : t(
                'flow.variablePickerEmptyDefault',
                'Connect an upstream node or define begin inputs to make variables available here.',
              )}
        </div>
      </div>
    </div>
  )
}

export interface VariablePickerMenuPluginProps {
  options?: VariableOptionGroup[]
}

function VariablePickerItem({
  isSelected,
  option,
  onClick,
  onMouseEnter,
}: {
  isSelected: boolean
  option: VariableMenuOption
  onClick: () => void
  onMouseEnter: () => void
}) {
  if (option.isDisabled) {
    return (
      <li
        ref={option.setRefElement}
        id={`typeahead-item-${option.key}`}
        role="option"
        aria-selected={false}
        aria-disabled
        tabIndex={-1}
        className="px-space-xs py-space-xs"
      >
        <VariablePickerEmptyState query={option.label} />
      </li>
    )
  }

  const metaLabel = option.parentLabel ?? option.groupTitle
  const variableVisual = getVariableVisual({
    groupTitle: option.groupTitle,
    label: option.label,
    parentLabel: metaLabel,
    type: option.type,
  })

  return (
    <li
      ref={option.setRefElement}
      id={`typeahead-item-${option.key}`}
      role="option"
      aria-selected={isSelected}
      aria-label={option.label}
      tabIndex={-1}
      className={cn(
        'group flex cursor-pointer items-start gap-space-sm rounded-radius-xl border px-space-sm py-space-sm transition-all',
        'border-border-default bg-components-dropdown-bg hover:border-components-system-accent-border hover:bg-background-subtle',
        isSelected &&
          'border-components-system-accent-border bg-components-system-accent-soft shadow-elevation-low',
      )}
      onMouseDown={(event) => {
        event.preventDefault()
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      <div
        className={cn(
          'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-radius-xl border border-border-default bg-background-subtle text-components-system-accent-text',
          isSelected &&
            'border-components-system-accent-border bg-surface-primary',
        )}
      >
        <span className="flex items-center justify-center [&_svg]:size-4">
          {variableVisual.icon}
        </span>

        <span className="absolute -bottom-1 -right-1 inline-flex min-w-5 items-center justify-center rounded-radius-full border border-components-dropdown-border bg-components-dropdown-bg px-1 py-0.5 text-xs font-semibold leading-none text-text-secondary shadow-elevation-low">
          {variableVisual.sourceInitials}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-space-sm">
          <span className="line-clamp-1 flex-1 text-sm font-medium text-text-primary">
            {option.label}
          </span>
          <VariableTypeBadge type={option.type} />
        </div>

        <div className="mt-space-xs flex flex-wrap items-center gap-space-xs text-xs text-text-secondary">
          <span className="inline-flex max-w-full items-center rounded-radius-full bg-background-subtle px-space-sm py-0.5">
            <span className="truncate">{metaLabel}</span>
          </span>
          <code className="max-w-full truncate rounded-radius-sm bg-surface-primary px-space-xs py-0.5 font-mono text-xs text-text-tertiary">
            {`{${option.value}}`}
          </code>
        </div>
      </div>
    </li>
  )
}

export default function VariablePickerMenuPlugin({
  options = [],
}: VariablePickerMenuPluginProps): JSX.Element {
  const [editor] = useLexicalComposerContext()
  const { t } = useTranslation()

  const triggerFn = useCallback((text: string) => {
    const triggerRegex = /(^|\s|\()([/]((?:[^/\s()])*))$/
    const match = triggerRegex.exec(text)

    if (match === null) {
      return null
    }

    const mayLeadingWhitespace = match[1]

    return {
      leadOffset: match.index + mayLeadingWhitespace.length,
      matchingString: match[3],
      replaceableString: match[2],
    }
  }, [])

  const [queryString, setQueryString] = React.useState('')
  const deferredQueryString = useDeferredValue(queryString)

  const groupedOptions = useMemo(() => {
    return filterVariableOptionGroups(options, deferredQueryString)
      .map((group) => ({
        ...group,
        options: group.options.map(
          (option) =>
            new VariableMenuOption({
              ...option,
              groupTitle: group.title,
              parentLabel: option.parentLabel ?? group.title,
            }),
        ),
      }))
      .filter((group) => group.options.length > 0)
  }, [deferredQueryString, options])

  const emptyOption = useMemo(
    () =>
      new VariableMenuOption({
        groupTitle: t('flow.variablePickerSuggestions', 'Suggestions'),
        label: queryString,
        value: '__empty__',
        parentLabel: '',
        isDisabled: true,
      }),
    [queryString, t],
  )

  const renderGroups = useMemo(
    () =>
      groupedOptions.length > 0
        ? groupedOptions
        : [
            {
              label: t('flow.variablePickerSuggestions', 'Suggestions'),
              title: t('flow.variablePickerSuggestions', 'Suggestions'),
              options: [emptyOption],
            },
          ],
    [emptyOption, groupedOptions, t],
  )

  const flattenedOptions = useMemo(
    () => renderGroups.flatMap((group) => group.options),
    [renderGroups],
  )

  const selectableOptionCount = useMemo(
    () => flattenedOptions.filter((option) => !option.isDisabled).length,
    [flattenedOptions],
  )

  const scrollViewportRef = React.useRef<HTMLDivElement>(null)

  const stopCanvasGesturePropagation = useCallback(
    (event: React.SyntheticEvent) => {
      event.stopPropagation()
    },
    [],
  )

  const trapPopoverScroll = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      const viewport = scrollViewportRef.current

      if (viewport) {
        const nextTop = clamp(
          viewport.scrollTop + event.deltaY,
          0,
          Math.max(0, viewport.scrollHeight - viewport.clientHeight),
        )
        const nextLeft = clamp(
          viewport.scrollLeft + event.deltaX,
          0,
          Math.max(0, viewport.scrollWidth - viewport.clientWidth),
        )

        viewport.scrollTop = nextTop
        viewport.scrollLeft = nextLeft
      }

      event.preventDefault()
      event.stopPropagation()
    },
    [],
  )

  const onSelectOption = useCallback(
    (
      selectedOption: VariableMenuOption,
      nodeToRemove: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        const selection = $getSelection()

        if (
          !$isRangeSelection(selection) ||
          selectedOption === null ||
          selectedOption.isDisabled
        ) {
          return
        }

        if (nodeToRemove) {
          nodeToRemove.remove()
        }

        selection.insertNodes([
          $createVariableNode(
            selectedOption.value,
            selectedOption.label,
            selectedOption.parentLabel ?? selectedOption.groupTitle,
            selectedOption.type,
            getVariableVisual({
              groupTitle: selectedOption.groupTitle,
              label: selectedOption.label,
              parentLabel:
                selectedOption.parentLabel ?? selectedOption.groupTitle,
              type: selectedOption.type,
            }).icon,
          ),
        ])

        closeMenu()
      })
    },
    [editor],
  )

  return (
    <LexicalTypeaheadMenuPlugin<VariableMenuOption>
      commandPriority={COMMAND_PRIORITY_CRITICAL}
      onQueryChange={(query) => setQueryString(query?.toLowerCase() ?? '')}
      onSelectOption={onSelectOption}
      triggerFn={triggerFn}
      options={flattenedOptions}
      menuRenderFn={(
        anchorElementRef,
        {
          options: renderedOptions,
          selectOptionAndCleanUp,
          selectedIndex,
          setHighlightedIndex,
        },
      ) => {
        if (!anchorElementRef.current || !flattenedOptions.length) {
          return null
        }

        const selectedValue: string =
          selectedIndex !== null
            ? (renderedOptions[selectedIndex] as VariableMenuOption | undefined)
                ?.value ?? ''
            : ''

        const activeOption = flattenedOptions.find(
          (option) => !option.isDisabled && option.value === selectedValue,
        )

        return ReactDOM.createPortal(
          <VariablePickerPopover
            anchorElement={anchorElementRef.current}
            onGestureCapture={stopCanvasGesturePropagation}
            onWheelCapture={trapPopoverScroll}
            header={
              <div className="border-b border-components-dropdown-border px-space-base py-space-sm">
                <div className="flex items-start justify-between gap-space-sm">
                  <div className="flex min-w-0 items-start gap-space-sm">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-radius-xl bg-components-system-accent-bg text-components-system-accent-text">
                      <VariableIcon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-text-primary">
                        {t('flow.variablePickerTitle', 'Insert Variable')}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {queryString
                          ? t(
                              'flow.variablePickerFiltering',
                              `Filtering results for "/${queryString}"`,
                            )
                          : t(
                              'flow.variablePickerHint',
                              'Type after / to narrow results, then press Enter to insert.',
                            )}
                      </div>
                    </div>
                  </div>

                  <span className="inline-flex shrink-0 items-center rounded-radius-full bg-background-subtle px-space-sm py-space-xs text-xs text-text-secondary">
                    {selectableOptionCount}
                  </span>
                </div>

                <div className="mt-space-xs flex flex-wrap items-center gap-space-sm text-xs text-text-secondary">
                  <span className="inline-flex items-center gap-space-xs">
                    <ArrowUpDown className="size-3.5" />
                    {t('flow.variablePickerNavigate', 'Navigate')}
                  </span>
                  <span className="inline-flex items-center gap-space-xs">
                    <CornerDownLeft className="size-3.5" />
                    {t('flow.variablePickerInsert', 'Insert')}
                  </span>
                </div>
              </div>
            }
            footer={
              <div className="border-t border-components-dropdown-border px-space-base py-space-xs">
                <div className="flex items-center justify-between gap-space-sm">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-text-primary">
                      {activeOption
                        ? `${activeOption.parentLabel ?? activeOption.groupTitle} / ${activeOption.label}`
                        : t(
                            'flow.variablePickerFooterTitle',
                            'Scroll inside this panel to browse more variables',
                          )}
                    </div>
                    <div className="truncate text-xs text-text-secondary">
                      {activeOption
                        ? `{${activeOption.value}}`
                        : t(
                            'flow.variablePickerFooterHint',
                            'The canvas will stay still while you explore this list.',
                          )}
                    </div>
                  </div>

                  {activeOption ? (
                    <VariableTypeBadge type={activeOption.type} />
                  ) : (
                    <span className="inline-flex shrink-0 items-center rounded-radius-full bg-background-subtle px-space-sm py-space-xs text-xs text-text-secondary">
                      {selectableOptionCount}
                    </span>
                  )}
                </div>
              </div>
            }
          >
            <ScrollArea
              className="typeahead-popover-scroll min-h-0 flex-1"
              viewportClassName="typeahead-popover-scroll-viewport p-space-sm"
              viewportRef={scrollViewportRef}
            >
              <div className="space-y-space-md">
                {renderGroups.map((group) => (
                  <section key={group.title} className="space-y-space-xs">
                    <div className="flex items-center justify-between px-space-xs">
                      <div className="truncate text-xs font-medium uppercase tracking-wide text-text-tertiary">
                        {group.title}
                      </div>
                      {!group.options.some((option) => option.isDisabled) ? (
                        <span className="inline-flex items-center rounded-radius-full bg-background-subtle px-space-sm py-0.5 text-xs text-text-secondary">
                          {group.options.length}
                        </span>
                      ) : null}
                    </div>

                    <ul role="group" aria-label={group.title} className="space-y-space-xs">
                      {group.options.map((option) => (
                        <VariablePickerItem
                          key={option.value}
                          option={option}
                          isSelected={
                            !option.isDisabled && option.value === selectedValue
                          }
                          onMouseEnter={() => {
                            if (option.isDisabled) {
                              return
                            }

                            const nextIndex = flattenedOptions.findIndex(
                              (candidate) => candidate.value === option.value,
                            )
                            if (nextIndex >= 0) {
                              setHighlightedIndex(nextIndex)
                            }
                          }}
                          onClick={() => {
                            if (!option.isDisabled) {
                              selectOptionAndCleanUp(option)
                            }
                          }}
                        />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </ScrollArea>
          </VariablePickerPopover>,
          anchorElementRef.current,
        )
      }}
    />
  )
}
