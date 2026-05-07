import { TypesWithArray } from '../constant'

export const GLOBAL_VARIABLE_TYPE_OPTIONS = [
  { label: 'String', value: TypesWithArray.String },
  { label: 'Number', value: TypesWithArray.Number },
  { label: 'Boolean', value: TypesWithArray.Boolean },
  { label: 'Object', value: TypesWithArray.Object },
  { label: 'Array<String>', value: TypesWithArray.ArrayString },
  { label: 'Array<Number>', value: TypesWithArray.ArrayNumber },
  { label: 'Array<Boolean>', value: TypesWithArray.ArrayBoolean },
  { label: 'Array<Object>', value: TypesWithArray.ArrayObject },
] as const

export const JSON_VALUE_TYPES = new Set<string>([
  TypesWithArray.Object,
  TypesWithArray.ArrayString,
  TypesWithArray.ArrayNumber,
  TypesWithArray.ArrayBoolean,
  TypesWithArray.ArrayObject,
])

export const DEFAULT_GLOBAL_VARIABLE_FORM_VALUES = {
  name: '',
  type: TypesWithArray.String,
  value: '',
  description: '',
}
