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
      return 'bg-avatar-6-bg text-avatar-6-fg'
    case 'number':
    case 'integer':
      return 'bg-avatar-2-bg text-avatar-2-fg'
    case 'boolean':
      return 'bg-avatar-4-bg text-avatar-4-fg'
    case 'object':
      return 'bg-sunken text-fg-muted'
    case 'array':
      return 'bg-canvas text-fg-muted'
    case 'null':
      return 'bg-sunken text-fg-subtle'
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
