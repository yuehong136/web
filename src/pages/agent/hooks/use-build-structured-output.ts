import get from 'lodash/get.js'
import isPlainObject from 'lodash/isPlainObject.js'
import type { ReactNode } from 'react'
import { useCallback } from 'react'
import { AgentStructuredOutputField, JsonSchemaDataType, Operator } from '../constant'
import useGraphStore from '../store'

function splitValue(value?: string) {
  return typeof value === 'string' ? value.split('@') : []
}

function getNodeId(value: string) {
  return splitValue(value).at(0)
}

function getStructuredDatatype(value: Record<string, any> | unknown) {
  const dataType = get(value, 'type', JsonSchemaDataType.String) as string
  const arrayItemsType = get(value, 'items.type', JsonSchemaDataType.String)

  const compositeDataType =
    dataType === 'array'
      ? `${dataType}<${arrayItemsType}>`
      : dataType

  return { dataType, compositeDataType }
}

export function useShowSecondaryMenu() {
  const { getOperatorTypeFromId } = useGraphStore((state) => state)

  const showSecondaryMenu = useCallback(
    (value: string, outputLabel: string) => {
      const nodeId = getNodeId(value)
      return (
        getOperatorTypeFromId(nodeId) === Operator.Agent &&
        outputLabel === AgentStructuredOutputField
      )
    },
    [getOperatorTypeFromId],
  )

  return showSecondaryMenu
}

export function useGetStructuredOutputByValue() {
  const { getNode } = useGraphStore((state) => state)

  const getStructuredOutput = useCallback(
    (value: string) => {
      const node = getNode(getNodeId(value))
      const structuredOutput = get(
        node,
        `data.form.outputs.${AgentStructuredOutputField}`,
      )
      return structuredOutput
    },
    [getNode],
  )

  return getStructuredOutput
}

export function useFindAgentStructuredOutputLabel() {
  const getOperatorTypeFromId = useGraphStore(
    (state) => state.getOperatorTypeFromId,
  )

  const findAgentStructuredOutputLabel = useCallback(
    (
      value: string,
      options: Array<{
        label: string
        value: string
        parentLabel?: string | ReactNode
        icon?: ReactNode
      }>,
    ) => {
      const fields = splitValue(value)
      if (
        getOperatorTypeFromId(fields.at(0)) === Operator.Agent &&
        fields.at(1)?.startsWith(AgentStructuredOutputField)
      ) {
        const agentOption = options.find((x) => value.includes(x.value))
        const jsonSchemaFields = fields
          .at(1)
          ?.slice(AgentStructuredOutputField.length)

        return {
          ...agentOption,
          label: (agentOption?.label ?? '') + jsonSchemaFields,
          value: value,
        }
      }
    },
    [getOperatorTypeFromId],
  )

  return findAgentStructuredOutputLabel
}

export function useFindAgentStructuredOutputTypeByValue() {
  const { getOperatorTypeFromId } = useGraphStore((state) => state)
  const filterStructuredOutput = useGetStructuredOutputByValue()

  const findTypeByValue = useCallback(
    (values: unknown, target: string, path: string = ''): string | undefined => {
      const properties =
        get(values, 'properties') || get(values, 'items.properties')

      if (isPlainObject(values) && properties) {
        for (const [key, value] of Object.entries(properties)) {
          const nextPath = path ? `${path}.${key}` : key
          const { dataType, compositeDataType } = getStructuredDatatype(value)

          if (nextPath === target) {
            return compositeDataType
          }

          if (
            ['object', 'array'].includes(dataType)
          ) {
            const type = findTypeByValue(value, target, nextPath)
            if (type) {
              return type
            }
          }
        }
      }
    },
    [],
  )

  const findAgentStructuredOutputTypeByValue = useCallback(
    (value?: string) => {
      if (!value) return undefined
      const fields = splitValue(value)
      const nodeId = fields.at(0)
      const jsonSchema = filterStructuredOutput(value)

      if (
        getOperatorTypeFromId(nodeId) === Operator.Agent &&
        fields.at(1)?.startsWith(AgentStructuredOutputField)
      ) {
        const jsonSchemaFields = fields
          .at(1)
          ?.slice(AgentStructuredOutputField.length + 1)

        if (jsonSchemaFields) {
          return findTypeByValue(jsonSchema, jsonSchemaFields)
        }
      }
    },
    [filterStructuredOutput, findTypeByValue, getOperatorTypeFromId],
  )

  return findAgentStructuredOutputTypeByValue
}

export function useFindAgentStructuredOutputLabelByValue() {
  const { getNode } = useGraphStore((state) => state)

  const findAgentStructuredOutputLabel = useCallback(
    (value?: string) => {
      if (value) {
        const operatorName = getNode(getNodeId(value ?? ''))?.data.name
        if (operatorName) {
          return operatorName + ' / ' + splitValue(value).at(1)
        }
      }
      return ''
    },
    [getNode],
  )

  return findAgentStructuredOutputLabel
}
