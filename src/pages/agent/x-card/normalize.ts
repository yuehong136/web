import type { AgentXCardActionPayload, AgentXCardCommand, A2UICommandEventData } from './types'
import { A2UI_CATALOG_ID } from './types'

export const A2UI_INTERNAL_DATA_PATH_PREFIX = '__a2ui_data_path__:'

const COMMAND_KEYS = [
  'createSurface',
  'updateComponents',
  'updateDataModel',
  'deleteSurface',
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function getCommandSurfaceId(command: AgentXCardCommand) {
  const record = command as unknown as Record<string, unknown>
  for (const key of COMMAND_KEYS) {
    if (key in record) {
      const payload = record[key]
      return isRecord(payload) && typeof payload.surfaceId === 'string'
        ? payload.surfaceId
        : undefined
    }
  }
  return undefined
}

export function normalizeA2UICommandEventData(
  data: unknown,
): A2UICommandEventData {
  if (!isRecord(data)) {
    return {}
  }

  const commands = Array.isArray(data.commands)
    ? (data.commands.filter(
        (command): command is AgentXCardCommand =>
          isRecord(command) && command.version === 'v0.9',
      ) as AgentXCardCommand[])
    : []

  const surfaceIds = Array.isArray(data.surface_ids)
    ? data.surface_ids.filter(
        (surfaceId): surfaceId is string => typeof surfaceId === 'string',
      )
    : typeof data.surface_id === 'string'
      ? [data.surface_id]
      : commands
          .map(getCommandSurfaceId)
          .filter((surfaceId): surfaceId is string => Boolean(surfaceId))

  return {
    surface_id: typeof data.surface_id === 'string' ? data.surface_id : surfaceIds[0],
    surface_ids: Array.from(new Set(surfaceIds)),
    commands,
  }
}

export function mergeSurfaceIds(
  current: string[] | undefined,
  incoming: string[] | undefined,
) {
  return Array.from(new Set([...(current || []), ...(incoming || [])]))
}

function stringifyActionContext(value: unknown) {
  try {
    return JSON.stringify(value ?? {}, null, 2)
  } catch {
    return '{}'
  }
}

function buildA2UIActionQuery(params: {
  name: string
  surfaceId: string
  sourceComponentId: string
  context: Record<string, unknown>
}) {
  return [
    `用户触发了卡片操作：${params.name}`,
    '',
    'A2UI action:',
    `- surfaceId: ${params.surfaceId}`,
    `- sourceComponentId: ${params.sourceComponentId}`,
    '',
    '表单数据(JSON):',
    stringifyActionContext(params.context),
  ].join('\n')
}

export function buildA2UIActionInput(payload: AgentXCardActionPayload) {
  const timestamp = payload.timestamp || new Date().toISOString()
  const sourceComponentId = payload.sourceComponentId || 'unknown'
  const enrichedContext = payload.displayContext || payload.context || {}

  return {
    query: buildA2UIActionQuery({
      name: payload.name,
      surfaceId: payload.surfaceId,
      sourceComponentId,
      context: enrichedContext,
    }),
    a2ui: [
      {
        version: 'v0.9',
        action: {
          name: payload.name,
          surfaceId: payload.surfaceId,
          sourceComponentId,
          timestamp,
          context: enrichedContext,
        },
      },
    ],
    metadata: {
      a2uiClientCapabilities: {
        'v0.9': {
          supportedCatalogIds: [
            A2UI_CATALOG_ID,
          ],
          inlineCatalogs: [],
        },
      },
      a2uiClientContext: {
        version: 'v0.9',
        surfaces: {
          [payload.surfaceId]: enrichedContext,
        },
      },
    },
  }
}

function getPathValue(value: unknown) {
  return isRecord(value) && typeof value.path === 'string'
    ? value.path
    : undefined
}

function normalizeChoiceOptions(value: unknown) {
  if (!Array.isArray(value)) {
    return new Map<string, string>()
  }

  return new Map(
    value
      .filter(isRecord)
      .map((option) => {
        const optionValue = option.value
        const optionLabel = option.label ?? option.value
        return [
          typeof optionValue === 'string' ? optionValue : String(optionValue ?? ''),
          typeof optionLabel === 'string' ? optionLabel : String(optionLabel ?? ''),
        ] as const
      })
      .filter(([optionValue]) => optionValue),
  )
}

export interface ValueLabelPair {
  value: unknown
  label: unknown
}

function pairChoiceValue(
  value: unknown,
  labels: Map<string, string>,
): ValueLabelPair | ValueLabelPair[] | unknown {
  if (Array.isArray(value)) {
    return value.map((item) => pairChoiceValue(item, labels)) as ValueLabelPair[]
  }

  if (typeof value === 'string') {
    const label = labels.get(value)
    if (label === undefined && import.meta.env?.DEV) {
      console.warn(
        `[a2ui] enrichContextWithLabels: value "${value}" missing from ChoicePicker options`,
      )
    }
    return { value, label: label ?? value }
  }

  return value
}

export function enrichContextWithLabels(
  commands: AgentXCardCommand[] = [],
  payload: AgentXCardActionPayload,
): Record<string, unknown> {
  const context = payload.context || {}
  const labelsByPath = new Map<string, Map<string, string>>()
  const pathsByActionKey = new Map<string, string>()

  for (const command of commands) {
    const record = command as unknown as Record<string, unknown>
    const updateComponents = record.updateComponents
    if (!isRecord(updateComponents) || updateComponents.surfaceId !== payload.surfaceId) {
      continue
    }

    const components = updateComponents.components
    if (!Array.isArray(components)) {
      continue
    }

    for (const component of components) {
      if (!isRecord(component)) {
        continue
      }

      if (component.component === 'ChoicePicker') {
        const valuePath = getPathValue(component.value)
        if (valuePath) {
          labelsByPath.set(valuePath, normalizeChoiceOptions(component.options))
        }
      }

      const actionEvent = isRecord(component.action) && isRecord(component.action.event)
        ? component.action.event
        : undefined
      if (
        component.id === payload.sourceComponentId &&
        actionEvent?.name === payload.name &&
        isRecord(actionEvent.context)
      ) {
        for (const [key, binding] of Object.entries(actionEvent.context)) {
          const path = getPathValue(binding)
          if (path) {
            pathsByActionKey.set(key, path)
          }
        }
      }
    }
  }

  return Object.entries(context).reduce<Record<string, unknown>>((result, [key, value]) => {
    const path = pathsByActionKey.get(key) || `/${key}`
    const labels = labelsByPath.get(path)
    result[key] = labels ? pairChoiceValue(value, labels) : value
    return result
  }, {})
}

function withInternalBindingPath(component: Record<string, unknown>) {
  if (
    !['CheckBox', 'ChoicePicker', 'DateTimeInput', 'Slider', 'TextField'].includes(
      String(component.component),
    )
  ) {
    return component
  }

  const writablePath = getPathValue(component.value)
  return writablePath
    ? { ...component, dataPath: `${A2UI_INTERNAL_DATA_PATH_PREFIX}${writablePath}` }
    : component
}

function withInternalBasicCatalogShape(component: Record<string, unknown>) {
  if (component.component === 'List' && isRecord(component.children)) {
    const children = component.children
    const itemsPath = typeof children.path === 'string' ? children.path : undefined
    return {
      ...component,
      children: undefined,
      items: itemsPath ? { path: itemsPath } : undefined,
      itemsPath,
      templateComponentId:
        typeof children.componentId === 'string' ? children.componentId : undefined,
    }
  }

  if (component.component === 'Tabs' && Array.isArray(component.tabs)) {
    const tabs = component.tabs.filter(isRecord)
    const children = tabs
      .map((tab) => tab.child)
      .filter((child): child is string => typeof child === 'string')
    const tabTitles = tabs
      .map((tab) => tab.title)
      .filter((title): title is string => typeof title === 'string')

    return children.length ? { ...component, children, tabTitles } : component
  }

  if (component.component === 'Modal') {
    const children = [component.trigger, component.content].filter(
      (child): child is string => typeof child === 'string',
    )

    return children.length ? { ...component, children } : component
  }

  return component
}

export function normalizeCommandsForXCardRenderer(
  commands: AgentXCardCommand[] = [],
): AgentXCardCommand[] {
  return commands.map((command) => {
    const record = command as unknown as Record<string, unknown>
    const updateComponents = record.updateComponents

    if (!isRecord(updateComponents) || !Array.isArray(updateComponents.components)) {
      return command
    }

    return {
      ...record,
      updateComponents: {
        ...updateComponents,
        components: updateComponents.components
          .filter(isRecord)
          .map(withInternalBasicCatalogShape)
          .map(withInternalBindingPath),
      },
    } as unknown as AgentXCardCommand
  })
}
