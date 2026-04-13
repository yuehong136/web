import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { SelectWithSearch } from '@/components/ui/select-with-search'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { initialParserValues } from '../../constant'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import {
  FormWrapper,
  Output,
  buildOutputList,
} from '../components'
import { getParserFileTypeLabel, parserAddableFileTypeOptions } from './constants'
import { ParserActiveEditor } from './parser-active-editor'
import { ParserSetupCard } from './parser-setup-card'
import { parserSchema, type ParserFormValues } from './schema'
import {
  getDefaultParserSetup,
  normalizeParserFormForStore,
} from './utils'

export const ParserForm = memo(function ParserForm({
  node,
}: INextOperatorForm) {
  const { t } = useTranslation()
  const values = normalizeParserFormForStore(
    useFormValues(initialParserValues, node),
  )

  const form = useForm<
    ParserFormValues,
    unknown,
    z.output<typeof parserSchema>
  >({
    resolver: zodResolver(parserSchema),
    defaultValues: values as ParserFormValues,
  })

  const setupsFieldArray = useFieldArray({
    control: form.control,
    name: 'setups',
  })
  const watchedSetups = useWatch({
    control: form.control,
    name: 'setups',
  })

  useWatchFormChange(node?.id, form)

  const outputs = useMemo(() => buildOutputList(form.getValues('outputs')), [form])
  const currentFileFormats = useMemo(
    () => watchedSetups?.map((item) => item?.fileFormat || '') || [],
    [watchedSetups],
  )
  const missingFileFormats = parserAddableFileTypeOptions.filter(
    (option) => !currentFileFormats.includes(option),
  )
  const [activeIndex, setActiveIndex] = useState(0)
  const [newParserType, setNewParserType] = useState('')
  const activeFieldKey = setupsFieldArray.fields[activeIndex]?.id ?? `parser-${activeIndex}`
  const listViewportRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!setupsFieldArray.fields.length) {
      if (activeIndex !== 0) {
        setActiveIndex(0)
      }
      return
    }

    if (activeIndex > setupsFieldArray.fields.length - 1) {
      setActiveIndex(Math.max(0, setupsFieldArray.fields.length - 1))
    }
  }, [activeIndex, setupsFieldArray.fields.length])

  useEffect(() => {
    if (!missingFileFormats.length) {
      if (newParserType) {
        setNewParserType('')
      }
      return
    }

    if (!newParserType || !missingFileFormats.includes(newParserType)) {
      setNewParserType(missingFileFormats[0] || '')
    }
  }, [missingFileFormats, newParserType])

  useEffect(() => {
    const viewport = listViewportRef.current

    if (!viewport) {
      return
    }

    const stopWheelPropagation = (event: WheelEvent) => {
      if (viewport.scrollHeight > viewport.clientHeight) {
        event.stopPropagation()
      }
    }

    viewport.addEventListener('wheel', stopWheelPropagation, {
      capture: true,
      passive: true,
    })

    return () => {
      viewport.removeEventListener('wheel', stopWheelPropagation, true)
    }
  }, [setupsFieldArray.fields.length])

  const addableTypeOptions = useMemo(
    () =>
      missingFileFormats.map((value) => ({
        label: getParserFileTypeLabel(t, value),
        value,
      })),
    [missingFileFormats, t],
  )

  const removeSetup = (index: number) => {
    setupsFieldArray.remove(index)
    setActiveIndex((current) => {
      if (current > index) {
        return current - 1
      }

      if (current === index) {
        return Math.max(0, Math.min(index, setupsFieldArray.fields.length - 2))
      }

      return current
    })
  }

  return (
    <Form {...form}>
      <FormWrapper className="space-y-space-xl">
        <div className="space-y-space-md">
          <p className="max-w-3xl text-base leading-8 text-text-secondary">
            {t(
              'flow.parserDescription',
              'Extract raw text and structure from incoming files before downstream processing.',
            )}
          </p>
        </div>

        <section className="space-y-space-lg">
          <div className="flex flex-col gap-space-md">
            <div className="flex items-center justify-between gap-space-sm">
              <div className="text-base font-semibold text-text-secondary">
                {t('flow.parserList', 'Parsers')}
              </div>
              {missingFileFormats.length === 0 ? (
                <span className="text-base text-text-tertiary">
                  {t('flow.parserAddDisabled', 'All parser types already added')}
                </span>
              ) : null}
            </div>

            {missingFileFormats.length > 0 ? (
              <div className="flex flex-col gap-space-sm sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <SelectWithSearch
                    options={addableTypeOptions}
                    value={newParserType}
                    onChange={setNewParserType}
                    disabled={missingFileFormats.length === 0}
                    triggerClassName="h-12 w-full rounded-radius-xl border-border-default bg-surface-primary px-space-base py-space-sm text-base"
                    placeholder={t('flow.addParser', 'Add parser')}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full rounded-radius-xl px-space-base text-base sm:w-auto sm:shrink-0"
                  disabled={!newParserType || missingFileFormats.length === 0}
                  onClick={() => {
                    if (!newParserType) {
                      return
                    }

                    const nextFileType = newParserType
                    const nextIndex = setupsFieldArray.fields.length
                    setupsFieldArray.append(getDefaultParserSetup(nextFileType))
                    setActiveIndex(nextIndex)
                  }}
                >
                  <Plus className="size-4" />
                  {t('flow.addParser', 'Add parser')}
                </Button>
              </div>
            ) : null}
          </div>

          <ScrollArea
            className="border-y border-border-subtle"
            viewportClassName="max-h-80 overscroll-contain"
            viewportRef={listViewportRef}
            onWheelCapture={(event) => event.stopPropagation()}
          >
            {setupsFieldArray.fields.map((field, index) => (
              <ParserSetupCard
                key={field.id}
                index={index}
                selected={activeIndex === index}
                showRemove={setupsFieldArray.fields.length > 1}
                onSelect={() => setActiveIndex(index)}
                onRemove={() => removeSetup(index)}
              />
            ))}
          </ScrollArea>
        </section>

        {setupsFieldArray.fields.length > 0 ? (
          <ParserActiveEditor
            key={activeFieldKey}
            index={activeIndex}
            showRemove={setupsFieldArray.fields.length > 1}
            allFileFormats={currentFileFormats}
            onRemove={() => removeSetup(activeIndex)}
          />
        ) : null}

        <Separator className="bg-border-subtle" />

        <Output list={outputs} />
      </FormWrapper>
    </Form>
  )
})
