import { z } from 'zod'

const beginInputOptionSchema = z.object({
  value: z.union([z.number(), z.string(), z.boolean()]),
})

export const beginInputSchema = z.object({
  key: z.string().trim().min(1),
  type: z.string().min(1),
  value: z.string(),
  optional: z.boolean(),
  name: z.string().trim().min(1),
  label: z.string().optional(),
  required: z.boolean().optional(),
  order: z.number().optional(),
  options: z.array(beginInputOptionSchema).optional(),
})

export const beginFormSchema = z.object({
  enablePrologue: z.boolean().optional(),
  prologue: z.string().optional(),
  mode: z.string().optional(),
  inputs: z.array(beginInputSchema).optional(),
  layout_recognize: z.string().optional(),
  methods: z.array(z.string()).optional(),
  content_types: z.string().optional(),
  execution_mode: z.string().optional(),
  security: z
    .object({
      auth_type: z.string().optional(),
      ip_whitelist: z
        .array(z.object({ value: z.string().optional() }))
        .optional(),
      token: z
        .object({
          token_header: z.string().optional(),
          token_value: z.string().optional(),
        })
        .optional(),
      basic_auth: z
        .object({
          username: z.string().optional(),
          password: z.string().optional(),
        })
        .optional(),
      rate_limit: z
        .object({
          limit: z.number().optional(),
          per: z.string().optional(),
        })
        .optional(),
      max_body_size: z.string().optional(),
      jwt: z
        .object({
          algorithm: z.string().optional(),
          secret: z.string().optional(),
          issuer: z.string().optional(),
          audience: z.string().optional(),
          required_claims: z
            .array(z.object({ value: z.string().optional() }))
            .optional(),
        })
        .optional(),
      hmac: z
        .object({
          header: z.string().optional(),
          secret: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  schema: z
    .object({
      query: z
        .array(
          z.object({
            key: z.string().optional(),
            type: z.string().optional(),
            required: z.boolean().optional(),
          }),
        )
        .optional(),
      headers: z
        .array(
          z.object({
            key: z.string().optional(),
            type: z.string().optional(),
            required: z.boolean().optional(),
          }),
        )
        .optional(),
      body: z
        .array(
          z.object({
            key: z.string().optional(),
            type: z.string().optional(),
            required: z.boolean().optional(),
          }),
        )
        .optional(),
    })
    .optional(),
  response: z
    .object({
      status: z.number().optional(),
      body_template: z.string().optional(),
    })
    .optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

export type BeginFormValues = z.infer<typeof beginFormSchema>
