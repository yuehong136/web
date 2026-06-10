import { JsonSchemaDataType } from '../constant'

export const CodeContentOutputKey = 'content'

export type CodeOutputMap = Record<
  string,
  {
    type?: string
    value?: unknown
    ref?: string
  }
>

const createCodeContentOutput = () => ({
  type: JsonSchemaDataType.String,
  value: '',
})

export function getCodeNodeOutputs(
  outputs: CodeOutputMap | undefined,
): CodeOutputMap {
  return {
    ...(outputs ?? {}),
    [CodeContentOutputKey]:
      outputs?.[CodeContentOutputKey] ?? createCodeContentOutput(),
  }
}
