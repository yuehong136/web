import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTranslation } from '../../hooks/use-translation'
import { cn, getTypeLabel } from '../../lib/utils'
import {
  getArrayItemsSchema,
  getSchemaProperties,
  renameObjectProperty,
  removeObjectProperty,
  updateObjectProperty,
  updatePropertyRequired,
} from '../../lib/schema-editor'
import type {
  JSONSchema,
  NewField,
  ObjectJSONSchema,
  SchemaType,
} from '../../types/json-schema'
import { asObjectSchema } from '../../types/json-schema'
import { InlineFieldForm } from './inline-field-form'
import {
  buildFieldDraft,
  EDITABLE_TYPES,
  getSchemaType,
  normalizeObjectSchema,
  withTypeDefaults,
} from './schema-visual-editor-utils'
import { SchemaTypeBadge } from './schema-type-badge'

type ObjectFieldsEditorProps = {
  schema: JSONSchema
  onChange: (schema: ObjectJSONSchema) => void
  depth?: number
  pattern?: RegExp | string
}

export function ObjectFieldsEditor({
  schema,
  onChange,
  depth = 0,
  pattern,
}: ObjectFieldsEditorProps) {
  const t = useTranslation()
  const [adding, setAdding] = useState(false)
  const normalizedSchema = useMemo(() => normalizeObjectSchema(schema), [schema])
  const properties = getSchemaProperties(normalizedSchema)
  const existingNames = properties.map((property) => property.name)

  const handleAddField = (field: NewField) => {
    const fieldSchema = withTypeDefaults(field)
    let nextSchema = updateObjectProperty(
      normalizedSchema,
      field.name,
      fieldSchema,
    )
    if (field.required) {
      nextSchema = updatePropertyRequired(nextSchema, field.name, true)
    }
    onChange(nextSchema)
    setAdding(false)
  }

  const handleEditField = (currentName: string, field: NewField) => {
    const currentProperty = normalizedSchema.properties?.[currentName]
    const nextSchema = renameObjectProperty(
      normalizedSchema,
      currentName,
      field.name,
      withTypeDefaults(field, currentProperty),
      field.required,
    )
    onChange(nextSchema)
  }

  return (
    <div className="space-y-space-sm">
      {properties.length === 0 ? (
        <div className="rounded-radius-md border border-border-subtle bg-surface-secondary p-space-md text-center text-sm text-text-caption">
          {t.visualEditorNoFieldsHint1}
        </div>
      ) : (
        properties.map((property) => (
          <SchemaFieldRow
            key={property.name}
            name={property.name}
            schema={property.schema}
            required={property.required}
            depth={depth}
            existingNames={existingNames}
            pattern={pattern}
            onEdit={(field) => handleEditField(property.name, field)}
            onDelete={() => {
              onChange(removeObjectProperty(normalizedSchema, property.name))
            }}
            onRequiredChange={(required) => {
              onChange(
                updatePropertyRequired(
                  normalizedSchema,
                  property.name,
                  required,
                ),
              )
            }}
            onSchemaChange={(fieldSchema) => {
              onChange(
                updateObjectProperty(
                  normalizedSchema,
                  property.name,
                  fieldSchema,
                ),
              )
            }}
          />
        ))
      )}
      {adding ? (
        <InlineFieldForm
          existingNames={existingNames}
          pattern={pattern}
          submitLabel={t.fieldAddNewConfirm}
          onSubmit={handleAddField}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <Button type="button" size="sm" onClick={() => setAdding(true)}>
          <Plus className="h-icon-sm w-icon-sm" />
          {t.fieldAddNewButton}
        </Button>
      )}
    </div>
  )
}

type SchemaFieldRowProps = {
  name: string
  schema: JSONSchema
  required: boolean
  depth: number
  existingNames: string[]
  pattern?: RegExp | string
  onEdit: (field: NewField) => void
  onDelete: () => void
  onRequiredChange: (required: boolean) => void
  onSchemaChange: (schema: ObjectJSONSchema) => void
}

