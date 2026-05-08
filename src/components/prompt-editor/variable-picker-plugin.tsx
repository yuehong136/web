import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
} from '@lexical/react/LexicalTypeaheadMenuPlugin'
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  TextNode,
} from 'lexical'
import type { JSX, ReactNode } from 'react'
import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useDeferredValue,
  useMemo,
} from 'react'
import * as ReactDOM from 'react-dom'
import { ChevronRight, Variable } from 'lucide-react'

import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { StructuredOutputSecondaryMenu } from '@/pages/agent/form/components/structured-output-secondary-menu'
import {
  useFindAgentStructuredOutputLabel,
  useShowSecondaryMenu,
} from '@/pages/agent/hooks/use-build-structured-output'
import { JsonSchemaDataType } from '@/pages/agent/constant'
import { $createVariableNode } from './variable-node'
import type { VariableOptionGroup, VariableOptionItem } from './types'
import { filterVariableOptionGroups } from './utils'

if (typeof document !== 'undefined') {
  void import('./index.css')
}

const SelectedValueContext = createContext<string>('')

class VariableMenuOption extends MenuOption {
  label: string
  value: string
  parentLabel?: string
  icon?: ReactNode
  type?: string
  groupTitle: string
  insertMode?: 'text' | 'variable'

  constructor({
    groupTitle,
    label,
    value,
    parentLabel,
    icon,
    type,
    insertMode,
  }: VariableOptionItem & { groupTitle: string }) {
    super(value)
    this.label = label
    this.value = value
    this.parentLabel = parentLabel
    this.icon = icon
    this.type = type
    this.groupTitle = groupTitle
    this.insertMode = insertMode
  }
}

const VariablePickerRow = forwardRef<
  HTMLLIElement,
  {
    option: VariableMenuOption
    label?: string
    hasSubMenu?: boolean
    className?: string
    onClick?: () => void
    onMouseEnter?: () => void
  }
>(function VariablePickerRow(
  { option, label, hasSubMenu, className, onClick, onMouseEnter },
  ref,
) {
  const selectedValue = useContext(SelectedValueContext)
  const isSelected = option.value === selectedValue

  return (
    <li
      ref={ref}
      role="option"
      aria-label={option.label}
      aria-selected={isSelected}
      onMouseDown={(event) => event.preventDefault()}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={cn(
        'gap-space-sm rounded-radius-sm px-space-sm py-space-xs flex cursor-pointer items-center justify-between text-sm text-text-primary',
        'hover:bg-components-dropdown-item-bg-hover focus-visible:bg-components-dropdown-item-bg-hover',
        isSelected && 'bg-components-dropdown-item-bg-hover',
        className,
      )}
    >
      <span className="min-w-0 flex-1 truncate">{label ?? option.label}</span>
      <span className="shrink-0 text-xs text-text-secondary">
        {option.type}
      </span>
      {hasSubMenu ? (
        <ChevronRight className="ml-space-xs size-3.5 shrink-0 text-text-secondary" />
      ) : null}
    </li>
  )
})

function VariablePickerGroup({
  title,
  options,
  types,
  selectOptionAndCleanUp,
  setHighlightedIndex,
  flattenedOptions,
}: {
  title: string
  options: VariableMenuOption[]
  types?: (typeof JsonSchemaDataType)[keyof typeof JsonSchemaDataType][]
  selectOptionAndCleanUp: (option: VariableMenuOption) => void
  setHighlightedIndex: (index: number) => void
  flattenedOptions: VariableMenuOption[]
}) {
  const showSecondaryMenu = useShowSecondaryMenu()

  return (
    <ul role="group" aria-label={title} className="space-y-[2px]">
      <li role="presentation" className="px-space-xs">
        <div className="py-space-xs cursor-auto text-xs font-medium uppercase tracking-wide text-text-tertiary">
          {title}
        </div>
      </li>

      {options.map((option) => {
        const handleHover = () => {
          const nextIndex = flattenedOptions.findIndex(
            (candidate) => candidate.value === option.value,
          )
          if (nextIndex >= 0) {
            setHighlightedIndex(nextIndex)
          }
        }

        if (showSecondaryMenu(option.value, option.label)) {
          return (
            <StructuredOutputSecondaryMenu
              key={option.value}
              ref={option.setRefElement}
              data={option}
              types={types}
              click={(picked) =>
                selectOptionAndCleanUp(
                  Object.assign(
                    new VariableMenuOption({
                      ...option,
                      groupTitle: option.groupTitle,
                      label: String(picked.label),
                      value: picked.value,
                    }),
                  ),
                )
              }
            />
          )
        }

        return (
          <VariablePickerRow
            key={option.value}
            ref={option.setRefElement}
            option={option}
            onClick={() => selectOptionAndCleanUp(option)}
            onMouseEnter={handleHover}
          />
        )
      })}
    </ul>
  )
}

export interface VariablePickerMenuPluginProps {
  options?: VariableOptionGroup[]
  types?: (typeof JsonSchemaDataType)[keyof typeof JsonSchemaDataType][]
}

