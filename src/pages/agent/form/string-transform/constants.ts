import {
  StringTransformDelimiter,
  StringTransformMethod,
} from '../../constant'

export const defaultStringTransformDelimiter =
  StringTransformDelimiter.Comma

export const stringTransformMethodOptions = [
  StringTransformMethod.Merge,
  StringTransformMethod.Split,
]
