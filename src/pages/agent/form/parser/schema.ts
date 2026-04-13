import { z } from 'zod'

export const parserSchema = z.object({
  setups: z
    .array(
      z.object({
        fileFormat: z.string().optional(),
        suffix: z.array(z.string()).optional(),
        preprocess: z.array(z.string()).optional(),
        output_format: z.string().optional(),
        parse_method: z.string().optional(),
        lang: z.string().optional(),
        fields: z.array(z.string()).optional(),
        llm_id: z.string().optional(),
        system_prompt: z.string().optional(),
        prompt: z.string().optional(),
        table_result_type: z.string().optional(),
        markdown_image_response_type: z.string().optional(),
        mineru_parse_method: z.string().optional(),
        mineru_formula_enable: z.boolean().optional(),
        mineru_table_enable: z.boolean().optional(),
        mineru_lang: z.string().optional(),
        mineru_llm_name: z.string().optional(),
        paddleocr_parse_method: z.string().optional(),
        paddleocr_llm_name: z.string().optional(),
        docling_parse_method: z.string().optional(),
      }),
    )
    .optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

export type ParserFormValues = z.input<typeof parserSchema>
export type ParserSetupFormValue = NonNullable<ParserFormValues['setups']>[number]
