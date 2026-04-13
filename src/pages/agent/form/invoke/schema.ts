import { z } from 'zod'

export const invokeVariableSchema = z.object({
  key: z.string().trim().min(1),
  ref: z.string().optional(),
  value: z.string().optional(),
})

const placeholderRegex = /\{([a-zA-Z_][a-zA-Z0-9_.@-]*)\}/g

function isValidURL(value: string) {
  try {
    new URL(value.startsWith('http') ? value : `http://${value}`)
    return true
  } catch {
    return /^\/[a-zA-Z0-9]/.test(value)
  }
}

const urlValidation = z.string().refine((value) => {
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
}, 'Must be a valid URL')

export const invokeFormSchema = z.object({
  url: urlValidation,
  method: z.string().optional(),
  timeout: z.number().optional(),
  headers: z.string().optional(),
  proxy: z.string().optional(),
  clean_html: z.boolean().optional(),
  datatype: z.string().optional(),
  variables: z.array(invokeVariableSchema).optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})
