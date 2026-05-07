import {
  createFieldSchema,
} from '../../lib/schema-editor'
import type {
  JSONSchema,
  NewField,
  ObjectJSONSchema,
  SchemaType,
} from '../../types/json-schema'
import {
  asObjectSchema,
  isBooleanSchema,
  isObjectSchema,
} from '../../types/json-schema'

export const EDITABLE_TYPES: SchemaType[] = [
  'string',
  'number',
  'integer',
  'boolean',
  'object',
  'array',
]

export function normalizeObjectSchema(schema: JSONSchema): ObjectJSONSchema {
  const objectSchema = isObjectSchema(schema)
    ? schema
    : ({ type: 'object' } satisfies ObjectJSONSchema)

  return {
    ...objectSchema,
    type: 'object',
    properties: objectSchema.properties ?? {},
  }
}

export function getSchemaType(schema: JSONSchema): SchemaType {
  if (isBooleanSchema(schema)) return 'object'
  const type = schema.type
  if (Array.isArray(type)) return type[0] ?? 'object'
  return type ?? 'object'
}

export function buildFieldDraft(
  name: string,
  schema: JSONSchema,
  required: boolean,
): NewField {
  const objectSchema = asObjectSchema(schema)
  return {
    name,
    type: getSchemaType(schema),
    description: objectSchema.description ?? '',
    required,
    validation: objectSchema,
  }
}

export function withTypeDefaults(
  field: NewField,
  previousSchema?: JSONSchema,
): ObjectJSONSchema {
  const previous = previousSchema && isObjectSchema(previousSchema)
    ? previousSchema
    : undefined
  const description = field.description.trim() || undefined
  const base = createFieldSchema(field)
  const next = isObjectSchema(base)
    ? base
    : ({ type: field.type } as ObjectJSONSchema)

  if (field.type === 'object') {
    return {
      ...next,
      type: 'object',
      description,
      properties:
        previous?.type === 'object'
          ? previous.properties ?? {}
          : next.properties ?? {},
    }
  }

  if (field.type === 'array') {
    return {
      ...next,
      type: 'array',
      description,
      items:
        previous?.type === 'array'
          ? previous.items ?? { type: 'string' }
          : next.items ?? { type: 'string' },
    }
  }

  return {
    ...next,
    type: field.type,
    description,
  }
}

export function sanitizeFieldName(value: string, pattern?: RegExp | string) {
  const searchValue = pattern ?? /[^a-zA-Z0-9_]/g
  return value.replace(searchValue, '')
}
