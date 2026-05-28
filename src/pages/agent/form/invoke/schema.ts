import type { TFunction } from 'i18next'
import { z } from 'zod'

const placeholderRegex = /\{([a-zA-Z_][a-zA-Z0-9_.@-]*)\}/g

function isValidURL(value: string) {
  try {
    new URL(value.startsWith('http') ? value : `http://${value}`)
    return true
  } catch {
    return /^\/[a-zA-Z0-9]/.test(value)
  }
}

function isUrlOrPlaceholderUrl(value: string) {
  if (!value) {
    return false
  }

  const hasPlaceholders = value.includes('{') && value.includes('}')
  const matches = [...value.matchAll(placeholderRegex)]

  if (!hasPlaceholders) {
    return isValidURL(value)
  }

  if (
    !matches.length ||
    matches.some((match) => !/^[a-zA-Z_][a-zA-Z0-9_.@-]*$/.test(match[1]))
  ) {
    return false
  }

  if ((value.match(/{/g) || []).length !== (value.match(/}/g) || []).length) {
    return false
  }

  return isValidURL(value.replace(placeholderRegex, 'placeholder'))
}

export function createInvokeVariableSchema() {
  return z.object({
    key: z.string().trim().min(1),
    ref: z.string().optional(),
    value: z.string().optional(),
  })
}

export function createInvokeFormSchema(t: TFunction) {
  const variableSchema = createInvokeVariableSchema()

  return z
    .object({
      url: z.string().refine(isUrlOrPlaceholderUrl, {
        message: t(
          'flow.invalidUrl',
          'Must be a valid URL or contain placeholders like {variable_name} or {component@variable}',
        ),
      }),
      method: z.string().optional(),
      timeout: z.number().optional(),
      headers: z.string().optional(),
      proxy: z
        .string()
        .optional()
        .refine((value) => !value || isValidURL(value), {
          message: t('flow.invalidProxy', 'Proxy must be a valid URL.'),
        }),
      clean_html: z.boolean().optional(),
      datatype: z.string().optional(),
      variables: z.array(variableSchema).optional(),
      outputs: z.record(z.string(), z.any()).optional(),
    })
    .superRefine((data, ctx) => {
      const seen = new Map<string, number>()
      const variables = data.variables ?? []
      variables.forEach((variable, index) => {
        const key = variable.key?.trim()
        if (!key) {
          return
        }
        if (seen.has(key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['variables', index, 'key'],
            message: t(
              'flow.duplicateParameterKey',
              'Parameter key must be unique.',
            ),
          })
        } else {
          seen.set(key, index)
        }
      })
    })
}

// Back-compat aliases so external callers (if any are added) get a typed schema
// without having to pass `t`. Internally the form always uses the factory.
export type InvokeFormSchema = ReturnType<typeof createInvokeFormSchema>
export type InvokeVariableSchema = ReturnType<typeof createInvokeVariableSchema>
