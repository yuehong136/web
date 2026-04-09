import { z } from 'zod'

export const parserSchema = z.object({
  setups: z
    .array(
      z.object({
        fileFormat: z.string().optional(),
        output_format: z.string().optional(),
        parse_method: z.string().optional(),
        lang: z.string().optional(),
        fields: z.string().optional(),
        llm_id: z.string().optional(),
        system_prompt: z.string().optional(),
        table_result_type: z.string().optional(),
        markdown_image_response_type: z.string().optional(),
      }),
    )
    .optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})
