import {
  en as jsonjoyEn,
  JsonSchemaVisualizer,
  SchemaVisualEditor,
  TranslationContext,
  type JsonSchemaValidationState,
  type JSONSchema,
  zhCN as jsonjoyZhCN,
} from '@/components/jsonjoy-builder'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

export interface IModalProps<T = unknown> {
  visible?: boolean
  hideModal?: () => void
  onOk?: (data: T) => void
  initialValues?: T
}

export interface KeyInputProps {
  pattern?: RegExp | string
}

const DEFAULT_SCHEMA: JSONSchema = { type: 'object' }

function isRootObjectSchema(schema: JSONSchema) {
  return (
    typeof schema === 'object' &&
    schema !== null &&
    !Array.isArray(schema) &&
    (schema.type === undefined || schema.type === 'object')
  )
}

export function SchemaDialog({
  hideModal,
  onOk,
  initialValues,
  pattern,
}: IModalProps<JSONSchema> & KeyInputProps) {
  const { t, i18n } = useTranslation()
  const initialSchema = useMemo(
    () => initialValues ?? DEFAULT_SCHEMA,
    [initialValues],
  )
  const jsonjoyTranslation = useMemo(
    () =>
      i18n.language.toLowerCase().startsWith('zh')
        ? jsonjoyZhCN
        : jsonjoyEn,
    [i18n.language],
  )
  const [schema, setSchema] = useState<JSONSchema>(initialSchema)
  const [sourceValidation, setSourceValidation] =
    useState<JsonSchemaValidationState>({ valid: true })

  const rootObjectError = isRootObjectSchema(schema)
    ? null
    : t('flow.structuredOutput.rootObjectError')
  const schemaError = sourceValidation.valid
    ? rootObjectError
    : sourceValidation.message || t('flow.structuredOutput.invalidSource')

  const handleOk = useCallback(() => {
    if (schemaError) return
    onOk?.(schema)
  }, [onOk, schema, schemaError])

  const handleSchemaChange = useCallback((nextSchema: JSONSchema) => {
    setSchema(nextSchema)
    setSourceValidation({ valid: true })
  }, [])

  const renderVisualEditor = () => (
    <SchemaVisualEditor
      schema={schema}
      onChange={handleSchemaChange}
      pattern={pattern}
    />
  )

  const renderSourceEditor = () => (
    <JsonSchemaVisualizer
      schema={schema}
      onChange={handleSchemaChange}
      onValidationChange={setSourceValidation}
    />
  )

  return (
    <TranslationContext.Provider value={jsonjoyTranslation}>
      <Dialog onOpenChange={(open) => !open && hideModal?.()} open>
        <DialogContent className="flex h-[70vh] flex-col md:max-w-[1200px]">
          <DialogHeader>
            <DialogTitle>{t('flow.structuredOutput.configuration')}</DialogTitle>
          </DialogHeader>
          <section className="min-h-0 flex-1 overflow-hidden">
            <div className="hidden h-full grid-cols-2 gap-space-md md:grid">
              {renderVisualEditor()}
              {renderSourceEditor()}
            </div>
            <Tabs defaultValue="visual" className="flex h-full flex-col md:hidden">
              <TabsList className="shrink-0">
                <TabsTrigger value="visual">
                  {t('flow.structuredOutput.visualMode')}
                </TabsTrigger>
                <TabsTrigger value="json">
                  {t('flow.structuredOutput.jsonMode')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="visual" className="min-h-0 flex-1">
                {renderVisualEditor()}
              </TabsContent>
              <TabsContent value="json" className="min-h-0 flex-1">
                {renderSourceEditor()}
              </TabsContent>
            </Tabs>
            {schemaError && (
              <p className="text-xs text-status-error">{schemaError}</p>
            )}
          </section>
          <DialogFooter>
            <Button variant="outline" onClick={() => hideModal?.()}>{t('common.cancel')}</Button>
            <Button type="button" onClick={handleOk} disabled={Boolean(schemaError)}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TranslationContext.Provider>
  )
}
