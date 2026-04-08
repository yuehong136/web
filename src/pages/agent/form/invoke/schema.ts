import { z } from 'zod'

export const invokeFormSchema = z.object({
  url: z.string().optional(),
  method: z.string().optional(),
  timeout: z.coerce.number().optional(),
  headers: z.string().optional(),
  proxy: z.string().optional(),
  clean_html: z.boolean().optional(),
  variables: z.array(z.any()).optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})
