import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Translation } from '../i18n/translation-keys'
import type { SchemaType } from '../types/json-schema'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTypeColor(type: SchemaType): string {
  switch (type) {
    case 'string':
      return 'bg-components-api-status-info-bg text-components-api-status-info-text'
    case 'number':
    case 'integer':
      return 'bg-components-api-status-warning-bg text-components-api-status-warning-text'
    case 'boolean':
      return 'bg-components-api-status-success-bg text-components-api-status-success-text'
    case 'object':
      return 'bg-surface-secondary text-text-secondary'
    case 'array':
      return 'bg-surface-tertiary text-text-secondary'
    case 'null':
      return 'bg-surface-secondary text-text-caption'
  }
}

export function getTypeLabel(t: Translation, type: SchemaType): string {
  switch (type) {
    case 'string':
      return t.schemaTypeString
    case 'number':
      return t.schemaTypeNumber
    case 'integer':
      return 'Integer'
    case 'boolean':
      return t.schemaTypeBoolean
    case 'object':
      return t.schemaTypeObject
    case 'array':
      return t.schemaTypeArray
    case 'null':
      return t.schemaTypeNull
  }
}