export default function VariablePickerMenuPlugin({
  options = [],
  types,
}: VariablePickerMenuPluginProps): JSX.Element {
  const [editor] = useLexicalComposerContext()
  const findAgentStructuredOutputLabel = useFindAgentStructuredOutputLabel()

  const triggerFn = useCallback((text: string) => {
    const triggerRegex = /(^|\s|\()([/]((?:[^/\s()])*))$/
    const match = triggerRegex.exec(text)

    if (match === null) {
      return null
    }

    const mayLeadingWhitespace = match[1] ?? ''
    const replaceableString = match[2]
    const matchingString = match[3]

    if (!replaceableString || matchingString === undefined) {
      return null
    }

    return {
      leadOffset: match.index + mayLeadingWhitespace.length,
      matchingString,
      replaceableString,
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

  const flattenedOptions = useMemo(
    () => groupedOptions.flatMap((group) => group.options),
    [groupedOptions],
  )

  const scrollViewportRef = React.useRef<HTMLDivElement>(null)

  const stopCanvasGesturePropagation = useCallback(
    (event: React.SyntheticEvent) => {
      event.stopPropagation()
    },
    [],
  )

  const preventPopoverMouseDown = useCallback((event: React.MouseEvent) => {
    // Prevent the ContentEditable from losing focus when clicking inside
    // the popover — otherwise the Lexical selection becomes null and
    // selection.insertNodes() silently no-ops on click.
    event.preventDefault()
    event.stopPropagation()
  }, [])

  const trapPopoverScroll = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      const viewport = scrollViewportRef.current
      if (viewport) {
        viewport.scrollTop += event.deltaY
        viewport.scrollLeft += event.deltaX
      }
      event.preventDefault()
      event.stopPropagation()
    },
    [],
  )

  const onSelectOption = useCallback(
    (
      selectedOption: VariableMenuOption | null,
      nodeToRemove: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        if (selectedOption === null) {
          return
        }

        // When selecting an Agent structured-output sub-path, fall back to
        // the structured output label resolver so the chip renders correctly.
        const resolvedLabel =
          findAgentStructuredOutputLabel(
            selectedOption.value,
            flattenedOptions as VariableOptionItem[],
          )?.label ?? selectedOption.label

        if (selectedOption.insertMode === 'text') {
          if (nodeToRemove) {
            nodeToRemove.replace($createTextNode(selectedOption.value))
          } else {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              selection.insertText(selectedOption.value)
            }
          }
          closeMenu()
          return
        }

        const variableNode = $createVariableNode(
          selectedOption.value,
          String(resolvedLabel),
          selectedOption.parentLabel ?? selectedOption.groupTitle,
          selectedOption.type,
          selectedOption.icon,
        )

        // Prefer nodeToRemove.replace because it works even when the
        // ContentEditable has lost focus (so $getSelection() is null).
        // React Flow's canvas can steal focus when the popover is clicked;
        // without this fallback the `/` text is never consumed and the
        // typeahead re-opens — which looks like the picker "refreshing".
        if (nodeToRemove) {
          nodeToRemove.replace(variableNode)
          variableNode.selectNext()
        } else {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            selection.insertNodes([variableNode])
          }
        }

        closeMenu()
      })
    },
    [editor, findAgentStructuredOutputLabel, flattenedOptions],
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
        { selectOptionAndCleanUp, selectedIndex, setHighlightedIndex },
      ) => {
        if (!anchorElementRef.current || !flattenedOptions.length) {
          return null
        }

        const selectedValue: string =
          selectedIndex !== null
            ? (flattenedOptions[selectedIndex]?.value ?? '')
            : ''

        return ReactDOM.createPortal(
          <SelectedValueContext.Provider value={selectedValue}>
            <div
              className={cn(
                'typeahead-popover nodrag nopan nowheel rounded-radius-md flex w-80 flex-col overflow-hidden border border-border-default bg-components-dropdown-bg shadow-lg',
              )}
              onWheelCapture={trapPopoverScroll}
              onMouseDown={preventPopoverMouseDown}
              onPointerDown={stopCanvasGesturePropagation}
              onTouchStart={stopCanvasGesturePropagation}
              onTouchMove={stopCanvasGesturePropagation}
            >
              <div className="gap-space-xs px-space-sm py-space-xs flex items-center border-b border-border-default">
                <Variable className="size-3.5 text-text-secondary" />
                <span className="text-xs text-text-secondary">
                  {queryString ? `/${queryString}` : '/'}
                </span>
              </div>
              <ScrollArea
                className="typeahead-popover-scroll min-h-0 flex-1"
                viewportClassName="typeahead-popover-scroll-viewport p-space-xs"
                viewportRef={scrollViewportRef}
              >
                <div className="space-y-space-sm max-h-64">
                  {groupedOptions.map((group) => (
                    <VariablePickerGroup
                      key={group.title}
                      title={group.title}
                      options={group.options}
                      types={types}
                      selectOptionAndCleanUp={selectOptionAndCleanUp}
                      setHighlightedIndex={setHighlightedIndex}
                      flattenedOptions={flattenedOptions}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </SelectedValueContext.Provider>,
          anchorElementRef.current,
        )
      }}
    />
  )
}
