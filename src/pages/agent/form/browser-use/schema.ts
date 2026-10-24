import { z } from 'zod'

export const browserFormSchema = z.object({
  llm_id: z.string().refine((value) => value.trim().length > 0),
  prompts: z.string().refine((value) => value.trim().length > 0),
  max_steps: z.number().int().positive(),
  temperature: z.number().min(0).max(2),
  max_retries: z.number().int().nonnegative(),
  headless: z.boolean(),
  enable_default_extensions: z.boolean(),
  chromium_sandbox: z.boolean(),
  persist_session: z.boolean(),
  upload_sources: z.array(
    z.union([z.string(), z.record(z.string(), z.unknown())]),
  ),
  outputs: z.record(
    z.string(),
    z.object({ type: z.string(), value: z.unknown() }),
  ),
})
