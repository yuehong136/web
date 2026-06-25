import { JsonSchemaDataType } from '../constant'

export const CodeContentOutputKey = 'content'
export const CodeActualTypeOutputKey = 'actual_type'
export const CodeRawResultOutputKey = 'raw_result'
export const CodeAttachmentsOutputKey = 'attachments'

export const CodeExecReservedOutputKeys = [
  CodeContentOutputKey,
  CodeActualTypeOutputKey,
  CodeRawResultOutputKey,
  CodeAttachmentsOutputKey,
  '_ERROR',
  '_ARTIFACTS',
  '_ATTACHMENT_CONTENT',
  '_created_time',
  '_elapsed_time',
] as const

export type CodeOutputMap = Record<
  string,
  {
    type?: string
    value?: unknown
    ref?: string
  }
>

export type CodeOutputContract = {
  name: string
  type: string
}

export type DeserializeCodeOutputResult = {
  contract: CodeOutputContract
}

const CodeExecReservedOutputKeySet = new Set<string>(CodeExecReservedOutputKeys)

export const CodeExecPanelSystemOutputs: CodeOutputMap = {
  [CodeContentOutputKey]: {
    type: JsonSchemaDataType.String,
    value: '',
  },
  [CodeActualTypeOutputKey]: {
    type: JsonSchemaDataType.String,
    value: '',
  },
  [CodeRawResultOutputKey]: {
    type: JsonSchemaDataType.Object,
    value: null,
  },
  [CodeAttachmentsOutputKey]: {
    type: 'array<string>',
    value: [],
  },
}

export function buildDefaultCodeOutput(): CodeOutputContract {
  return {
    name: 'result',
    type: JsonSchemaDataType.String,
  }
}

export function isCodeExecReservedOutputName(name: string): boolean {
  return CodeExecReservedOutputKeySet.has(name.trim())
}

export function isValidCodeOutputName(name: string): boolean {
  const value = name.trim()

  return (
    Boolean(value) &&
    !isCodeExecReservedOutputName(value) &&
    !value.includes('.')
  )
}

export function getBusinessOutputs(outputs: CodeOutputMap = {}): CodeOutputMap {
  return Object.entries(outputs).reduce<CodeOutputMap>(
    (result, [name, value]) => {
      if (!isCodeExecReservedOutputName(name)) {
        result[name] = value
      }

      return result
    },
    {},
  )
}

export function deserializeCodeOutputContract(
  form?: { outputs?: CodeOutputMap } | null,
): DeserializeCodeOutputResult {
  const businessOutputs = Object.entries(
    getBusinessOutputs(form?.outputs ?? {}),
  )

  if (businessOutputs.length !== 1) {
    return {
      contract: buildDefaultCodeOutput(),
    }
  }

  const businessOutput = businessOutputs[0]
  if (!businessOutput) {
    return {
      contract: buildDefaultCodeOutput(),
    }
  }

  const [name, output] = businessOutput

  return {
    contract: {
      name,
      type: output.type ?? JsonSchemaDataType.String,
    },
  }
}

export function serializeCodeOutputContract(
  contract: CodeOutputContract | null,
): CodeOutputMap {
  const name = contract?.name?.trim()
  const type = contract?.type?.trim()

  if (!name || !type || !isValidCodeOutputName(name)) {
    return {}
  }

  return {
    [name]: {
      type,
      value: null,
    },
  }
}

export function getCodeNodeOutputs(
  outputs: CodeOutputMap | undefined,
): CodeOutputMap {
  return {
    ...(outputs ?? {}),
    ...Object.fromEntries(
      Object.entries(CodeExecPanelSystemOutputs).map(([name, value]) => [
        name,
        outputs?.[name] ?? value,
      ]),
    ),
  }
}
