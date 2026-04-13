import type { OutputMap } from '../components/output'

export const extractorFieldName = {
  Summary: 'summary',
  Keywords: 'keywords',
  Questions: 'questions',
  Metadata: 'metadata',
  Toc: 'toc',
} as const

export const extractorOutputs: OutputMap = {
  chunks: { type: 'Array<Object>', value: [] },
}

export const extractorPromptPresetMap: Record<
  string,
  { sys_prompt: string; prompts: string }
> = {
  [extractorFieldName.Summary]: {
    sys_prompt:
      'Extract a concise summary for each chunk. Keep factual details and avoid unrelated commentary.',
    prompts: 'Summarize the following content:\n\n{Parser@text}',
  },
  [extractorFieldName.Keywords]: {
    sys_prompt:
      'Extract a compact list of keywords for each chunk. Return the keywords as plain text.',
    prompts: 'Extract the most important keywords from:\n\n{Parser@text}',
  },
  [extractorFieldName.Questions]: {
    sys_prompt:
      'Generate answerable questions grounded in the chunk content. Focus on high-signal questions only.',
    prompts: 'Generate grounded questions for:\n\n{Parser@text}',
  },
  [extractorFieldName.Metadata]: {
    sys_prompt:
      'Extract structured metadata grounded in the chunk content. Do not invent missing values.',
    prompts: 'Extract useful metadata fields from:\n\n{Parser@text}',
  },
  [extractorFieldName.Toc]: {
    sys_prompt: '',
    prompts: 'Generate a table of contents from the chunk sequence.',
  },
}

export function getExtractorPromptPreset(fieldName?: string) {
  return (
    extractorPromptPresetMap[fieldName || ''] ||
    extractorPromptPresetMap[extractorFieldName.Summary]
  )
}

export function normalizeExtractorFormForStore(
  form: Record<string, unknown> = {},
) {
  const fieldName =
    typeof form.field_name === 'string' && form.field_name
      ? form.field_name
      : extractorFieldName.Summary
  const preset = getExtractorPromptPreset(fieldName)

  return {
    ...form,
    field_name: fieldName,
    sys_prompt:
      typeof form.sys_prompt === 'string' ? form.sys_prompt : preset.sys_prompt,
    prompts:
      typeof form.prompts === 'string' ? form.prompts : preset.prompts,
    outputs: extractorOutputs,
  }
}

export function serializeExtractorFormForDsl(
  form: Record<string, unknown> = {},
) {
  const nextForm = normalizeExtractorFormForStore(form)

  return {
    ...nextForm,
    outputs: extractorOutputs,
    prompts: [
      {
        role: 'user',
        content: typeof nextForm.prompts === 'string' ? nextForm.prompts : '',
      },
    ],
  }
}