function SchemaFieldRow({
  name,
  schema,
  required,
  depth,
  existingNames,
  pattern,
  onEdit,
  onDelete,
  onRequiredChange,
  onSchemaChange,
}: SchemaFieldRowProps) {
  const t = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const type = getSchemaType(schema)
  const objectSchema = asObjectSchema(schema)
  const canExpand = type === 'object' || type === 'array'

  return (
    <div
      className={cn(
        'rounded-radius-md border border-border-subtle bg-surface-primary',
        depth > 0 && 'ml-space-md',
      )}
    >
      <div className="flex min-h-12 items-center gap-space-sm px-space-sm py-space-xs">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          disabled={!canExpand}
          onClick={() => setExpanded((value) => !value)}
          aria-label={expanded ? t.collapse : t.expand}
        >
          {expanded ? (
            <ChevronDown className="h-icon-sm w-icon-sm" />
          ) : (
            <ChevronRight className="h-icon-sm w-icon-sm" />
          )}
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-space-sm">
            <span className="truncate text-sm font-medium text-text-primary">
              {name}
            </span>
            {required && (
              <span className="rounded-radius-sm bg-components-api-status-error-bg px-space-xs py-[1px] text-xs text-components-api-status-error-text">
                {t.propertyRequired}
              </span>
            )}
          </div>
          {objectSchema.description && (
            <p className="truncate text-xs text-text-caption">
              {objectSchema.description}
            </p>
          )}
        </div>
        <SchemaTypeBadge type={type} />
        <label className="flex shrink-0 items-center gap-space-xs text-xs text-text-caption">
          <Checkbox
            checked={required}
            onCheckedChange={(checked) => onRequiredChange(Boolean(checked))}
          />
          {t.propertyRequired}
        </label>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-text-caption hover:text-text-primary"
          onClick={() => setEditing((value) => !value)}
          aria-label={t.fieldSaveConfirm}
        >
          <Pencil className="h-icon-sm w-icon-sm" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-text-caption hover:text-status-error"
          onClick={onDelete}
          aria-label={t.propertyDelete}
        >
          <Trash2 className="h-icon-sm w-icon-sm" />
        </Button>
      </div>
      {editing && (
        <div className="border-t border-border-subtle p-space-sm">
          <InlineFieldForm
            initialField={buildFieldDraft(name, schema, required)}
            existingNames={existingNames}
            pattern={pattern}
            submitLabel={t.fieldSaveConfirm}
            onSubmit={(field) => {
              onEdit(field)
              setEditing(false)
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}
      {expanded && canExpand && (
        <div className="border-t border-border-subtle p-space-sm">
          {type === 'object' ? (
            <ObjectFieldsEditor
              schema={schema}
              depth={depth + 1}
              onChange={onSchemaChange}
              pattern={pattern}
            />
          ) : (
            <ArrayItemEditor
              schema={objectSchema}
              depth={depth + 1}
              onChange={onSchemaChange}
              pattern={pattern}
            />
          )}
        </div>
      )}
    </div>
  )
}

type ArrayItemEditorProps = {
  schema: ObjectJSONSchema
  onChange: (schema: ObjectJSONSchema) => void
  depth: number
  pattern?: RegExp | string
}

function ArrayItemEditor({
  schema,
  onChange,
  depth,
  pattern,
}: ArrayItemEditorProps) {
  const t = useTranslation()
  const itemsSchema = getArrayItemsSchema(schema) ?? { type: 'string' }
  const itemType = getSchemaType(itemsSchema)

  const handleItemTypeChange = (type: SchemaType) => {
    onChange({
      ...schema,
      type: 'array',
      items: withTypeDefaults({
        name: 'items',
        type,
        description: '',
        required: false,
      }, itemsSchema),
    })
  }

  return (
    <div className="space-y-space-sm">
      <div className="flex items-center justify-between gap-space-sm">
        <span className="text-sm font-medium text-text-secondary">
          {t.arrayItemTypeLabel}
        </span>
        <Select
          value={itemType}
          onValueChange={(value) => handleItemTypeChange(value as SchemaType)}
        >
          <SelectTrigger className="h-9 max-w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EDITABLE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {getTypeLabel(t, type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {itemType === 'object' && (
        <ObjectFieldsEditor
          schema={itemsSchema}
          depth={depth}
          onChange={(items) => onChange({ ...schema, type: 'array', items })}
          pattern={pattern}
        />
      )}
      {itemType === 'array' && (
        <ArrayItemEditor
          schema={asObjectSchema(itemsSchema)}
          depth={depth}
          onChange={(items) => onChange({ ...schema, type: 'array', items })}
          pattern={pattern}
        />
      )}
    </div>
  )
}
