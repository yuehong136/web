import { useMemo, type FC } from 'react'
import { useTranslation } from '../../hooks/use-translation'
import { getSchemaProperties } from '../../lib/schema-editor'
import type { JSONSchema } from '../../types/json-schema'
import type { KeyInputProps } from './interface'
import { ObjectFieldsEditor } from './object-fields-editor'
import { normalizeObjectSchema } from './schema-visual-editor-utils'

export interface SchemaVisualEditorProps {
  schema: JSONSchema
  onChange: (schema: JSONSchema) => void
}

const SchemaVisualEditor: FC<SchemaVisualEditorProps & KeyInputProps> = ({
  schema,
  onChange,
  pattern,
}) => {
  const t = useTranslation()
  const normalizedSchema = useMemo(
    () => normalizeObjectSchema(schema),
    [schema],
  )
  const properties = getSchemaProperties(normalizedSchema)
  const requiredCount = properties.filter(
    (property) => property.required,
  ).length

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-radius-md border border-line-subtle bg-surface">
      <div className="flex shrink-0 items-center justify-between gap-space-sm border-b border-line-subtle px-space-md py-space-sm">
        <div className="min-w-0">
          <p className="text-sm font-medium text-fg">
            {t.schemaEditorEditModeVisual}
          </p>
          <p className="text-xs text-fg-subtle">
            {t.visualEditorNoFieldsHint2}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-space-xs text-xs text-fg-subtle">
          <span className="rounded-radius-full bg-sunken px-space-sm py-space-xs">
            {t.visualEditorFieldsLabel}: {properties.length}
          </span>
          <span className="rounded-radius-full bg-sunken px-space-sm py-space-xs">
            {t.visualEditorRequiredLabel}: {requiredCount}
          </span>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-space-md">
        <ObjectFieldsEditor
          schema={normalizedSchema}
          onChange={onChange}
          pattern={pattern}
        />
      </div>
    </div>
  )
}

export default SchemaVisualEditor
