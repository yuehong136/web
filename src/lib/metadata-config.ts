import type {
  MetadataDefinition,
  MetadataFieldDefinition,
  MetadataTableData,
  MetadataValueType,
} from '@/types/metadata'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

export function metadataValueType(
  value: unknown,
): MetadataValueType | undefined {
  if (typeof value !== 'string') return undefined
  const type = value.toLowerCase()
  if (type === 'array') return 'list'
  if (type === 'integer') return 'number'
  return ['string', 'list', 'time', 'number'].includes(type)
    ? (type as MetadataValueType)
    : undefined
}

export function metadataConfigToFields(
  config: unknown,
): MetadataFieldDefinition[] {
  if (Array.isArray(config)) return config as MetadataFieldDefinition[]
  if (!isRecord(config) || !isRecord(config.properties)) return []
  return Object.entries(config.properties).map(([key, value]) => {
    const property = isRecord(value) ? value : {}
    const type = metadataValueType(property.type)
    const items = isRecord(property.items) ? property.items : {}
    const values = property.enum ?? items.enum
    return {
      key,
      ...(type ? { type } : {}),
      description:
        typeof property.description === 'string' ? property.description : '',
      enum: Array.isArray(values)
        ? values.filter(
            (item): item is string | number =>
              typeof item === 'string' || typeof item === 'number',
          )
        : undefined,
      ...(Array.isArray(property.examples)
        ? { examples: property.examples as Array<string | number> }
        : {}),
    }
  })
}

export function tableDataToSettings(
  data: MetadataTableData[],
): MetadataFieldDefinition[] {
  return data.map((item) => {
    const {
      name: _name,
      enum: _enum,
      examples: _examples,
      restrict_values: _restricted,
      restrictDefinedValues: _uiRestricted,
      ...original
    } = item.definition ?? { key: item.field }
    const restricted = item.restrictDefinedValues ?? item.values.length > 0
    return {
      ...original,
      key: item.field,
      ...(item.valueType ? { type: item.valueType } : {}),
      description: item.description,
      enum: restricted && item.values.length ? item.values : undefined,
      ...(!restricted && item.values.length ? { examples: item.values } : {}),
    }
  })
}

export function settingsToTableData(
  settings: MetadataFieldDefinition[],
): MetadataTableData[] {
  if (!Array.isArray(settings)) return []
  return settings.map((item) => ({
    field: item.key || String(item.name ?? ''),
    description: item.description || '',
    values: (item.enum ?? item.examples ?? []).map(String),
    restrictDefinedValues:
      !!item.enum?.length ||
      item.restrict_values === true ||
      item.restrictDefinedValues === true,
    valueType: metadataValueType(item.type),
    definition: item,
  }))
}

/** Preserve the stored schema and property constraints when editing its field view. */
export function metadataFieldsToConfig(
  fields: MetadataFieldDefinition[],
  source: unknown,
): MetadataDefinition {
  if (!isRecord(source) || !isRecord(source.properties)) return fields
  const old = source.properties
  const properties = Object.fromEntries(
    fields.map((field) => {
      const previous = old[field.key]
      const property: Record<string, unknown> = isRecord(previous)
        ? { ...previous }
        : {}
      property.description = field.description ?? ''
      if (field.type) {
        const type =
          field.type === 'list'
            ? 'array'
            : field.type === 'time'
              ? 'string'
              : field.type
        // An untouched integer schema retains its stricter original constraint.
        property.type =
          property.type === 'integer' && type === 'number' ? 'integer' : type
      }
      delete property.enum
      delete property.examples
      if (field.type === 'list') {
        const items: Record<string, unknown> = isRecord(property.items)
          ? { ...property.items }
          : { type: 'string' }
        delete items.enum
        if (field.enum?.length) items.enum = field.enum
        property.items = items
      } else if (field.enum?.length) {
        property.enum =
          field.type === 'number' ? field.enum.map(Number) : field.enum
      }
      if (field.examples?.length)
        property.examples =
          field.type === 'number'
            ? field.examples.map(Number)
            : field.type === 'list'
              ? field.examples.map((value) => [value])
              : field.examples
      return [field.key, property]
    }),
  )
  return {
    ...source,
    properties,
    ...(Array.isArray(source.required)
      ? {
          required: source.required.filter(
            (key) => typeof key === 'string' && key in properties,
          ),
        }
      : {}),
  }
}
