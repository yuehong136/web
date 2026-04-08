import type {
  AgentExternalInputs,
  AgentShareInputField,
  AgentShareSummary,
} from '@/types/agent'

export function adaptAgentShareInputs(
  inputs: AgentExternalInputs['inputs'] | undefined,
): Record<string, AgentShareInputField> {
  return Object.fromEntries(
    Object.entries(inputs || {}).map(([key, value]) => [
      key,
      {
        key,
        type: value?.type || 'string',
        value: value?.value,
        optional: value?.optional ?? value?.required === false,
        required: value?.required ?? !value?.optional,
        name: value?.name || key,
        label: value?.label || value?.name || key,
        options: value?.options || [],
      },
    ]),
  )
}

export function adaptAgentShareSummary(
  payload: AgentExternalInputs | undefined,
): AgentShareSummary {
  return {
    avatar: payload?.avatar,
    title: payload?.title || 'Agent Share',
    prologue: payload?.prologue,
    mode: payload?.mode || 'conversation',
    inputs: adaptAgentShareInputs(payload?.inputs),
  }
}
