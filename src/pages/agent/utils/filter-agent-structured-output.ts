import type { JSONSchema } from '@/components/jsonjoy-builder/types/json-schema'
import { get, isPlainObject, toLower } from 'lodash'
import { JsonSchemaDataType } from '../constant'

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

function predicate(types: string[], value: unknown) {
  return types.some(
    (x) =>
      toLower(x) === toLower(getStructuredDatatype(value).compositeDataType),
  )
}

export function hasSpecificTypeChild(
  data: Record<string, any> | Array<any>,
  types: string[] = [],
) {
  if (Array.isArray(data)) {
    for (const value of data) {
      if (isPlainObject(value) && predicate(types, value)) {
        return true
      }
      if (hasSpecificTypeChild(value, types)) {
        return true
      }
    }
  }

  if (isPlainObject(data)) {
    for (const value of Object.values(data)) {
      if (
        isPlainObject(value) &&
        predicate(types, value) &&
        get(data, 'type') !== JsonSchemaDataType.Array
      ) {
        return true
      }

      if (hasSpecificTypeChild(value, types)) {
        return true
      }
    }
  }

  return false
}

export function hasArrayChild(data: Record<string, any> | Array<any>) {
  return hasSpecificTypeChild(data, [JsonSchemaDataType.Array])
}

export function hasJsonSchemaChild(data: JSONSchema) {
  const properties = get(data, 'properties') ?? {}
  return isPlainObject(properties) && Object.keys(properties).length > 0
}
